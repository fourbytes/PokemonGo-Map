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

    for index, table in [('disappear_time', 'pokemon')]:
        if index not in r.table(table).index_list().run():
            # Create index for some fields, this _should_ improve performance
            # when filtering and sorting by this field.
            r.table(table).index_create(index).run()
            log.info('Created secondary index "{}" on table "{}"'.format(index, table))

    if 'location' not in r.table('pokemon').index_list().run():
        r.table('pokemon').index_create('location', geo=True).run()
        log.info('Created geo index on table {}.'.format('pokemon'))
        r.table('pokemon').update(lambda p: {'location': r.point(p['longitude'], p['latitude'])}).run()
        r.table('pokemon').replace(r.row.without('longitude').without('latitude')).run()
        log.info('Updated existing pokemon locations.')


def utc_localize(dt):
    if dt is None:
        return

    utc = pytz.timezone('UTC')
    return utc.localize(dt)

def fix_coords(i):
    i['longitude'], i['latitude'] = i['location']['coordinates']
    del i['location']

    return i

def process_pokemon_dict(p):
    # We don't need this stored in the db so we'll just get it as we retrieve it.
    p['pokemon_name'] = get_pokemon_name(p['pokemon_id']).capitalize()

    return fix_coords(p)

def get_bounds(swLat, swLng, neLat, neLng):
    return r.polygon([swLng, swLat],
                     [neLng, swLat],
                     [neLng, neLat],
                     [swLng, neLat])

def get_active_pokemon(swLat=None, swLng=None, neLat=None, neLng=None):
    query = r.table('pokemon').filter(r.row['disappear_time'] > r.now())
    if None not in (swLat, swLng, neLat, neLng):
        query = query.filter(r.row['location'].intersects(get_bounds(swLat, swLng, neLat, neLng)))
    return map(process_pokemon_dict, query.run())

def get_active_pokemon_by_id(pid):
    return map(process_pokemon_dict, r.table('pokemon') \
                                      .filter(r.row['location'].intersects(get_bounds(swLat, swLng, neLat, neLng))) \
                                      .filter(r.row['disappear_time'] > r.now() &
                                              r.row['pokemon_id'] == pid).run())

def get_pokestops(swLat=None, swLng=None, neLat=None, neLng=None):
    query = r.table('pokestops')
    if None not in (swLat, swLng, neLat, neLng):
        query = query.filter(r.row['location'].intersects(get_bounds(swLat, swLng, neLat, neLng)))
    return map(fix_coords, query.run())

def get_gyms(swLat=None, swLng=None, neLat=None, neLng=None):
    query = r.table('gyms')
    if None not in (swLat, swLng, neLat, neLng):
        query = query.filter(r.row['location'].intersects(get_bounds(swLat, swLng, neLat, neLng)))
    return map(fix_coords, query.run())

def parse_map(map_dict):
    pokemon_list = []
    pokestops = []
    gyms = []

    cells = map_dict['responses']['GET_MAP_OBJECTS']['map_cells']
    for cell in cells:
        for p in cell.get('wild_pokemons', []):
            if p['encounter_id'] in pokemon_list:
                continue  # prevent unnecessary parsing

            disappear_time = utc_localize(datetime.utcfromtimestamp(
                (p['last_modified_timestamp_ms'] +
                 p['time_till_hidden_ms']) / 1000.0))

            pokemon_list.append({
                'id': p['encounter_id'],
                'spawnpoint_id': p['spawn_point_id'],
                'pokemon_id': p['pokemon_data']['pokemon_id'],
                'location': r.point(p['longitude'], p['latitude']),
                'disappear_time': disappear_time
            })

        for p in cell.get('catchable_pokemons', []):
            if p['encounter_id'] in map(lambda x: x['id'], pokemon_list):
                continue  # prevent unnecessary parsing

            log.critical("found catchable pokemon not in wild: {}".format(p))

            disappear_time = utc_localize(datetime.utcfromtimestamp(
                 (p['last_modified_timestamp_ms'] +
                  p['time_till_hidden_ms']) / 1000.0))

            pokemon_list.append({
                'id': p['encounter_id'],
                'spawnpoint_id': p['spawnpoint_id'],
                'pokemon_id': p['pokemon_data']['pokemon_id'],
                'location': r.point(p['longitude'], p['latitude']),
                'disappear_time': disappear_time
            })

        for f in cell.get('forts', []):
            if f['id'] in gyms or f['id'] in pokestops:
                continue  # prevent unnecessary parsing

            if f.get('type') == 1:  # Pokestops
                if 'lure_info' in f:
                    lure_expiration = utc_localize(datetime.utcfromtimestamp(
                            f['lure_info']['lure_expires_timestamp_ms'] / 1000.0))
                    active_pokemon_id = f['lure_info']['active_pokemon_id']
                else:
                    lure_expiration, active_pokemon_id = None, None

                last_modified = utc_localize(datetime.utcfromtimestamp(f['last_modified_timestamp_ms'] / 1000.0))

                pokestops.append({
                    'id': f['id'],
                    'enabled': f['enabled'],
                    'location': r.point(f['longitude'], f['latitude']),
                    'last_modified': last_modified,
                    'lure_expiration': lure_expiration,
                    'active_pokemon_id': active_pokemon_id
                })

            else:
                last_modified = utc_localize(datetime.utcfromtimestamp(f['last_modified_timestamp_ms'] / 1000.0))

                gyms.append({
                    'id': f['id'],
                    'team_id': f.get('owned_by_team', 0),
                    'guard_pokemon_id': f.get('guard_pokemon_id', 0),
                    'gym_points': f.get('gym_points', 0),
                    'enabled': f['enabled'],
                    'location': r.point(f['longitude'], f['latitude']),
                    'last_modified': last_modified,
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
