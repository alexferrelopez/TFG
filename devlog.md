## Preparació de l'entorn

Per tal de tenir un entorn de desenvolupament em cal una solució com Docker, per tenir els diferents serveis de forma ordenada amb una versió consistent que no depengui del meu ordinador,
Instal·lo Docker Desktop i començo a seleccionar els diferents serveis que faré servir.
El primer es diu Martin, el servei de mosaic que enviarà la informació al client segons demani la informació del nostre mapa vectoritzat.

## Per què Martin com a servidor de mosaics vectorials

Després del primer prototip d’estil i dades, vaig consolidar Martin com a servidor perquè és lleuger, entén **MBTiles** nativament i exposa **sprites** i **glyphs** compatibles amb MapLibre sense gaire configuració. En el marc del TFG, això m’ha donat la millor relació **simplicitat/rendiment/integració** per itera ràpid i controlar l’estil al detall.

- Fonts vectorials i sprites SDF servits directament.
- Fitxer de configuració curt i repetible (Docker).
- Alternatives com TileServer‑GL/Tegola requerien més dependències o pipelines específics.

Descarrego la imatge de Docker proporcionada pels desenvolupadors del servei, preparo el container i el fitxer que conté les dades del mapa (un fitxer amb extensió .mbtiles).
Per tenir vectoritzades cal descarregar-les d'algun proveïdor com OpenStreetMap, de moment faré servir [Maptiler](https://data.maptiler.com/downloads/dataset/osm/europe/spain/#4.87/40.07/-2.34)
També es pot fer servir [OpenMapTiles](https://github.com/openmaptiles/openmaptiles/tree/master) amb dades provinents de openstreetmaps amb [Geofabrik](https://download.geofabrik.de/).

Amb:

docker compose up -d martin

un cop iniciat el servei comprovo si funciona usant curl i jq:

```bash
curl -I http://localhost:3000/health
```

Espero un codi 200 per veure que funciona correctament.

Seguidament comprovo el contingut al servidor amb:

```bash
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

## El mapa vist des del client

Un cop funciona el servidor, cal investigar com obtenir les dades des del client web, o més aviat, com mostrar-les. El que ens cal, en primer lloc, és un servidor web, amb el qual el client es comunicarà per tal d'obtenir el contingut (HTML), l'estil (CSS), les funcionalitats (JS). Anant pas per pas, el contingut es refereix simplement a les diferents parts que el client veurà en pantalla, en el nostre cas, hi volem un mapa amb els múltiples carregadors disponibles. L'estil és trivial, tot i que cal tenir una idea clara del disseny global, en el nostre cas el mapa és la part central del disseny. Els carregadors i la informació sobre aquests estaran superposats al mapa, com si fos en una capa superior.
Les funcionalitats és la lògica que ho suporta tot, la projecció d'un mapa sobre la pantalla, la superposició dels carregadors, la càrrega del mapa en forma de mosaic, la interacció amb el mapa i un llarg etcètera formen part d'aquest apartat.

## La llibreria de mapatge: MapLibre

Per tal de renderitzar el mapa vectoritzat, faré servir MapLibre, una llibreria que ens permetrà carregar i mostrar el mapa en format vectoritzat en format de mosaic en el client. La llibreria està present a NPM i es pot instal·lar fàcilment; això sumat amb l'experiència prèvia de desenvolupament web amb NPM i Node m'ha fet decantar per aquesta opció. En oportunitats anteriors sempre he usat Node juntament amb Vue com a framework del front-end i Vite com a servidor de desenvolupament, ja que ens permet veure els canvis en temps real sense haver de reiniciar el servidor cada cop que es fa un canvi en un fitxer.
A partir d'aquest punt podem fer una web simple amb un mapa que demana les dades al servidor Martin a partir de l'endpoint: /{sourceID}/{z}/{x}/{y}, en aquest cas és localhost:3000/ties/{z}/{x}/{y}.

## L'estil del mapa

Tot i obtenir dades del servidor, aquestes no es veuen al mapa, per això cal afegir un estil que ens permeti veure les dades. L'estil és un fitxer JSON que conté les diferents capes del mapa i com s'han de renderitzar. Aquest estil es pot crear manualment o bé fer servir un estil predefinit com el d'OpenMapTiles. En aquest cas he modificat l'estil [maptiler-basic-gl-style](https://github.com/openmaptiles/maptiler-basic-gl-style); he afegit els noms de les carreteres, la direcció de les carreteres, els carregadors...
Essencialment, tot el que es veu al mapa ha d'estar definit en aquest estil, específicament a l'apartat de "layers" del fitxer JSON. Com a exemple, aquest és l'estil simplificat per veure els carregadors:

```json
{
  "version": 8,
  "sprite": [
    {
      "id": "sdf_sprites",
      "url": "http://localhost:3000/sdf_sprite/sdf_sprites"
    }
  ],
  "sources": {
    "chargers": {
      "type": "vector",
      "url": "http://localhost:3000/chargers",
      "tiles": [
        "http://localhost:3000/chargers/{z}/{x}/{y}"
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

Aquest estil defineix una font de dades anomenada "chargers" que especifica com i des d'on es carregaran les dades dels carregadors. La capa "chargers-point" defineix com es mostraran els carregadors al mapa; sobreposant una icona de llampec (també provinent del servidor Martin) i un color que depèn d'un valor precalculat anomenat "percentile" que explicaré més endavant.
Tot això permet que el mapa mostri milers de carregadors superposats al mapa seguint els moviments de l'usuari i carregant-se de manera dinàmica.

Pel que fa a les dades dels carregadors, seguint l'objectiu inicial d'aquest projecte, l'única font de dades és el fitxer de la [DGT: Puntos de recarga eléctrica para vehículos](https://nap.dgt.es/dataset/puntos-de-recarga-electrica-para-vehiculos). Com que el fitxer és massa gran per enviar-lo i fer-lo processar al client he optat per fer un preprocessament de les dades i servir-les des del servidor Martin en format vectoritzat, cosa que a més unifica la lògica de càrrega dinàmica en format de mosaic.

Aquest "preprocessat" té l'objectiu de convertir les dades des d'un XML al format acceptat pel nostre servidor Martin. De forma resumida, el script que he implementat llegeix el fitxer XML, filtra les dades i les converteix a format GeoJson, que després a partir d'una eina anomenada Tippecanoe es converteix al format final ".mbtiles".

Entrat més en detall, el script en Bash descarrega el fitxer directament des de la web, i recorre a l'última versió descarregada del fitxer en cas de no poder descarregar una nova versió correctament. Posteriorment, s'executa el script de Python que llegeix el fitxer XML i filtra les dades que ens interessen, com ara la ubicació del carregador, el nombre de connectors i el seu tipus, la potència, etc. En aquest punt també es fa el càlcul del percentil, anteriorment mencionat; la idea és fer servir el percentil com a forma comparativa entre els carregadors per a prioritzar-los. Aquest percentil es calcula a partir del nombre de "refill points" multiplicat per la potència màxima del refill point, ja que els connectors en el mateix "refill point" comparteixen la potència.

En aquest punt, gràcies al servidor Martin i a l'estil anteriorment mencionat, ja es poden veure els carregadors sobre el mapa.

## Refinament del preprocessat

Amb el servidor resolt, el coll d’ampolla passen a ser les dades. La font oficial té adreces irregulars, municipis amb formats diferents i una varietat de noms de valors que fa impossible filtrar amb garanties. L’script inicial llegia l’XML i retornava un GeoJSON prou correcte, però era massa complex per iterar-hi. A més un cop vaig publicar les tessel·les, va quedar clar que el primer intent amb Tippecanoe era massa optimista: a zooms baixos el mapa quedava recarregat i era massa lent. No era un problema de back-end, sinó del pressupost computacional del client en els diferents zooms. Per solucionar això he rebaixat el nivell d’informació als zooms inicials des de Tippecanoe, a més de refactoritzar el fitxer geojson. Implementant una rutina per netejar adreces i municipis (treure comes sobreres, normalitzar variants), una altra per simplificar l'estructura de cada "refill point" (reduint el nombre de camps i estandarditzant els objectes i llistes) i finalment una rutina per simplificar l'estructura de l'estació (reduint també el nombre de camps), el preprocessament del fitxer XML a geojson redueix la mida del fitxer de 60,3 MB a 14,6 MB, una millora de x4.1.

## Desenvolupament web

En aquest punt la pàgina principal mostra el mapa i els carregadors, però cal afegir-hi més funcionalitats per tal de fer-la més atractiva i útil amb funcionalitats com la brúixola, filtres pels carregadors, i la informació de l’estació quan l’usuari clica un punt.

El primer pas és: treure pes de la MainPage i convertir-la en un “director d’orquestra” lleuger. La inicialització del mapa (fonts, capes, sprites, esdeveniments) l'he passat a un composable, _useMapSetup_, que s’encarrega de crear el MapLibre, afegir la font chargers i les capes corresponents i exposar un petit API reactiu: quan el mapa fa load o canvien els bounds, el composable emet senyals que la resta de la UI pot escoltar. Això evita acoblar components de UI amb detalls del MapLibre i deixa la pàgina principal només amb la feina d’enllaçar estats i callbacks.

Amb el mapa preparat, el pas següent és gestionar la interacció bàsica amb els punts. La idea és rebre l’esdeveniment de clic sobre la capa de carregadors, i que el codi recuperi les propietats, generant un “model d’estació” net. Aquest model s’injecta a _StationCard_, un component pensat per llegir-se en 5–10 segons: un nom clar, connectors amb icones coherents, potència màxima i adreça neta. Per reforçar la sensació de context, el mapa centra i es mou de forma suau cap a la ubicació. Quan l’usuari tanca la targeta, tot torna a l'estat inicial.

El component de _StationCard_ es monta a més sobre la _SideCard_, un component generic que permet afegir contingut de forma dinàmica i reutilitzable. Es tornarà a mencionar més endevant ja que també mostrarà els parametres per la ruta.

El següent bloc és la brúixola sota el nom de _CompassButton_. Aquest no és només un botó; ja que manté l’estat “està mirant nord?” i s’actualitza amb l’angle real del mapa (bearing) que aquest li proporciona. Quan l’usuari hi fa clic, el composable _useMapSetup_ ordena al mapa girar cap al nord en un curt temps i, quan acaba, el mateix mapa emet la nova orientació que desactiva l’indicador. Visualment, el component està dissenyat perquè no competeixi amb la informació del mapa: opacitats discretes, mides constants i posicionament poc prioritari.

Els filtres de carregadors demanen una mica més de cura perquè afecten directament el rendiment percebut. Com en el cas dels components més complexos, tota la lògica està en un composable, _useChargerFilters_, que manté l’estat dels filtres seleccionats i construeix l'expressió per filtrar de MapLibre. Quan l’usuari marca o desmarca un filtre, el composable calcula l’expressió optimitzada i invoca un filtre sobre la capa del mapa, sense tocar res més. Per no carregar la vista, els filtres es poden minimitzar cedint l'espai al mapa.

Per gestionar les notificacions d'errors a l'usuari també cal un composable, _useNotifications_, que gestiona els missatges transitoris i exporta dues funcions simples: info i error. _StationCard_, _SearchBar_ i la mateixa MainPage hi recorren quan alguna cosa no es pot completar (geocodificació buida, cap carregador dins de filtre, permisos de localització denegats...). La presentació és consistent i, com que és un servei compartit, es pot canviar l'estil o la durada dels toasts immediatament a tota l’aplicació.

### Cerca — servei i integració

La cerca és el pas natural per convertir el mapa en una eina de navegació i consulta real. _SearchBar_ és el component que encapsula l’autocompletat i la cerca: consulta el back-end de geocodificació i mostra suggeriments amb topònims. En seleccionar-ne un, la pàgina principal escolta aquest esdeveniment i obre el menu de ruta, substituint qualsevol informació que ocupés la _SideCard_, sigui una ruta anterior o la informació d'una estació.
Per la banda del backend, el servei esta darrere d'un servidor Express que gestiona les peticions i la comunicació amb el container de Photon a Docker ja preparat. Aquest container usa dades obtingudes a partir d'extractes oferits de forma gratuita per part de GraphHopper. En el nostre cas es tracta d'un fragment que només conté les dades d'Espanya. Aquest servei, a part d'oferir la possibilitat de la cerca geografica o _geocoding_, també ens permet fer l'invers, cercant adreces a partir de coordenades, cosa que ens permetria situar l'usuari en el mapa a partir de la seva ubicació GPS.

## L'evolució del servei de rutes

En aquest punt la interfície ja mostra bé el mapa, la cerca i les targetes d’estació, però falta l’engranatge que prengui decisions: decidir on parar a carregar i quant temps cal dedicar-hi. Això no és només “traçar una línia” entre origen i destí, és un problema de compatibilitat de connectors, potències efectives, temps i distàncies. Per això creo un servei específic de rutes que viu fora del client i que concentra la lògica.

El primer pas és molt senzill: sobre el mateix servidor Express sobre el qual funciona la cerca, creo un endpoint POST /ev-route que rep origen i destí i fa una crida a OpenRouteService per obtenir la ruta més rapida cap el destí, sense tenir en compte res més. L’objectiu aquí és treure aquesta responsabilitat del navegador, centralitzar la parametrització i obtenir un esquelet fiable sobre el qual després podré treballar. De seguida hi afegeixo validació d’entrada: coordenades ben formades i paràmetres EV coherents. 

Amb la ruta esquelet a la mà, el següent pas és traduir les dades en decisions. Munto un mòdul de "poda" que treballa sobre la mateixa col·lecció d’estacions que he normalitzat al pipeline pel servidor de Martin: per cada ruta es filtra només aquelles estacions que són compatibles amb els connectors del vehicle i que a més ofereixen una potencia superior o igual a la que demana l'usuari. Un cop obtinguts els carregadors vàlids, cal buscar els n carregadors propers a la ruta, el procediment en aquest cas es dividir la ruta en trams i buscant els carregadors que estiguin a una distancia determinada al llarg del tram, finalment s'ordenen els carregadors i s'escullen els millors. Per no disparar la latència, acoto el volum de candidats per tram amb un paràmetre de rendiment; és un control gruixut però efectiu per mantenir temps de resposta estable.

Quan el conjunt de candidats ja és net, afegeixo el “solver”. Aquest bloc genera el graf d'estacions de càrrega i el temps de càrrega en aquells punts. No especulo amb corbes de càrrega per estimar el temps; em quedo amb una aproximació simple basant-me en la potència efectiva. Aquest es un punt de millora clau que, amb més informació per part de l'usuari pot millorar en precisió. El fet es que, el temps de càrrega en els cotxes electrics depen de molts més parametres que en cotxes de combustió, cosa que fa molt dificil la estimació de temps. Alguns d'aquests parametres són:

- Potència màxima d’entrada del vehicle.
- Capacitat de la bateria (kWh).
- Estat de càrrega actual (SoC).
- Corba de càrrega / límits imposats pel BMS.
- Temperatura de la bateria i sistema de gestió tèrmica.
- Edat i degradació interna de la bateria.
- Potència disponible del punt de càrrega (kW).
- Compartició de potència entre punts a la mateixa estació.
- Condicions ambientals (temperatura exterior).
- Objectiu de SOC de l’usuari / mode de càrrega escollit (eco vs ràpid).
- Pèrdues i eficiència del procés de càrrega (conversió, resistències).

Tot i això, la majoria dels parametres son innegociables i no depenen de la estació de càrrega. Per tant una aproximació basada en el cotxe de l'usuari podria ser una bona opció per millorar la precisió de les estimacions. Les dades es podrien obtenir de bases de dades com https://ev-database.org/, per exemple.

Continuant amb el servei de routing, el solver genera un graf descartant els parells de carregadors segons la distància entre ells, usant la distancia maxima introduida per part de l'usuari. Amb això, es pot iniciar la cerca del millor cami usant Dijkstra.

El resultat d’aquests passos el consolido en un “stitch”: una resposta compacta que resumeix distància i temps de conducció totals, el temps de càrrega total i la seqüència de parades amb el que és rellevant (nom de l’estació, connector recomanat i potència efectiva) per tal de poder presentar-ho a la UI, tant sobre el mapa com en un petit resum del viatge.

### Integració amb el Front-end

Quan tot això encaixa, la integració amb el front-end és natural. La _RouteCard_ - el component que es mostra sobre _SideCard_ - , envia la petició i, si hi ha error, el passa a useNotifications. Si la resposta és bona, s'obre el popup del resum de la ruta en un panell vertical i presenta tres parts clares:

Capçalera: mostra el títol i incorpora els botons per modificar la cerca, minimitzar/ampliar el popup i obrir a Google Maps. Els botons tenen icones clars, usats ampliament a la industria, cosa que facilita la seva comprensió.

Resum: ofereix les xifres principals en un cop d’ull — distància total, temps de conducció,  minuts de càrrega i durada total. Tots aquests valors són fixos i no es recalculen al navegador ja que s'han calculat a l'etapa de "stitch" per part del servidor.

Detall interactiu: inclou la llista de trams i la llista de parades (amb el nom de l’estació, els connectors disponibles que compleixen amb els requeriments juntament amb la potència) . En tocar una parada, el mapa es centra suaument en aquell punt.

Pel que fa al comportament, la finestra respecta l’espai del mapa i s’adapta al dispositiu: en escriptori es mostra com una targeta superposada mentre que en mòbil ocupa la part inferior. Si l’usuari modifica els parametres de cerca o canvia l’ordre d’origen i destí, la finestra es manté mentre espera la nova resposta i actualitza el contingut. Si hi ha un error, el missatge passa al sistema de notificacions i el popup es tanca.

En resum, aquesta finestra recull les dades obtingudes del servei i les fa entenedores i accionables: es pot revisar el conjunt, saltar a una parada concreta, explorar un tram i, quan cal, exportar l’itinerari a Google Maps. Això converteix el mapa en una eina de planificació fluida, sense distraccions ni terminologia confusa.