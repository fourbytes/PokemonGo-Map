import sys
import getpass
import configargparse
import re
import os
import json
from geopy.geocoders import GoogleV3
from s2sphere import CellId, LatLng
import logging
import shutil
from datetime import datetime
import calendar

from flask.json import JSONEncoder

from . import config

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(module)11s] [%(levelname)7s] %(message)s')
log = logging.getLogger(__name__)


def verify_config_file_exists(filename):
    fullpath = os.path.join(os.path.dirname(__file__), filename)
    if os.path.exists(fullpath) is False:
        log.info("Could not find " + filename + ", copying default")
        shutil.copy2(fullpath + '.example', fullpath)

def get_args():
    parser = configargparse.ArgParser(default_config_files=['config/config.ini'])
    parser.add_argument('-a', '--auth-service', type=str.lower, help='Auth Service', default='ptc')
    parser.add_argument('-u', '--username', help='Username')
    parser.add_argument('-p', '--password', help='Password')
    parser.add_argument('-l', '--location', type=str, help='Location, can be an address or coordinates')
    parser.add_argument('-r', '--radius', help='Time delay before beginning new scan', type=int, default=1000)
    parser.add_argument('-H', '--host', help='Set web server listening host', default='127.0.0.1')
    parser.add_argument('-P', '--port', type=int, help='Set web server listening port', default=5000)
    parser.add_argument('-L', '--locale', help='Locale for Pokemon names: default en, check locale folder for more options', default='en')
    parser.add_argument('-d', '--debug', help='Debug Mode', action='store_true')
    parser.add_argument('-ns', '--no-server', help='No-Server Mode. Starts the searcher but not the Webserver.', action='store_true', default=False)
    parser.add_argument('-os', '--only-server', help='Server-Only Mode. Starts only the Webserver without the searcher.', action='store_true', default=False)
    parser.add_argument('-fl', '--fixed-location', help='Hides the search bar for use in shared maps.', action='store_true', default=False)
    parser.add_argument('-k', '--gmaps-key', help='Google Maps Javascript API Key', required=True)
    parser.add_argument('-C', '--cors', help='Enable CORS on web server', action='store_true', default=False)
    parser.add_argument('-t', '--num-threads', help='Number of search threads', type=int, default=1)
    parser.add_argument('-np', '--no-pokemon', help='Disables Pokemon from the map (including parsing them into local db)', action='store_true', default=False)
    parser.add_argument('-ng', '--no-gyms', help='Disables Gyms from the map (including parsing them into local db)', action='store_true', default=False)
    parser.add_argument('-nk', '--no-pokestops', help='Disables PokeStops from the map (including parsing them into local db)', action='store_true', default=False)
    parser.add_argument('--db-name', help='Name of the database to be used')
    parser.add_argument('--db-user', help='Username for the database')
    parser.add_argument('--db-pass', help='Password for the database')
    parser.add_argument('--db-host', help='IP or hostname for the database')
    parser.add_argument('--db-port', help='IP or hostname for the database')
    parser.set_defaults(DEBUG=False)

    args = parser.parse_args()

    if args.only_server:
        if args.location is None:
            parser.print_usage()
            print(sys.argv[0] + ': error: arguments -l/--location is required')
            sys.exit(1);
    else:
        if (args.username is None or args.location is None):
            parser.print_usage()
            print(sys.argv[0] + ': error: arguments -u/--username, -l/--location')
            sys.exit(1);

        if config["PASSWORD"] is None and args.password is None:
            config["PASSWORD"] = args.password = getpass.getpass()
        elif args.password is None:
            args.password = config["PASSWORD"]

    return args

def get_pokemon_name(pokemon_id):
    if not hasattr(get_pokemon_name, 'names'):
        file_path = os.path.join(
            config['ROOT_PATH'],
            config['LOCALES_DIR'],
            'pokemon.{}.json'.format(config['LOCALE']))

        with open(file_path, 'r') as f:
            get_pokemon_name.names = json.loads(f.read())

    return get_pokemon_name.names[str(pokemon_id)]


def get_pos_by_name(location_name):
    prog = re.compile("^(\-?\d+\.\d+)?,\s*(\-?\d+\.\d+?)$")
    res = prog.match(location_name)
    latitude, longitude, altitude = None, None, None
    if res:
        latitude, longitude, altitude = float(res.group(1)), float(res.group(2)), 0
    elif location_name:
        geolocator = GoogleV3()
        loc = geolocator.geocode(location_name)
        if loc:
            latitude, longitude, altitude = loc.latitude, loc.longitude, loc.altitude

    return (latitude, longitude, altitude)


def get_cellids(lat, lng, radius=10):
    origin = CellId.from_lat_lng(LatLng.from_degrees(lat, lng)).parent(15)
    walk = [origin.id()]
    right = origin.next()
    left = origin.prev()

    # Search around provided radius
    for i in range(radius):
        walk.append(right.id())
        walk.append(left.id())
        right = right.next()
        left = left.prev()

    # Return everything
    return sorted(walk)

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
