#!/usr/bin/python
# -*- coding: utf-8 -*-

import logging
import time
import math
import collections

from pgoapi import PGoApi
from pgoapi.utilities import f2i

from geographiclib.geodesic import Geodesic

from . import config
from .utils import get_cellids, get_pos_by_name
from .models import parse_map, init_database

log = logging.getLogger(__name__)
api = PGoApi()
queue = collections.deque()
consecutive_map_fails = 0
scan_start_time = 0
min_time_per_scan = 3 * 60

def set_cover():
    lat = config['ORIGINAL_LATITUDE']
    lng = config['ORIGINAL_LONGITUDE']

    d = math.sqrt(3) * 100
    points = [[{'lat2': lat, 'lon2': lng, 's': 0}]]

    i = 1
    while True:
        oor_counter = 0

        points.append([])
        for j in range(0, 6 * i):
            p = points[i - 1][int(j - j / i - 1 + (j % i == 0))]
            p_new = Geodesic.WGS84.Direct(p['lat2'], p['lon2'], (j+i-1)/i * 60, d)
            p_new['s'] = Geodesic.WGS84.Inverse(p_new['lat2'], p_new['lon2'], lat, lng)['s12']
            points[i].append(p_new)

            if p_new['s'] > config['RADIUS']:
                oor_counter += 1

        if oor_counter == 6 * i:
            break

        i += 1

    cover = [{"lat": p['lat2'], "lng": p['lon2']}
             for sublist in points for p in sublist if p['s'] < config['RADIUS']]
    config['COVER'] = cover

def set_location(location, radius):
    position = get_pos_by_name(location)
    log.info('Parsed location is: {:.4f}/{:.4f}/{:.4f} (lat/lng/alt)'.
             format(*position))

    config['ORIGINAL_LATITUDE'] = position[0]
    config['ORIGINAL_LONGITUDE'] = position[1]
    config['CHANGE'] = False
    config['RADIUS'] = radius

def send_map_request(api, position):
    try:
        lat = position[0]
        lng = position[1]
        cell_ids = get_cellids(lat, lng)
        api.set_position(*position)
        api.get_map_objects(latitude=f2i(lat),
                            longitude=f2i(lng),
                            since_timestamp_ms=[0,] * len(cell_ids),
                            cell_id=cell_ids)
        return api.call()
    except Exception as e:
        log.warning("Uncaught exception when downloading map " + str(e))
        return False


def generate_location_steps(initial_location, num_steps):
    ring = 1 #Which ring are we on, 0 = center
    lat_location = initial_location[0]
    lng_location = initial_location[1]

    yield (initial_location[0],initial_location[1], 0) #Middle circle

    while ring < num_steps:
        #Move the location diagonally to top left spot, then start the circle which will end up back here for the next ring
        #Move Lat north first
        lat_location += lat_gap_degrees
        lng_location -= calculate_lng_degrees(lat_location)

        for direction in range(6):
            for i in range(ring):
                if direction == 0: #Right
                    lng_location += calculate_lng_degrees(lat_location) * 2

                if direction == 1: #Right Down
                    lat_location -= lat_gap_degrees
                    lng_location += calculate_lng_degrees(lat_location)

                if direction == 2: #Left Down
                    lat_location -= lat_gap_degrees
                    lng_location -= calculate_lng_degrees(lat_location)

                if direction == 3: #Left
                    lng_location -= calculate_lng_degrees(lat_location) * 2

                if direction == 4: #Left Up
                    lat_location += lat_gap_degrees
                    lng_location -= calculate_lng_degrees(lat_location)

                if direction == 5: #Right Up
                    lat_location += lat_gap_degrees
                    lng_location += calculate_lng_degrees(lat_location)

                yield (lat_location, lng_location, 0) #Middle circle

        ring += 1


def login(args, position):
    log.info('Attempting login to Pokemon Go.')

    api.set_position(*position)

    while not api.login(args.auth_service, args.username, args.password):
        log.info('Failed to login to Pokemon Go. Trying again.')
        time.sleep(config['REQ_SLEEP'])

    log.info('Login to Pokemon Go successful.')

def callback(response_dict):
    rdb = init_database()

    global consecutive_map_fails
    if (not response_dict) or ('responses' in response_dict and not response_dict['responses']):
        log.info('Map Download failed. Trying again.')
        consecutive_map_fails += 1
        return

    try:
        parse_map(response_dict)
        config['LAST_SUCCESSFUL_REQUEST'] = time.time()
        consecutive_map_fails = 0
        log.debug("Parsed & saved.")
    except KeyError:
        log.exception('Failed to parse response: {}'.format(response_dict))
        consecutive_map_fails += 1
    except:  # make sure we dont crash in the main loop
        log.exception('Unexpected error when parsing response: {}'.format(response_dict))
        consecutive_map_fails += 1

    rdb.close()

def login_if_necessary(args, position):
    if api._rpc.auth_provider and api._rpc.auth_provider._ticket_expire:
        remaining_time = api._rpc.auth_provider._ticket_expire / 1000 - time.time()

        if remaining_time < 60:
            log.info("Login has or is about to expire")
            login(args, position)
    else:
        login(args, position)

def error_throttle():
    if consecutive_map_fails == 0:
        return

    sleep_t = min(math.exp(1.0 * consecutive_map_fails / 5) - 1, 2*60)
    log.info('Loading map failed, waiting {:.5f} seconds'.format(sleep_t))

    start_sleep = time.time()
    api.finish_async(sleep_t)
    time.sleep(max(start_sleep + sleep_t - time.time(), 0))

def search(args):
    num_steps = len(config['COVER'])

    login_if_necessary(args, (config['ORIGINAL_LATITUDE'], config['ORIGINAL_LONGITUDE'], 0))
    log.info("Starting scan of {} locations".format(num_steps))

    i = 1
    while len(queue) > 0:
        c = queue.pop()
        step_location = (c["lat"], c["lng"], 0)
        log.debug('Scanning step {:d} of {:d}.'.format(i, num_steps))
        log.debug('Scan location is {:f}, {:f}'.format(step_location[0], step_location[1]))
        login_if_necessary(args, step_location)
        error_throttle()
        api.set_position(*step_location)
        cell_ids = get_cellids(*step_location)
        api.get_map_objects(latitude=f2i(step_location[0]),
                            longitude=f2i(step_location[1]),
                            since_timestamp_ms=[0,] * len(cell_ids),
                            cell_id=cell_ids)
        api.call_async(callback)

        if config['CHANGE']:
            log.info("Changing scan location")
            config['CHANGE'] = False
            queue.clear()
            queue.extend(config['COVER'])

        if (i%20 == 0):
            log.debug(api._rpc._curl.stats())

        i += 1

    api.finish_async()
    log.info(api._rpc._curl.stats())
    api._rpc._curl.reset_stats()


def throttle():
    if scan_start_time == 0:
        return

    sleep_time = max(min_time_per_scan - (time.time() - scan_start_time), 0)
    log.info("Scan finished. Sleeping {:.2f} seconds before continuing.".format(sleep_time))
    config['LAST_SUCCESSFUL_REQUEST'] = -1
    time.sleep(sleep_time)


def search_loop(args):
    global scan_start_time
    while True:
        throttle()

        scan_start_time = time.time()
        queue.extend(config['COVER'][::-1])
        search(args)
        config['COMPLETE_SCAN_TIME'] = time.time() - scan_start_time
