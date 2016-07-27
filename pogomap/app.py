#!/usr/bin/python
# -*- coding: utf-8 -*-

import calendar
import logging
import rethinkdb as r

from flask import Flask, jsonify, render_template, request
from flask import _app_ctx_stack as stack
from flask.json import JSONEncoder
from flask_compress import Compress
from datetime import datetime
from s2sphere import *

from . import config
from .utils import get_args
from .models import get_active_pokemon
from .models import get_active_pokemon_by_id
from .models import get_gyms
from .models import get_pokestops
from .models import init_database

log = logging.getLogger(__name__)
compress = Compress()

class Pogom(Flask):
    def __init__(self, import_name, **kwargs):
        super(Pogom, self).__init__(import_name, **kwargs)
        compress.init_app(self)

        self.json_encoder = CustomJSONEncoder
        self.route("/", methods=['GET'])(self.fullmap)
        self.route("/raw_data", methods=['GET'])(self.raw_data)
        self.route("/loc", methods=['GET'])(self.loc)
        self.route("/next_loc", methods=['POST'])(self.next_loc)
        self.route("/mobile", methods=['GET'])(self.list_pokemon)
        self.route('/points', methods=['GET'])(self.retrieve_points)

        @self.before_request
        def before():
            ctx = stack.top
            if ctx is not None:
                if not hasattr(ctx, 'rethinkdb'):
                    ctx.rethinkdb = init_database()

        @self.teardown_appcontext
        def teardown(exception):
            ctx = stack.top
            if hasattr(ctx, 'rethinkdb'):
                ctx.rethinkdb.close()

    def fullmap(self):
        args = get_args()
        display = "inline"
        if args.fixed_location:
            display = "none"

        return render_template('map.html',
                               lat=config['ORIGINAL_LATITUDE'],
                               lng=config['ORIGINAL_LONGITUDE'],
                               gmaps_key=config['GMAPS_KEY'],
                               lang=config['LOCALE'],
                               is_fixed=display)

    def raw_data(self):
        d = {}
        try:
            swLat = float(request.args.get('swLat'))
            swLng = float(request.args.get('swLng'))
            neLat = float(request.args.get('neLat'))
            neLng = float(request.args.get('neLng'))
        except ValueError:
            swLat, swLng, neLat, neLng = -180.0, -180.0, 180.0, 180.0

        if request.args.get('pokemon', 'true') == 'true':
            if request.args.get('ids'):
                d['pokemon'] = get_active_pokemon_by_id([int(sid) for sid in request.args.get('ids').split(',')])
            else:
                d['pokemon'] = get_active_pokemon(swLat, swLng, neLat, neLng)

        if request.args.get('pokestops', 'false') == 'true':
            d['pokestops'] = get_pokestops(swLat, swLng, neLat, neLng)

        if request.args.get('gyms', 'true') == 'true':
            d['gyms'] = get_gyms(swLat, swLng, neLat, neLng)

        d['searchRadius'] = config['RADIUS']

        return jsonify(d)

    def retrieve_points(self):
        pokemon_id = int(request.args.get('pokemon_id'))

        res = r.db(config['db_name']).table('pokemon') \
                             .filter({'pokemon_id': pokemon_id}) \
                             .order_by(r.desc('disappear_time')) \
                             .limit(1000) \
                             .map(lambda p: (p['latitude'], p['longitude'], p['disappear_time'])).run()
        res = list(res)

        return jsonify({'count': len(res), 'points': res})

    def loc(self):
        d = {}
        d['lat']=config['ORIGINAL_LATITUDE']
        d['lng']=config['ORIGINAL_LONGITUDE']

        return jsonify(d)

    def next_loc(self):
        args = get_args()
        if args.fixed_location:
            return 'Location searching is turned off', 403

        #part of query string
        if request.args:
            lat = request.args.get('lat', type=float)
            lon = request.args.get('lon', type=float)

        #from post requests
        if request.form:
            lat = request.form.get('lat', type=float)
            lon = request.form.get('lon', type=float)

        if not (lat and lon):
            log.warning('Invalid next location: %s,%s' % (lat, lon))
            return 'bad parameters', 400
        elif config.get('NEXT_LOCATION', {}).get('lat') != lat and config.get('NEXT_LOCATION', {}).get('lon') != lon:
            config['ORIGINAL_LATITUDE'], config['ORIGINAL_LONGITUDE'] = lat, lon
            config['CHANGE'] = True
            log.info('Changing location: %s,%s' % (lat, lon))
            return 'ok', 200
        else:
            return 'ok', 200

    def list_pokemon(self):
        pokemon_list = []

        # Allow client to specify location
        lat = request.args.get('lat', config['ORIGINAL_LATITUDE'], type=float)
        lon = request.args.get('lon', config['ORIGINAL_LONGITUDE'], type=float)
        origin_point = LatLng.from_degrees(lat, lon)

        for pokemon in Pokemon.get_active(None, None, None, None):
            pokemon_point = LatLng.from_degrees(pokemon['latitude'], pokemon['longitude'])
            diff = pokemon_point - origin_point
            diff_lat = diff.lat().degrees
            diff_lng = diff.lng().degrees
            direction = (('N' if diff_lat >= 0 else 'S') if abs(diff_lat) > 1e-4 else '') + (
                ('E' if diff_lng >= 0 else 'W') if abs(diff_lng) > 1e-4 else '')
            entry = {
                'id': pokemon['pokemon_id'],
                'name': pokemon['pokemon_name'],
                'card_dir': direction,
                'distance': int(origin_point.get_distance(pokemon_point).radians * 6366468.241830914),
                'time_to_disappear': '%d min %d sec' % (divmod((pokemon['disappear_time']-datetime.utcnow()).seconds, 60)),
                'disappear_time': pokemon['disappear_time'],
                'latitude': pokemon['latitude'],
                'longitude': pokemon['longitude']
            }
            pokemon_list.append((entry, entry['distance']))
        pokemon_list = [y[0] for y in sorted(pokemon_list, key=lambda x: x[1])]
        return render_template('mobile_list.html',
                               pokemon_list=pokemon_list,
                               origin_lat=lat,
                               origin_lng=lon)


class CustomJSONEncoder(JSONEncoder):

    def default(self, obj):
        try:
            if isinstance(obj, datetime):
                if obj.utcoffset() is not None:
                    obj = obj - obj.utcoffset()
                millis = int(
                    calendar.timegm(obj.timetuple()) * 1000 +
                    obj.microsecond / 1000
                )
                return millis
            iterable = iter(obj)
        except TypeError:
            pass
        else:
            return list(iterable)
        return JSONEncoder.default(self, obj)
