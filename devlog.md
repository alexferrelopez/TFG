Per tal de tenir un entorn de desenvolupament em cal una solució com Docker, per tenir els diferents serveis de forma ordenada amb una versió consistent que no depengui del meu ordinador,
Instalo Docker Desktop i començo a seleccionar els diferents serveis que faré servir.
El primer es diu Martin, el servei de mosaic que enviara la informació al client segons demani la informació del nostre mapa vectoritzat.

<Donar les raons de la selecció d'aquest servei (Martin)>

Descarrego la imatge de docker proporcionada pels desenvolupadors del servei, preparo el container i el fitxer que conté les dades del mapa (un fitxer amb extensió .mbtiles).
Per tenir vectoritzades cal descarregar-les d'algun proveidor com openstreetmaps, de moment faré servir [Maptiler](https://data.maptiler.com/downloads/dataset/osm/europe/spain/#4.87/40.07/-2.34)
També es pot fer servir [OpenMapTiles](https://github.com/openmaptiles/openmaptiles/tree/master) amb dades provinents de openstreetmaps amb [Geofabrik](https://download.geofabrik.de/).

Amb:

docker compose up -d martin

un cop iniciat el servei comprovo si funciona usant curl i jq:

``` bash
curl -I http://localhost:3000/health
```

Espero un codi 200 per veure que funciona correctament. 

Seguidament comprovo el contingut al servidor amb: 

``` bash
curl http://localhost:3000/catalog | jq .
```

Esperant veure el següent:

```json
{
  "tiles": {
    "osm-2020-02-10-v3.11_europe_spain": {
      "content_type": "application/x-protobuf",
      "content_encoding": "gzip",
      "name": "OpenMapTiles",
      "description": "Region Spain extract from https://openmaptiles.com",
      "attribution": "<a href=\"https://www.maptiler.com/copyright/\" target=\"_blank\">&copy; MapTiler</a> <a href=\"https://www.openstreetmap.org/copyright\" target=\"_blank\">&copy; OpenStreetMap contributors</a>"
    }
  },
  "sprites": {},
  "fonts": {},
  "styles": {}
}
```

Un cop funciona el servidor, cal investigar com obtenir les dades des del client web, o més aviat, com mostrar-les. El que ens cal en primer lloc és un servidor web, amb el qual el client es comunicarà per tal d'obtenir el contingut (HTML), l'estil (CSS), les funcionalitats (JS). Anant pas per pas, el contingut es refereix simplement a les diferents parts que el client veurà en pantalla, en el nostre cas, hi volem un mapa amb els multiples carregadors disponibles. L'estil és trivial, tot i que cal tenir una idea clara del disseny global, en el nostre cas el mapa es la part central del disseny. Els carregadors i la informació sobre aquests estaran superposats al mapa, com si fos en una capa superior.
Les funcionalitats és la lògica que suporta tot, la projecció d'una mapa sobre la pantalla, la superposició dels carregadors, la càrrega del mapa en forma de mosaic, la interacció amb el mapa i un llarg etcetera formen part d'aquest apartat.

Per tal de renderitzar el mapa vectoritzat, faré servir MapLibre, una llibreria que ens permetrà carregar i mostrar el mapa en format vectoritzat en format de mosaic en el client. La llibreria esta present a npm i es pot instal·lar fàcilment; això sumat amb la experiencia previa de desenvolupament web amb npm i Node m'ha fet decantar per aquesta opció. Les oportunitats anteriors que he usant Node he estat juntament amb Vue com a framework del frontend i Vite com a servidor de desenvolupament, ja que ens permet veure els canvis en temps real sense haver de reiniciar el servidor cada cop que es fa un canvi en un fitxer.
A partir d'aquest punt podem fer una web simple amb un mapa que demana les dades al servidor Martin a partir de l'endpoint: /{sourceID}/{z}/{x}/{y}, en aquest cas és <ip>:3000/ties/{z}/{x}/{y}.

Tot i això, es veu que tot i obtenir dades del servidor, no es veuen al mapa, per això cal afegir un estil que ens permeti veure les dades. El estil és un fitxer JSON que conté les diferents capes del mapa i com s'han de renderitzar. Aquest estil es pot crear manualment o bé fer servir un estil predefinit com el d'OpenMapTiles. En aquest cas he modificat el estil [maptiler-basic-gl-style](https://github.com/openmaptiles/maptiler-basic-gl-style), i he afegit els noms de les carreteres, la direcció de les carreteres, els carregadors...
Essencialment, tot el que es veu al mapa ha d'estar definit en aquest estil, a l'apartat de "layers" del fitxer JSON. Com a exemple, aquest es el estil per als carregadors:
```json
{
      "id": "chargers-point",
      "type": "symbol",
      "source": "chargers",
      "source-layer": "chargers",
      "layout": {
        "icon-image": "sdf_sprites:lightning",
        "icon-size": 1,
        "icon-allow-overlap": true
      },
      "paint": {
        "icon-color": [
          "interpolate",
          ["linear"],
          ["get", "percentile"],
          0,  "#ffdb38",
          89.9,  "#017026",
          90, "#a1c1ff",
          100, "#124cb8"
        ],
        "icon-halo-color": "rgba(255,255,255,1)",
        "icon-halo-width": 2
      }
    },
```

