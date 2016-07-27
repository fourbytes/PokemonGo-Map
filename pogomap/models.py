#!/usr/bin/python
# -*- coding: utf-8 -*-

import logging
import pytz
import rethinkdb as r
from datetime import datetime
from datetime import timedelta

from . import config
from .utils import get_pokemon_name, get_args

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(module)12s] [%(levelname)7s] %(message)s')

log = logging.getLogger(__name__)

args = get_args()

UNCONTESTED = 0
TEAM_MYSTIC = 1
TEAM_VALOR = 2
TEAM_INSTINCT = 3


def init_database():
    try:
        conn = r.connect(host=config['db_host'], port=config['db_port'], db=config['db_name'], user=config['db_user'], password=config['db_pass'])
        conn.repl()

        if not r.db_list().contains(config['db_name']).run():
            log.info('Creating database...')
            r.db_create(config['db_name']).run()

        return conn
    except r.ReqlDriverError as e:
        log.error('Failed to connect to rethinkdb: {}'.format(e))
        exit(1)

def create_tables():
    for table in ('pokemon', 'pokestops', 'gyms'):
        if not r.table_list().contains(table).run():
            r.table_create(table).run()
            log.info('Created table "{}"'.format(table))

def utc_localize(dt):
    if dt is None:
        return

    utc = pytz.timezone('UTC')
    return utc.localize(dt)

def process_pokemon_dict(p):
    # We don't need this stored in the db so we'll just get it as we retrieve it.
    p['pokemon_name'] = get_pokemon_name(p['pokemon_id']).capitalize()

    return p

def in_bounds(swLat, swLng, neLat, neLng):
    return lambda row: ((row['latitude'] >= swLat) &
                        (row['longitude'] >= swLng) &
                        (row['latitude'] <= neLat) &
                        (row['longitude'] <= neLng))

def get_active_pokemon(swLat, swLng, neLat, neLng):
    return map(process_pokemon_dict, r.table('pokemon') \
                                      .filter(in_bounds(swLat, swLng, neLat, neLng)) \
                                      .filter(r.row['disappear_time'] > utc_localize(datetime.utcnow())).run())

def get_active_pokemon_by_id(pid):
    return map(process_pokemon_dict, r.table('pokemon') \
                                      .filter(r.row['disappear_time'] > utc_localize(datetime.utcnow()) &
                                              r.row['pokemon_id'] == pid).run())

def get_pokestops(swLat, swLng, neLat, neLng):
    return r.table('pokestops').filter(in_bounds(swLat, swLng, neLat, neLng)).run()

def get_gyms(swLat, swLng, neLat, neLng):
    return r.table('gyms').filter(in_bounds(swLat, swLng, neLat, neLng)).run()

def get_recently_scanned(swLat, swLng, neLat, neLng):
    min_dt = utc_localize(datetime.utcnow() - timedelta(minutes=15))

    return r.table('scanned') \
            .filter(in_bounds(swLat, swLng, neLat, neLng)) \
            .filter(lambda scan: scan['last_modified'] >= min_dt).run()

def parse_map(map_dict):
    pokemon_list = []
    pokestops = []
    gyms = []

    cells = map_dict['responses']['GET_MAP_OBJECTS']['map_cells']
    for cell in cells:
        for p in cell.get('wild_pokemons', []):
            if p['encounter_id'] in pokemon_list:
                continue  # prevent unnecessary parsing

            dt = datetime.utcfromtimestamp(
                (p['last_modified_timestamp_ms'] +
                 p['time_till_hidden_ms']) / 1000.0)

            pokemon_list.append({
                'id': p['encounter_id'],
                'spawnpoint_id': p['spawn_point_id'],
                'pokemon_id': p['pokemon_data']['pokemon_id'],
                'latitude': p['latitude'],
                'longitude': p['longitude'],
                'disappear_time': utc_localize(dt)
            })

        for p in cell.get('catchable_pokemons', []):
            if p['encounter_id'] in map(lambda x: x['id'], pokemon_list):
                continue  # prevent unnecessary parsing

            log.critical("found catchable pokemon not in wild: {}".format(p))

            dt = datetime.utcfromtimestamp(
                (p['last_modified_timestamp_ms'] +
                 p['time_till_hidden_ms']) / 1000.0)
            pokemon_list.append({
                'id': p['encounter_id'],
                'spawnpoint_id': p['spawnpoint_id'],
                'pokemon_id': p['pokemon_data']['pokemon_id'],
                'latitude': p['latitude'],
                'longitude': p['longitude'],
                'disappear_time': utc_localize(dt)
            })

        for f in cell.get('forts', []):
            if f['id'] in gyms or f['id'] in pokestops:
                continue  # prevent unnecessary parsing

            if f.get('type') == 1:  # Pokestops
                if 'lure_info' in f:
                    lure_expiration = datetime.utcfromtimestamp(
                            f['lure_info']['lure_expires_timestamp_ms'] / 1000.0)
                    active_pokemon_id = f['lure_info']['active_pokemon_id']
                else:
                    lure_expiration, active_pokemon_id = None, None

                pokestops.append({
                    'id': f['id'],
                    'enabled': f['enabled'],
                    'latitude': f['latitude'],
                    'longitude': f['longitude'],
                    'last_modified': utc_localize(datetime.utcfromtimestamp(f['last_modified_timestamp_ms'] / 1000.0)),
                    'lure_expiration': utc_localize(lure_expiration),
                    'active_pokemon_id': active_pokemon_id
                })

            else:
                gyms.append({
                    'id': f['id'],
                    'team_id': f.get('owned_by_team', 0),
                    'guard_pokemon_id': f.get('guard_pokemon_id', 0),
                    'gym_points': f.get('gym_points', 0),
                    'enabled': f['enabled'],
                    'latitude': f['latitude'],
                    'longitude': f['longitude'],
                    'last_modified': utc_localize(datetime.utcfromtimestamp(
                        f['last_modified_timestamp_ms'] / 1000.0)),
                })

    if pokemon_list and config['parse_pokemon']:
        log.debug("Inserting {} pokemon".format(len(pokemon_list)))
        r.table('pokemon').insert(pokemon_list, conflict='update').run()

    if pokestops and config['parse_pokestops']:
        log.debug("Inserting {} pokestops".format(len(pokestops)))
        r.table('pokestops').insert(pokestops, conflict='update').run()

    if gyms and config['parse_gyms']:
        log.debug("Inserting {} gyms".format(len(gyms)))
        r.table('gyms').insert(gyms, conflict='update').run()
