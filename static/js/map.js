
//
// Global map.js variables
//

var $selectExclude;
var $selectNotify;
var $selectHeatmap;

var language = document.documentElement.lang == "" ? "en" : document.documentElement.lang;
var idToPokemon = {};

var excludedPokemon = [];
var notifiedPokemon = [];

var map;
var currentHeatmap;
var rawDataIsLoading = false;
var locationMarker;
var marker;
var rmarker;

var noLabelsStyle=[{featureType:"poi",elementType:"labels",stylers:[{visibility:"off"}]},{"featureType":"all","elementType":"labels.icon","stylers":[{"visibility":"off"}]}];
var light2Style=[{"elementType":"geometry","stylers":[{"hue":"#ff4400"},{"saturation":-68},{"lightness":-4},{"gamma":0.72}]},{"featureType":"road","elementType":"labels.icon"},{"featureType":"landscape.man_made","elementType":"geometry","stylers":[{"hue":"#0077ff"},{"gamma":3.1}]},{"featureType":"water","stylers":[{"hue":"#00ccff"},{"gamma":0.44},{"saturation":-33}]},{"featureType":"poi.park","stylers":[{"hue":"#44ff00"},{"saturation":-23}]},{"featureType":"water","elementType":"labels.text.fill","stylers":[{"hue":"#007fff"},{"gamma":0.77},{"saturation":65},{"lightness":99}]},{"featureType":"water","elementType":"labels.text.stroke","stylers":[{"gamma":0.11},{"weight":5.6},{"saturation":99},{"hue":"#0091ff"},{"lightness":-86}]},{"featureType":"transit.line","elementType":"geometry","stylers":[{"lightness":-48},{"hue":"#ff5e00"},{"gamma":1.2},{"saturation":-23}]},{"featureType":"transit","elementType":"labels.text.stroke","stylers":[{"saturation":-64},{"hue":"#ff9100"},{"lightness":16},{"gamma":0.47},{"weight":2.7}]}];
var darkStyle=[{"featureType":"all","elementType":"labels.text.fill","stylers":[{"saturation":36},{"color":"#b39964"},{"lightness":40}]},{"featureType":"all","elementType":"labels.text.stroke","stylers":[{"visibility":"on"},{"color":"#000000"},{"lightness":16}]},{"featureType":"all","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"administrative","elementType":"geometry.fill","stylers":[{"color":"#000000"},{"lightness":20}]},{"featureType":"administrative","elementType":"geometry.stroke","stylers":[{"color":"#000000"},{"lightness":17},{"weight":1.2}]},{"featureType":"landscape","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":20}]},{"featureType":"poi","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":21}]},{"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"color":"#000000"},{"lightness":17}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#000000"},{"lightness":29},{"weight":0.2}]},{"featureType":"road.arterial","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":18}]},{"featureType":"road.local","elementType":"geometry","stylers":[{"color":"#181818"},{"lightness":16}]},{"featureType":"transit","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":19}]},{"featureType":"water","elementType":"geometry","stylers":[{"lightness":17},{"color":"#525252"}]}];
var pGoStyle=[{"featureType":"landscape.man_made","elementType":"geometry.fill","stylers":[{"color":"#a1f199"}]},{"featureType":"landscape.natural.landcover","elementType":"geometry.fill","stylers":[{"color":"#37bda2"}]},{"featureType":"landscape.natural.terrain","elementType":"geometry.fill","stylers":[{"color":"#37bda2"}]},{"featureType":"poi.attraction","elementType":"geometry.fill","stylers":[{"visibility":"on"}]},{"featureType":"poi.business","elementType":"geometry.fill","stylers":[{"color":"#e4dfd9"}]},{"featureType":"poi.business","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"poi.park","elementType":"geometry.fill","stylers":[{"color":"#37bda2"}]},{"featureType":"road","elementType":"geometry.fill","stylers":[{"color":"#84b09e"}]},{"featureType":"road","elementType":"geometry.stroke","stylers":[{"color":"#fafeb8"},{"weight":"1.25"}]},{"featureType":"road.highway","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"water","elementType":"geometry.fill","stylers":[{"color":"#5ddad6"}]}];
var light2StyleNoLabels=[{"elementType":"geometry","stylers":[{"hue":"#ff4400"},{"saturation":-68},{"lightness":-4},{"gamma":0.72}]},{"featureType":"road","elementType":"labels.icon"},{"featureType":"landscape.man_made","elementType":"geometry","stylers":[{"hue":"#0077ff"},{"gamma":3.1}]},{"featureType":"water","stylers":[{"hue":"#00ccff"},{"gamma":0.44},{"saturation":-33}]},{"featureType":"poi.park","stylers":[{"hue":"#44ff00"},{"saturation":-23}]},{"featureType":"water","elementType":"labels.text.fill","stylers":[{"hue":"#007fff"},{"gamma":0.77},{"saturation":65},{"lightness":99}]},{"featureType":"water","elementType":"labels.text.stroke","stylers":[{"gamma":0.11},{"weight":5.6},{"saturation":99},{"hue":"#0091ff"},{"lightness":-86}]},{"featureType":"transit.line","elementType":"geometry","stylers":[{"lightness":-48},{"hue":"#ff5e00"},{"gamma":1.2},{"saturation":-23}]},{"featureType":"transit","elementType":"labels.text.stroke","stylers":[{"saturation":-64},{"hue":"#ff9100"},{"lightness":16},{"gamma":0.47},{"weight":2.7}]},{"featureType":"all","elementType":"labels.text.stroke","stylers":[{"visibility":"off"}]},{"featureType":"all","elementType":"labels.text.fill","stylers":[{"visibility":"off"}]},{"featureType":"all","elementType":"labels.icon","stylers":[{"visibility":"off"}]}];
var darkStyleNoLabels=[{"featureType":"all","elementType":"labels.text.fill","stylers":[{"visibility":"off"}]},{"featureType":"all","elementType":"labels.text.stroke","stylers":[{"visibility":"off"}]},{"featureType":"all","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"administrative","elementType":"geometry.fill","stylers":[{"color":"#000000"},{"lightness":20}]},{"featureType":"administrative","elementType":"geometry.stroke","stylers":[{"color":"#000000"},{"lightness":17},{"weight":1.2}]},{"featureType":"landscape","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":20}]},{"featureType":"poi","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":21}]},{"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"color":"#000000"},{"lightness":17}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#000000"},{"lightness":29},{"weight":0.2}]},{"featureType":"road.arterial","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":18}]},{"featureType":"road.local","elementType":"geometry","stylers":[{"color":"#181818"},{"lightness":16}]},{"featureType":"transit","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":19}]},{"featureType":"water","elementType":"geometry","stylers":[{"lightness":17},{"color":"#525252"}]}];
var pGoStyleNoLabels=[{"featureType":"landscape.man_made","elementType":"geometry.fill","stylers":[{"color":"#a1f199"}]},{"featureType":"landscape.natural.landcover","elementType":"geometry.fill","stylers":[{"color":"#37bda2"}]},{"featureType":"landscape.natural.terrain","elementType":"geometry.fill","stylers":[{"color":"#37bda2"}]},{"featureType":"poi.attraction","elementType":"geometry.fill","stylers":[{"visibility":"on"}]},{"featureType":"poi.business","elementType":"geometry.fill","stylers":[{"color":"#e4dfd9"}]},{"featureType":"poi.business","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"poi.park","elementType":"geometry.fill","stylers":[{"color":"#37bda2"}]},{"featureType":"road","elementType":"geometry.fill","stylers":[{"color":"#84b09e"}]},{"featureType":"road","elementType":"geometry.stroke","stylers":[{"color":"#fafeb8"},{"weight":"1.25"}]},{"featureType":"road.highway","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"water","elementType":"geometry.fill","stylers":[{"color":"#5ddad6"}]},{"featureType":"all","elementType":"labels.text.stroke","stylers":[{"visibility":"off"}]},{"featureType":"all","elementType":"labels.text.fill","stylers":[{"visibility":"off"}]},{"featureType":"all","elementType":"labels.icon","stylers":[{"visibility":"off"}]}];

var selectedStyle = 'light';

var mapData = {
    pokemon: {},
    gyms: {},
    pokestops: {},
    luredPokemon: {},
    radius: 0
};
var gymTypes = ["Uncontested", "Mystic", "Valor", "Instinct"];
var audio = new Audio('static/sounds/ding.mp3');
var pokemonSprites = {
    normal: {
        columns: 12,
        icon_width: 30,
        icon_height: 30,
        sprite_width: 360,
        sprite_height: 390,
        filename: 'static/icons-sprite.png',
        name: 'Normal'
    },
    highres: {
        columns: 7,
        icon_width: 65,
        icon_height: 65,
        sprite_width: 455,
        sprite_height: 1430,
        filename: 'static/icons-large-sprite.png',
        name: 'High-Res'
    }
};


//
// LocalStorage helpers
//

var StoreTypes = {
    Boolean: {
        parse: function(str) {
            switch(str.toLowerCase()) {
                case '1':
                case 'true':
                case 'yes':
                    return true;
                default:
                    return false;
            }
        },
        stringify: function(b) {
            return b ? 'true' : 'false';
        }
    },
    JSON: {
        parse: function(str) {
            return JSON.parse(str);
        },
        stringify: function(json) {
            return JSON.stringify(json);
        }
    },
    String: {
        parse: function(str) {
            return str;
        },
        stringify: function(str) {
            return str;
        }
    },
    Number: {
        parse: function(str) {
            return parseInt(str, 10);
        },
        stringify: function(number) {
            return number.toString();
        }
    }
};

var StoreOptions = {
    map_style: {
        default: 'roadmap',
        type: StoreTypes.String
    },
    rememberSelectExclude: {
        default: [],
        type: StoreTypes.JSON
    },
    rememberSelectNotift: {
        default: [],
        type: StoreTypes.JSON
    },
    rememberHeatmapPokemon: {
        default: 0,
        type: StoreTypes.Number
    },
    showGyms: {
        default: false,
        type: StoreTypes.Boolean
    },
    showPokemon: {
        default: true,
        type: StoreTypes.Boolean
    },
    showLuredPokemon: {
        default: true,
        type: StoreTypes.Boolean
    },
    showPokestops: {
        default: true,
        type: StoreTypes.Boolean
    },
    showRadius: {
        default: true,
        type: StoreTypes.Boolean
    },
    playSound: {
        default: false,
        type: StoreTypes.Boolean
    },
    geoLocate: {
        default: false,
        type: StoreTypes.Boolean
    },
    playSound: {
        default: false,
        type: StoreTypes.Boolean
    },
    pokemonIcons: {
        default: 'highres',
        type: StoreTypes.String
    },
    iconSizeModifier: {
        default: 0,
        type: StoreTypes.Number
    }
};

var Store = {
    getOption: function(key) {
        var option = StoreOptions[key];
        if (!option) {
            throw "Store key was not defined " + key;
        }
        return option;
    },
    get: function(key) {
        var option = this.getOption(key);
        var optionType = option.type;
        var rawValue = localStorage[key];
        if (rawValue === null || rawValue === undefined) {
            return option.default;
        }
        var value = optionType.parse(rawValue);
        return value;
    },
    set: function(key, value) {
        var option = this.getOption(key);
        var optionType = option.type || StoreTypes.String;
        var rawValue = optionType.stringify(value);
        localStorage[key] = rawValue;
    },
    reset: function(key) {
        localStorage.removeItem(key);
    }
};

//
// Functions
//

function excludePokemon(id) {
    $selectExclude.val(
        $selectExclude.val().concat(id)
    ).trigger('change')
}

function notifyAboutPokemon(id) {
    $selectNotify.val(
        $selectNotify.val().concat(id)
    ).trigger('change')
}

function removePokemonMarker(id) {
    mapData.pokemon[encounter_id].hidden = true;
    mapData.pokemon[id].marker.setMap(null);
}

function initMap() {

    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: center_lat,
            lng: center_lng
        },
        zoom: 16,
        fullscreenControl: true,
        streetViewControl: false,
		mapTypeControl: true,
		mapTypeControlOptions: {
          style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
          position: google.maps.ControlPosition.RIGHT_TOP,
          mapTypeIds: [
              google.maps.MapTypeId.ROADMAP,
              google.maps.MapTypeId.SATELLITE,
              'nolabels_style',
              'dark_style',
              'style_light2',
              'style_pgo',
              'dark_style_nl',
              'style_light2_nl',
              'style_pgo_nl']
        },
    });

  	var style_NoLabels = new google.maps.StyledMapType(noLabelsStyle, {name: "No Labels"});
  	map.mapTypes.set('nolabels_style', style_NoLabels);

  	var style_dark = new google.maps.StyledMapType(darkStyle, {name: "Dark"});
  	map.mapTypes.set('dark_style', style_dark);

  	var style_light2 = new google.maps.StyledMapType(light2Style, {name: "Light2"});
  	map.mapTypes.set('style_light2', style_light2);

  	var style_pgo = new google.maps.StyledMapType(pGoStyle, {name: "PokemonGo"});
  	map.mapTypes.set('style_pgo', style_pgo);

    var style_dark_nl = new google.maps.StyledMapType(darkStyleNoLabels, {name: "Dark (No Labels)"});
    map.mapTypes.set('dark_style_nl', style_dark_nl);

    var style_light2_nl = new google.maps.StyledMapType(light2StyleNoLabels, {name: "Light2 (No Labels)"});
    map.mapTypes.set('style_light2_nl', style_light2_nl);

    var style_pgo_nl = new google.maps.StyledMapType(pGoStyleNoLabels, {name: "PokemonGo (No Labels)"});
    map.mapTypes.set('style_pgo_nl', style_pgo_nl);

    map.addListener('maptypeid_changed', function(s) {
        Store.set('map_style', this.mapTypeId);
    });

    map.setMapTypeId(Store.get('map_style'));
    google.maps.event.addListener(map, 'idle', updateMap);

    marker = createSearchMarker();

    addMyLocationButton();
    initSidebar();
    google.maps.event.addListenerOnce(map, 'idle', function(){
        updateMap();
    });

    google.maps.event.addListener(map, 'zoom_changed', function() {
        redrawPokemon(mapData.pokemon);
        redrawPokemon(mapData.luredPokemon);
    });
};

function createSearchMarker() {
    marker = new google.maps.Marker({ //need to keep reference.
        position: {
            lat: center_lat,
            lng: center_lng
        },
        map: map,
        animation: google.maps.Animation.DROP,
        draggable: true
    });

    var oldLocation = null;
    google.maps.event.addListener(marker, 'dragstart', function() {
        oldLocation = marker.getPosition();
    });

    google.maps.event.addListener(marker, 'dragend', function() {
        var newLocation = marker.getPosition();
        changeSearchLocation(newLocation.lat(), newLocation.lng())
            .done(function() {
                oldLocation = null;
                setupRadiusMarker();
            })
            .fail(function() {
                if (oldLocation) {
                    marker.setPosition(oldLocation);
                }
            });
    });

    setupRadiusMarker();

    return marker;
}

function initSidebar() {
    $('#gyms-switch').prop('checked', Store.get('showGyms'));
    $('#pokemon-switch').prop('checked', Store.get('showPokemon'));
    $('#pokestops-switch').prop('checked', Store.get('showPokestops'));
    $('#geoloc-switch').prop('checked', Store.get('geoLocate'));
    $('#radius-switch').prop('checked', Store.get('showRadius'));
    $('#sound-switch').prop('checked', Store.get('playSound'));

    var searchBox = new google.maps.places.SearchBox(document.getElementById('next-location'));

    searchBox.addListener('places_changed', function() {
        var places = searchBox.getPlaces();

        if (places.length == 0) {
            return;
        }

        var loc = places[0].geometry.location;
        changeLocation(loc.lat(), loc.lng());
    });

    var icons = $('#pokemon-icons');
    $.each(pokemonSprites, function(key, value) {
        icons.append($('<option></option>').attr("value", key).text(value.name));
    });
    icons.val((pokemonSprites[Store.get('pokemonIcons')]) ? Store.get('pokemonIcons') : 'highres');
    $('#pokemon-icon-size').val(Store.get('iconSizeModifier'));
}

function pad(number) { return number <= 99 ? ("0" + number).slice(-2) : number; }

function pokemonLabel(name, disappear_time, pokemon_id, latitude, longitude, id) {
    var disappearDate = new Date(disappear_time)

    var contentstring = `
        <div>
            <b>${name}</b>
            <span> - </span>
            <small>
                <a href='http://www.pokemon.com/us/pokedex/${pokemon_id}' target='_blank' title='View in Pokedex'>#${pokemon_id}</a>
            </small>
        </div>
        <div>
            Disappears at ${pad(disappearDate.getHours())}:${pad(disappearDate.getMinutes())}:${pad(disappearDate.getSeconds())}
            <span class='label-countdown' disappears-at='${disappear_time}'>(00m00s)</span>
        </div>
        <div>
            Location: ${latitude.toFixed(6)}, ${longitude.toFixed(7)}
        </div>
        <div>
            <a href='javascript:excludePokemon(${id})'>Exclude</a>&nbsp;&nbsp;
            <a href='javascript:notifyAboutPokemon(${id})'>Notify</a>&nbsp;&nbsp;
            <a href='javascript:removePokemonMarker("${id}")'>Remove</a>&nbsp;&nbsp;
            <a href='https://www.google.com/maps/dir/Current+Location/${latitude},${longitude}'
                    target='_blank' title='View in Maps'>Get directions</a>
        </div>`;
    return contentstring;
}

function gymLabel(team_name, team_id, gym_points, latitude, longitude) {
    var gym_color = ["0, 0, 0, .4", "74, 138, 202, .6", "240, 68, 58, .6", "254, 217, 40, .6"];
    var str;
    if (team_id == 0) {
        str = `<div><center>
            <div>
                <b style='color:rgba(${gym_color[team_id]})'>${team_name}</b><br>
                <img height='70px' style='padding: 5px;' src='static/forts/${team_name}_large.png'>
            </div>
            <div>
                Location: ${latitude.toFixed(6)}, ${longitude.toFixed(7)}
            </div>
            <div>
                <a href='https://www.google.com/maps/dir/Current+Location/${latitude},${longitude}'
                        target='_blank' title='View in Maps'>Get directions</a>
            </div>
            </center></div>`;
    } else {
        var gym_prestige = [2000, 4000, 8000, 12000, 16000, 20000, 30000, 40000, 50000];
        var gym_level = 1;
        while (gym_points >= gym_prestige[gym_level - 1]) {
                gym_level++;
        }
        str = `
            <div><center>
            <div style='padding-bottom: 2px'>Gym owned by:</div>
            <div>
                <b style='color:rgba(${gym_color[team_id]})'>Team ${team_name}</b><br>
                <img height='70px' style='padding: 5px;' src='static/forts/${team_name}_large.png'>
            </div>
            <div>Level: ${gym_level} | Prestige: ${gym_points}</div>
            <div>
                Location: ${latitude.toFixed(6)}, ${longitude.toFixed(7)}
            </div>
            <div>
                <a href='https://www.google.com/maps/dir/Current+Location/${latitude},${longitude}'
                        target='_blank' title='View in Maps'>Get directions</a>
            </div>
            </center></div>`;
    }

    return str;
}

function pokestopLabel(lured, last_modified, active_pokemon_id, latitude, longitude) {
    var str;
    if (lured) {
        var active_pokemon = idToPokemon[active_pokemon_id];

        var last_modified_date = new Date(last_modified);
        var current_date = new Date();

        var time_until_expire = current_date.getTime() - last_modified_date.getTime();

        var expire_date = new Date(current_date.getTime() + time_until_expire);
        var expire_time = expire_date.getTime();

        str = `
            <div>
                <b>Lured Pokéstop</b>
            </div>
            <div>
                Lured Pokémon: ${active_pokemon}
                <span> - </span>
                <small>
                    <a href='http://www.pokemon.com/us/pokedex/${active_pokemon_id}' target='_blank' title='View in Pokedex'>#${active_pokemon_id}</a>
                </small>
            </div>
            <div>
                Lure expires at ${pad(expire_date.getHours())}:${pad(expire_date.getMinutes())}:${pad(expire_date.getSeconds())}
                <span class='label-countdown' disappears-at='${expire_time}'>(00m00s)</span></div>
            <div>
            <div>
                Location: ${latitude.toFixed(6)}, ${longitude.toFixed(7)}
            </div>
            <div>
                <a href='https://www.google.com/maps/dir/Current+Location/${latitude},${longitude}'
                        target='_blank' title='View in Maps'>Get directions</a>
            </div>`;
    } else {
        str = `
            <div>
                <b>Pokéstop</b>
            </div>
            <div>
                Location: ${latitude.toFixed(6)}, ${longitude.toFixed(7)}
            </div>
            <div>
                <a href='https://www.google.com/maps/dir/Current+Location/${latitude},${longitude}'
                        target='_blank' title='View in Maps'>Get directions</a>
            </div>`;
    }

    return str;
}

function getGoogleSprite(index, sprite, display_height) {
    display_height = Math.max(display_height, 3);
    var scale = display_height / sprite.icon_height;
    // Crop icon just a tiny bit to avoid bleedover from neighbor
    var scaled_icon_size = new google.maps.Size(scale * sprite.icon_width - 1, scale * sprite.icon_height - 1);
    var scaled_icon_offset = new google.maps.Point(
        (index % sprite.columns) * sprite.icon_width * scale + 0.5,
        Math.floor(index / sprite.columns) * sprite.icon_height * scale + 0.5);
    var scaled_sprite_size = new google.maps.Size(scale * sprite.sprite_width, scale * sprite.sprite_height);
    var scaled_icon_center_offset = new google.maps.Point(scale * sprite.icon_width/2, scale * sprite.icon_height/2)
    return {
        url: sprite.filename,
        size: scaled_icon_size,
        scaledSize: scaled_sprite_size,
        origin: scaled_icon_offset,
        anchor: scaled_icon_center_offset
    };
}

function setupPokemonMarker(item, skipNotification) {

    // Scale icon size up with the map exponentially
    var icon_size = 2 + (map.getZoom()-3) * (map.getZoom()-3) * .2 + Store.get('iconSizeModifier');
    var pokemon_index = item.pokemon_id - 1;
    var sprite = pokemonSprites[Store.get('pokemonIcons')] || pokemonSprites['highres']
    var icon = getGoogleSprite(pokemon_index, sprite, icon_size);

    var marker = new google.maps.Marker({
        position: {
            lat: item.latitude,
            lng: item.longitude
        },
        zIndex: 9999,
        optimized: false,
        map: map,
        icon: icon,
    });

    marker.infoWindow = new google.maps.InfoWindow({
        content: pokemonLabel(item.pokemon_name, item.disappear_time, item.pokemon_id, item.latitude, item.longitude, item.id),
        disableAutoPan: true
    });

    if (notifiedPokemon.indexOf(item.pokemon_id) > -1) {
        if (!skipNotification) {
            if (Store.get('playSound')) {
              audio.play();
            }
            sendNotification('A wild ' + item.pokemon_name + ' appeared!', 'Click to load map', 'static/icons/' + item.pokemon_id + '.png', item.latitude, item.longitude);
        }
        // Icons still get a bounce, even on redraw
        marker.setAnimation(google.maps.Animation.BOUNCE);
    }

    addListeners(marker);
    return marker;
};

function setupGymMarker(item) {
    var marker = new google.maps.Marker({
        position: {
            lat: item.latitude,
            lng: item.longitude
        },
        map: map,
        icon: 'static/forts/' + gymTypes[item.team_id] + '.png'
    });

    marker.infoWindow = new google.maps.InfoWindow({
        content: gymLabel(gymTypes[item.team_id], item.team_id, item.gym_points, item.latitude, item.longitude),
        disableAutoPan: true
    });

    addListeners(marker);
    return marker;
};

function setupPokestopMarker(item) {
    var imagename = !!item.lure_expiration ? "PstopLured" : "Pstop";
    var marker = new google.maps.Marker({
        position: {
            lat: item.latitude,
            lng: item.longitude,

        },
        map: map,
        zIndex: 2,
        optimized: false,
        icon: 'static/forts/' + imagename + '.png',
    });


    marker.infoWindow = new google.maps.InfoWindow({
        content: pokestopLabel(!!item.lure_expiration, item.last_modified, item.active_pokemon_id, item.latitude +.003, item.longitude+ .003),
        disableAutoPan: true
    });

    addListeners(marker);
    return marker;
};

function setupRadiusMarker() {
    if (rmarker != null) rmarker.setMap(null);
    if (Store.get('showRadius') == false || mapData.radius == 0) return;
    rmarker = new google.maps.Circle({
        map: map,
        center: marker.position,
        radius: mapData.radius,
        fillColor: "rgba(70, 70, 250, 0.1)",
        strokeWeight: 0.4
    });

    return rmarker;
};

function clearSelection() {
    if (document.selection ) {
        document.selection.empty();
    } else if (window.getSelection) {
        window.getSelection().removeAllRanges();
    }
};

function addListeners(marker) {
    marker.addListener('click', function() {
        marker.infoWindow.open(map, marker);
        clearSelection();
        updateLabelDiffTime();
        marker.persist = true;
    });

    google.maps.event.addListener(marker.infoWindow, 'closeclick', function() {
        marker.persist = null;
    });

    marker.addListener('mouseover', function() {
        marker.infoWindow.open(map, marker);
        clearSelection();
        updateLabelDiffTime();
    });

    marker.addListener('mouseout', function() {
        if (!marker.persist) {
            marker.infoWindow.close();
        }
    });
    return marker
};

function clearStaleMarkers() {
    $.each(mapData.pokemon, function(key, value) {

        if (mapData.pokemon[key]['disappear_time'] < new Date().getTime() ||
                excludedPokemon.indexOf(mapData.pokemon[key]['pokemon_id']) >= 0) {
            mapData.pokemon[key].marker.setMap(null);
            delete mapData.pokemon[key];
        }
    });

    $.each(mapData.luredPokemon, function(key, value) {

        if (mapData.luredPokemon[key]['lure_expiration'] < new Date().getTime() ||
                excludedPokemon.indexOf(mapData.luredPokemon[key]['pokemon_id']) >= 0) {
            mapData.luredPokemon[key].marker.setMap(null);
            delete mapData.luredPokemon[key];
        }
    });
};

function showInBoundsMarkers(markers) {
    $.each(markers, function(key, value) {
        var marker = markers[key].marker;
        var show = false;
        if (!markers[key].hidden) {
            if(typeof marker.getPosition === 'function') {
                if(map.getBounds().contains(marker.getPosition())) {
                  show = true;
                }
            } else if(typeof marker.getCenter === 'function') {
                if(map.getBounds().contains(marker.getCenter())) {
                  show = true;
                }
            }
        }

        if ( show && !markers[key].marker.getMap()) {
            markers[key].marker.setMap(map);
        }
        else if (!show && markers[key].marker.getMap()) {
            markers[key].marker.setMap(null);
        }
    });
}

function loadRawData() {
    var loadPokemon = Store.get('showPokemon');
    var loadGyms = Store.get('showGyms');
    var loadPokestops = Store.get('showPokestops') || Store.get('showPokemon');

    var bounds = map.getBounds();
    var swPoint = bounds.getSouthWest();
    var nePoint = bounds.getNorthEast();
    var swLat = swPoint.lat() - 1.0;
    var swLng = swPoint.lng() - 1.0;
    var neLat = nePoint.lat() + 1.0;
    var neLng = nePoint.lng() + 1.0;

    return $.ajax({
        url: "raw_data",
        type: 'GET',
        data: {
            'pokemon': loadPokemon,
            'pokestops': loadPokestops,
            'gyms': loadGyms,
            'swLat': swLat,
            'swLng': swLng,
            'neLat': neLat,
            'neLng': neLng
        },
        dataType: "json",
        beforeSend: function() {
            if (rawDataIsLoading) {
                return false;
            } else {
                rawDataIsLoading = true;
            }
        },
        complete: function() {
            rawDataIsLoading = false;
        }
    })
}

function processPokemon(i, item) {
    if (!Store.get('showPokemon')) {
        return false; // in case the checkbox was unchecked in the meantime.
    }
    if (!(item.id in mapData.pokemon) &&
        excludedPokemon.indexOf(item.pokemon_id) < 0) {
        // add marker to map and item to dict
        if (item.marker) item.marker.setMap(null);
        item.marker = setupPokemonMarker(item);
        mapData.pokemon[item.id] = item;
    }
}

function processPokestops(i, item) {
    if (!Store.get('showPokestops')) {
        return false;
    }
    if (mapData.pokestops[item.id] == null) { // add marker to map and item to dict
        // add marker to map and item to dict
        if (item.marker) item.marker.setMap(null);
        item.marker = setupPokestopMarker(item);
        mapData.pokestops[item.id] = item;
    }
    else {
        var item2 = mapData.pokestops[item.id];
        if (!!item.lure_expiration != !!item2.lure_expiration || item.active_pokemon_id != item2.active_pokemon_id) {
            it2m.marker.setMap(null);
            item.marker = setupPokestopMarker(item);
            mapData.pokestops[item.id] = item;
        }
    }
}

function processLuredPokemon(i, item) {
    if (!Store.get('showPokemon')) {
        return false;
    }
    var item2 = {
        pokestop_id: item.pokestop_id,
        lure_expiration: item.lure_expiration,
        pokemon_id: item.active_pokemon_id,
        latitude: item.latitude + 0.00005,
        longitude: item.longitude + 0.00005,
        pokemon_name: idToPokemon[item.active_pokemon_id],
        disappear_time: item.lure_expiration
    };

    if (item2.pokemon_id == null) {
        return;
    }

    if (mapData.luredPokemon[item2.pokestop_id] == null && item2.lure_expiration && !item2.hidden) {
        //if (item.marker) item.marker.setMap(null);
        item2.marker = setupPokemonMarker(item2);
        mapData.luredPokemon[item2.pokestop_id] = item2;

    }
    if (mapData.luredPokemon[item.pokestop_id] != null && item2.lure_expiration && item2.active_pokemon_id != mapData.luredPokemon[item2.pokestop_id].active_pokemon_id) {
        //if (item.marker) item.marker.setMap(null);
        mapData.luredPokemon[item2.pokestop_id].marker.setMap(null);

        if(!item2.hidden) {
            item2.marker = setupPokemonMarker(item2);
            mapData.luredPokemon[item2.pokestop_id] = item2;
        }

    }

}

function processGyms(i, item) {
    if (!Store.get('showGyms')) {
        return false; // in case the checkbox was unchecked in the meantime.
    }

    if (item.id in mapData.gyms) {
        // if team has changed, create new marker (new icon)
        if (mapData.gyms[item.id].team_id != item.team_id) {
            mapData.gyms[item.id].marker.setMap(null);
            mapData.gyms[item.id].marker = setupGymMarker(item);
        } else { // if it hasn't changed generate new label only (in case prestige has changed)
            mapData.gyms[item.id].marker.infoWindow = new google.maps.InfoWindow({
                content: gymLabel(gymTypes[item.team_id], item.team_id, item.gym_points, item.latitude, item.longitude),
                disableAutoPan: true
            });
        }
    }
    else { // add marker to map and item to dict
        if (item.marker) item.marker.setMap(null);
        item.marker = setupGymMarker(item);
        mapData.gyms[item.id] = item;
    }

}

function updateMap() {
    loadRawData().done(function (result) {
        mapData.radius = result.searchRadius;
        setupRadiusMarker();

        $.each(result.pokemon, processPokemon);
        $.each(result.pokestops, processPokestops);
        $.each(result.pokestops, processLuredPokemon);
        $.each(result.gyms, processGyms);
        showInBoundsMarkers(mapData.pokemon);
        showInBoundsMarkers(mapData.luredPokemon);
        showInBoundsMarkers(mapData.gyms);
        showInBoundsMarkers(mapData.pokestops);
        clearStaleMarkers();
    });
};



function redrawPokemon(pokemon_list) {
    var skipNotification = true;
    $.each(pokemon_list, function(key, value) {
        var item =  pokemon_list[key];
        if (!item.hidden) {
            var new_marker = setupPokemonMarker(item, skipNotification);
            item.marker.setMap(null);
            pokemon_list[key].marker = new_marker;
        }
    });
};

var updateLabelDiffTime = function() {
    $('.label-countdown').each(function(index, element) {
        var disappearsAt = new Date(parseInt(element.getAttribute("disappears-at")));
        var now = new Date();

        var difference = Math.abs(disappearsAt - now);
        var hours = Math.floor(difference / 36e5);
        var minutes = Math.floor((difference - (hours * 36e5)) / 6e4);
        var seconds = Math.floor((difference - (hours * 36e5) - (minutes * 6e4)) / 1e3);

        var timestring;
        if (disappearsAt < now) {
            timestring = "(expired)";
        } else {
            timestring = "(";
            if (hours > 0)
                timestring = hours + "h";

            timestring += ("0" + minutes).slice(-2) + "m";
            timestring += ("0" + seconds).slice(-2) + "s";
            timestring += ")";
        }

        $(element).text(timestring)
    });
};

function getPointDistance(pointA, pointB) {
    return google.maps.geometry.spherical.computeDistanceBetween(pointA, pointB);
}

function sendNotification(title, text, icon, lat, lng) {
    if (!("Notification" in window)) {
        return false; // Notifications are not present in browser
    }
    if (Notification.permission !== "granted") {
        Notification.requestPermission();
    } else {
        var notification = new Notification(title, {
            icon: icon,
            body: text,
            sound: 'sounds/ding.mp3'
        });

        notification.onclick = function () {
            window.focus();
            notification.close();

            centerMap(lat, lng, 20);
        };
    }
}

function myLocationButton(map, marker) {
    var locationContainer = document.createElement('div');

    var locationButton = document.createElement('button');
    locationButton.style.backgroundColor = '#fff';
    locationButton.style.border = 'none';
    locationButton.style.outline = 'none';
    locationButton.style.width = '28px';
    locationButton.style.height = '28px';
    locationButton.style.borderRadius = '2px';
    locationButton.style.boxShadow = '0 1px 4px rgba(0,0,0,0.3)';
    locationButton.style.cursor = 'pointer';
    locationButton.style.marginRight = '10px';
    locationButton.style.padding = '0px';
    locationButton.title = 'Your Location';
    locationContainer.appendChild(locationButton);

    var locationIcon = document.createElement('div');
    locationIcon.style.margin = '5px';
    locationIcon.style.width = '18px';
    locationIcon.style.height = '18px';
    locationIcon.style.backgroundImage = 'url(static/mylocation-sprite-1x.png)';
    locationIcon.style.backgroundSize = '180px 18px';
    locationIcon.style.backgroundPosition = '0px 0px';
    locationIcon.style.backgroundRepeat = 'no-repeat';
    locationIcon.id = 'current-location';
    locationButton.appendChild(locationIcon);

    locationButton.addEventListener('click', function() {
        var currentLocation = document.getElementById('current-location');
        var imgX = '0';
        var animationInterval = setInterval(function(){
            if(imgX == '-18') imgX = '0';
            else imgX = '-18';
            currentLocation.style.backgroundPosition = imgX+'px 0';
        }, 500);
        if(navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                var latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                locationMarker.setVisible(true);
                locationMarker.setOptions({'opacity': 1});
                locationMarker.setPosition(latlng);
                map.setCenter(latlng);
                clearInterval(animationInterval);
                currentLocation.style.backgroundPosition = '-144px 0px';
            });
        }
        else{
            clearInterval(animationInterval);
            currentLocation.style.backgroundPosition = '0px 0px';
        }
    });

    locationContainer.index = 1;
    map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(locationContainer);
}

function addMyLocationButton() {
    locationMarker = new google.maps.Marker({
        map: map,
        animation: google.maps.Animation.DROP,
        position: {lat: center_lat, lng: center_lng},
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillOpacity: 1,
            fillColor: '#1c8af6',
            scale: 6,
            strokeColor: '#1c8af6',
            strokeWeight: 8,
            strokeOpacity: 0.3
        }
    });
    locationMarker.setVisible(false);

    myLocationButton(map, locationMarker);

    google.maps.event.addListener(map, 'dragend', function() {
        var currentLocation = document.getElementById('current-location');
        currentLocation.style.backgroundPosition = '0px 0px';
        locationMarker.setOptions({'opacity': 0.5});
    });
}

function changeLocation(lat, lng) {
    var loc = new google.maps.LatLng(lat, lng);
    changeSearchLocation(lat, lng).done(function() {
        map.setCenter(loc);
        marker.setPosition(loc);
    });
}

function changeSearchLocation(lat, lng) {
    return $.post("next_loc?lat=" + lat + "&lon=" + lng, {});
}

function centerMap(lat, lng, zoom) {
    var loc = new google.maps.LatLng(lat, lng);

    map.setCenter(loc);

    if (zoom) {
        map.setZoom(zoom)
    }
}

function updateHeatmapOverlay() {
    var heatmapPokemonId = Store.get('rememberHeatmapPokemon');
    if (heatmapPokemonId == 0) return;

    $selectHeatmap = $("#heatmap-pokemon");

    $.ajax({
        url: "points",
        type: 'GET',
        data: {
            'pokemon_id': heatmapPokemonId
        },
        dataType: "json",
        beforeSend: function() {
            $selectHeatmap.attr('disabled', true);
        },
        success: function(data) {
            var heatMapData = data.points.map(function(p) { return new google.maps.LatLng(p[0], p[1]); });

            if (currentHeatmap) currentHeatmap.setMap(null);
            currentHeatmap = new google.maps.visualization.HeatmapLayer({
                data: heatMapData,
                radius: 20,
                opacity: 0.75
            });
            currentHeatmap.setMap(map);

            $selectHeatmap.attr('disabled', false);
        }
    })
}

//
// Page Ready Exection
//

$(function () {
    if (!Notification) {
        console.log('could not load notifications');
        return;
    }

    if (Notification.permission !== "granted") {
        Notification.requestPermission();
    }
});

$(function () {
    function formatState (state) {
        if (!state.id) return state.text;
        var $state = $('<span><i class="pokemon-sprite n' + state.element.value.toString() + '"></i> ' + state.text + '</span>');
        return $state;
    };

    $selectExclude = $("#exclude-pokemon");
    $selectNotify  = $("#notify-pokemon");
    $selectHeatmap = $("#heatmap-pokemon");
    const numberOfPokemon = 151;

    // Load pokemon names and populate lists
    $.getJSON("static/locales/pokemon." + language + ".json").done(function(data) {
        var pokeList = [];

        $.each(data, function(key, value) {
            if(key > numberOfPokemon) return false;
            pokeList.push( { id: key, text: value + ' - #' + key } );
            idToPokemon[key] = value;
        });

        // setup the filter lists
        $selectExclude.select2({
            placeholder: "Select Pokémon",
            data: pokeList,
            templateResult: formatState
        });
        $selectNotify.select2({
            placeholder: "Select Pokémon",
            data: pokeList,
            templateResult: formatState
        });

        var heatmapPokeList = pokeList;
        heatmapPokeList.unshift({ id: 0, text: "None" });

        $selectHeatmap.select2({
            placeholder: "Select Pokémon",
            data: heatmapPokeList,
            templateResult: formatState
        });

        // setup list change behavior now that we have the list to work from
        $selectExclude.on("change", function(e) {
            excludedPokemon = $(this).val().map(Number);
            Store.set('rememberSelectExclude', excludedPokemon);
            clearStaleMarkers();
        });
        $selectNotify.on("change", function(e) {
            notifiedPokemon = $(this).val().map(Number)
            Store.set('rememberSelectNotift', notifiedPokemon);
        });
        $selectHeatmap.on("change", function(e) {
            Store.set('rememberHeatmapPokemon', Number($(this).val()));
            updateHeatmapOverlay();
        })

        // recall saved lists
        $selectExclude.val(Store.get('rememberSelectExclude')).trigger("change");
        $selectNotify.val(Store.get('rememberSelectNotift')).trigger("change");
        $selectHeatmap.val(Store.get('rememberHeatmapPokemon')).trigger("change");
    });

    // run interval timers to regularly update map and timediffs
    window.setInterval(updateLabelDiffTime, 1000);
    window.setInterval(updateMap, 5000);
    window.setInterval(function() {
      if(navigator.geolocation && Store.get('geoLocate')) {
        navigator.geolocation.getCurrentPosition(function (position){
          var baseURL = location.protocol + "//" + location.hostname + (location.port ? ":"+location.port: "");
          var lat = position.coords.latitude;
          var lon = position.coords.longitude;

          //the search function makes any small movements cause a loop. Need to increase resolution
          if(getPointDistance(marker.getPosition(), (new google.maps.LatLng(lat, lon))) > 40) //changed to 40 from PR notes, less jitter.
          {
            $.post(baseURL + "/next_loc?lat=" + lat + "&lon=" + lon).done(function(){
              var center = new google.maps.LatLng(lat, lon);
              map.panTo(center);
              marker.setPosition(center);
            });
          }

        });
      }
    }, 1000);


    function buildSwitchChangeListener(data, data_type, storageKey) {
        return function () {
            Store.set(storageKey, this.checked);
            if (this.checked) {
                updateMap();
            } else {
                $.each(data[data_type], function (key, value) {
                    data[data_type][key].marker.setMap(null);
                });
                data[data_type] = {}
            }
        }
    }

    // Setup UI element interactions
    $('#gyms-switch').change(buildSwitchChangeListener(mapData, "gyms", "showGyms"));
    $('#pokemon-switch').change(buildSwitchChangeListener(mapData, "pokemon", "showPokemon"));
    $('#pokestops-switch').change(buildSwitchChangeListener(mapData, "pokestops", "showPokestops"));
    $('#radius-switch').change(function() {
        Store.set("showRadius", this.checked);
        setupRadiusMarker();
    });

    $('#sound-switch').change(function() {
        Store.set("playSound", this.checked);
    });

    $('#pokemon-icons').change(function() {
        Store.set('pokemonIcons', this.value);
        redrawPokemon(mapData.pokemon);
        redrawPokemon(mapData.luredPokemon);
    });

    $('#pokemon-icon-size').change(function() {
        Store.set('iconSizeModifier', this.value);
        redrawPokemon(mapData.pokemon);
        redrawPokemon(mapData.luredPokemon);
    });

    $('#geoloc-switch').change(function() {
        if(!navigator.geolocation)
            this.checked = false;
        else
            Store.set('geoLocate', this.checked);
    });

});
