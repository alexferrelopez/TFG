Per tal de tenir un entorn de desenvolupament em cal una solució com Docker, per tenir els diferents serveis de forma ordenada amb una versió consistent que no depengui del meu ordinador,
Instal·lo Docker Desktop i començo a seleccionar els diferents serveis que faré servir.
El primer es diu Martin, el servei de mosaic que enviarà la informació al client segons demani la informació del nostre mapa vectoritzat.

<Donar les raons de la selecció d'aquest servei (Martin)>

Descarrego la imatge de Docker proporcionada pels desenvolupadors del servei, preparo el container i el fitxer que conté les dades del mapa (un fitxer amb extensió .mbtiles).
Per tenir vectoritzades cal descarregar-les d'algun proveïdor com OpenStreetMap, de moment faré servir [Maptiler](https://data.maptiler.com/downloads/dataset/osm/europe/spain/#4.87/40.07/-2.34)
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

Un cop funciona el servidor, cal investigar com obtenir les dades des del client web, o més aviat, com mostrar-les. El que ens cal, en primer lloc, és un servidor web, amb el qual el client es comunicarà per tal d'obtenir el contingut (HTML), l'estil (CSS), les funcionalitats (JS). Anant pas per pas, el contingut es refereix simplement a les diferents parts que el client veurà en pantalla, en el nostre cas, hi volem un mapa amb els múltiples carregadors disponibles. L'estil és trivial, tot i que cal tenir una idea clara del disseny global, en el nostre cas el mapa és la part central del disseny. Els carregadors i la informació sobre aquests estaran superposats al mapa, com si fos en una capa superior.
Les funcionalitats és la lògica que ho suporta tot, la projecció d'un mapa sobre la pantalla, la superposició dels carregadors, la càrrega del mapa en forma de mosaic, la interacció amb el mapa i un llarg etcètera formen part d'aquest apartat.

Per tal de renderitzar el mapa vectoritzat, faré servir MapLibre, una llibreria que ens permetrà carregar i mostrar el mapa en format vectoritzat en format de mosaic en el client. La llibreria està present a NPM i es pot instal·lar fàcilment; això sumat amb l'experiència prèvia de desenvolupament web amb NPM i Node m'ha fet decantar per aquesta opció. En oportunitats anteriors sempre he usat Node juntament amb Vue com a framework del front-end i Vite com a servidor de desenvolupament, ja que ens permet veure els canvis en temps real sense haver de reiniciar el servidor cada cop que es fa un canvi en un fitxer.
A partir d'aquest punt podem fer una web simple amb un mapa que demana les dades al servidor Martin a partir de l'endpoint: /{sourceID}/{z}/{x}/{y}, en aquest cas és localhost:3000/ties/{z}/{x}/{y}.

Tot i obtenir dades del servidor, aquestes no es veuen al mapa, per això cal afegir un estil que ens permeti veure les dades. L'estil és un fitxer JSON que conté les diferents capes del mapa i com s'han de renderitzar. Aquest estil es pot crear manualment o bé fer servir un estil predefinit com el d'OpenMapTiles. En aquest cas he modificat l'estil [maptiler-basic-gl-style](https://github.com/openmaptiles/maptiler-basic-gl-style); he afegit els noms de les carreteres, la direcció de les carreteres, els carregadors...
Essencialment, tot el que es veu al mapa ha d'estar definit en aquest estil, específicament a l'apartat de "layers" del fitxer JSON. Com a exemple, aquest és l'estil simplificat per veure els carregadors:

```json
{
  "version": 8,
  "sprite": [
    {
      "id": "sdf_sprites",
      "url": "http://192.168.1.153:3000/sdf_sprite/sdf_sprites"
    }
  ],
  "sources": {
    "chargers": {
      "type": "vector",
      "url": "http://192.168.1.153:3000/chargers",
      "tiles": [
        "http://192.168.1.153:3000/chargers/{z}/{x}/{y}"
      ],
      "minzoom": 0,
      "maxzoom": 14
    },
    ...
  },
  "layers": [
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
    ...
  ]
}
```
Aquest estil defineix una font de dades anomenada "chargers" que apunta al servidor Martin i especifica com es carregaran les dades dels carregadors. La capa "chargers-point" defineix com es mostraran els carregadors al mapa, sobreposant una icona de llampec (també provinent del servidor Martin) i un color que depèn d'un valor precalculat anomenat "percentile" que explicaré més endavant.
Tot això permet que el mapa mostri fins a milers de carregadors superposats al mapa seguint els moviments de l'usuari i carregant-se de manera dinàmica.

Pel que fa a les dades dels carregadors, seguint l'objectiu inicial d'aquest projecte, l'única font de dades és el fitxer de la [DGT: Puntos de recarga eléctrica para vehículos](https://nap.dgt.es/dataset/puntos-de-recarga-electrica-para-vehiculos). Com que el fitxer és massa gran per enviar-lo i fer-lo processar al client he optat per fer un preprocessament de les dades i servir-les des del servidor Martin en format vectoritzat, cosa que a més unifica la lògica de càrrega dinàmica en format de mosaic. 

Aquest "preprocessat" té l'objectiu de convertir les dades des d'un XML al format acceptat pel nostre servidor Martin. De forma resumida, el script que he implementat llegeix el fitxer XML, filtra les dades i les converteix a format GeoJson, que després a partir d'una eina anomenada Tippecanoe es converteix al format final ".mbtiles".

Entrat més en detall, el script en Bash descarrega el fitxer directament des de la web, i recorre a l'última versió descarregada en cas de no poder descarregar una nova versió correctament. Posteriorment s'executa el script de Python que llegeix el fitxer XML i filtra les dades que ens interessen, com ara la ubicació del carregador, el nombre de connectors i el seu tipus, la potència, etc. En aquest punt també es fa el calcul del percentil, anteriorment mencionat; la idea es fer servir el percentil com a forma comparativa entre els carregadors per tal de prioritzar-los.