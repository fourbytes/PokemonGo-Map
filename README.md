# PoGoMap ![Python 3](https://img.shields.io/badge/python-3-blue.svg)

Live visualization of all the pokemon (with option to show gyms and pokestops) in your area. Runs on a Flask server displaying Google Maps with markers. Supports basic filtering, browser notifications and heatmaps.

Forked from [AHAAAAAAA's original PokemonGo-Map](https://github.com/AHAAAAAAA/PokemonGo-Map).

![Map](https://raw.githubusercontent.com/fourbytes/pogomap/master/static/cover.png)


## Running
The simplest way to run this is to use docker.

```
docker build -t fourbytes/pogomap .
docker run -d --name rethinkdb --restart=always -v "/srv/pokemap/rethinkdb:/data" rethinkdb
docker run -d --name pogomap --restart=always --link rethinkdb:rethinkdb -p 5000:5000 -v "/srv/pokemap/config/config.ini:/app/config/config.ini" fourbytes/pogomap
```

If use want to setup SSL, use nginx as a reverse proxy (follow a guide [like this](https://www.digitalocean.com/community/tutorials/how-to-configure-nginx-as-a-web-server-and-reverse-proxy-for-apache-on-one-ubuntu-14-04-droplet)).


## Warnings
Using this software is against the ToS of the game. You can get banned, use this tool at your own risk. Don't use your main account!


## Contributions
Please submit all pull requests to the [develop](https://github.com/fourbytes/pogomap/tree/develop) branch.

Major thanks to AHAAAAAAA and all the contributors to the original version of this map [here](https://github.com/AHAAAAAAA/PokemonGo-Map).

Builds off of [tejado's python pgoapi](https://github.com/tejado/pgoapi) and [flask](https://github.com/pallets/flask). Current version relies primarily on the pgoapi and Google Maps JS API.
