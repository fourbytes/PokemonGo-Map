#!/usr/bin/python
# -*- coding: utf-8 -*-

import os
import sys
import logging
import time

from threading import Thread
from flask_cors import CORS, cross_origin

from pogomap import config
from pogomap.app import Pogom

from pogomap.utils import get_args
from pogomap.search import search_loop, set_location, set_cover
from pogomap.models import init_database, create_tables

log = logging.getLogger(__name__)

search_thread = Thread()

def start_locator_thread(args):
    search_thread = Thread(target=search_loop, args=(args,))
    search_thread.daemon = True
    search_thread.name = 'search_thread'
    search_thread.start()


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(module)11s] [%(levelname)7s] %(message)s')

    logging.getLogger("rethinkdb").setLevel(logging.INFO)
    logging.getLogger("requests").setLevel(logging.WARNING)
    logging.getLogger("pgoapi.pgoapi").setLevel(logging.WARNING)
    logging.getLogger("pgoapi.rpc_api").setLevel(logging.INFO)
    logging.getLogger('werkzeug').setLevel(logging.ERROR)

    args = get_args()

    config['parse_pokemon'] = not args.no_pokemon
    config['parse_pokestops'] = not args.no_pokestops
    config['parse_gyms'] = not args.no_gyms

    config['db_host'] = args.db_host
    config['db_port'] = args.db_port
    config['db_user'] = args.db_user
    config['db_pass'] = args.db_pass
    config['db_name'] = args.db_name

    if args.debug:
        logging.getLogger("requests").setLevel(logging.DEBUG)
        logging.getLogger("pgoapi").setLevel(logging.DEBUG)
        logging.getLogger("rpc_api").setLevel(logging.DEBUG)

    init_database()
    create_tables()

    set_location(args.location, args.radius)
    set_cover()

    if args.no_pokemon:
        log.info('Parsing of Pokemon disabled.')
    if args.no_pokestops:
        log.info('Parsing of Pokestops disabled.')
    if args.no_gyms:
        log.info('Parsing of Gyms disabled.')

    config['LOCALE'] = args.locale

    if not args.only_server:
        start_locator_thread(args)

    app = Pogom(__name__)

    if args.cors:
        CORS(app);

    config['ROOT_PATH'] = app.root_path
    config['GMAPS_KEY'] = args.gmaps_key

    if args.no_server:
        while not search_thread.isAlive():
            time.sleep(1)
        search_thread.join()
    else:
        app.run(threaded=True, debug=args.debug, host=args.host, port=args.port)
