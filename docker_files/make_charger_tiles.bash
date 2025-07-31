#!/usr/bin/env bash
set -euo pipefail
trap 'echo "Error at line $LINENO" >&2; exit 1' ERR

# Determine script directory and cd into datex_to_geojson
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/datex_to_geojson"

# Ensure output folder for MBTiles exists
mkdir -p ../mbtiles

# Configuration (all paths are now relative to datex_to_geojson/)
URL="https://infocar.dgt.es/datex2/v3/miterd/EnergyInfrastructureTablePublication/electrolineras.xml"
XML_FILE="electrolineras.xml"
GEOJSON_FILE="chargers.geojson"
MBTILES_DIR="../mbtiles"
MBTILES_FILE="$MBTILES_DIR/chargers.mbtiles"

# Tippecanoe options tuned for speed and optimized flags
TIPPECANOE_OPTS=(
  --force
  --layer=chargers
  --attribution="<a href=\"https://creativecommons.org/licenses/by/4.0/deed.es\" target=\"_blank\">&copy; DGT - CC BY 4.0</a>"
  --name="Electrolineras"
  --description="Puntos de Recarga para Vehículos Eléctricos en España publicados por la DGT"
  --no-feature-limit
  --drop-rate=0
  -Z3 -z14
  -j'{ "chargers": [ "any",
      [ "all", [">=", "percentile", 90], [">=", "$zoom", 3] ],
      [ "all", [">=", "percentile", 50], [">=", "$zoom", 7] ],
      [ "all", [">=", "percentile",  0], [">=", "$zoom", 11] ]
    ]
  }'
  --no-tile-size-limit
  -o "$MBTILES_FILE"
)

# 1) Check for existing XML
if [[ -s "$XML_FILE" ]]; then
  echo "Found existing XML file: $XML_FILE"
  exists_before=true
else
  exists_before=false
fi

# 2) Download with resume support; disable ERR trap to avoid premature exit

echo "Attempting to download XML from $URL into $XML_FILE..."
trap - ERR
set +e
wget "$URL" -O "$XML_FILE"
DL_RET=$?
set -e
trap 'echo "Error at line $LINENO" >&2; exit 1' ERR

if [[ $DL_RET -eq 0 ]]; then
  echo "Download completed successfully."
elif [[ $exists_before == true && -s "$XML_FILE" ]]; then
  echo "Warning: download failed (status $DL_RET), using existing file."
else
  echo "Error: download failed (status $DL_RET) and no valid existing file." >&2
  exit 1
fi

echo "Using XML file: $XML_FILE"

# 3) Convert XML → GeoJSON
echo "Converting XML ($XML_FILE) to GeoJSON: $GEOJSON_FILE..."
python3 datex_to_geojson.py "$XML_FILE" "$GEOJSON_FILE"

# 4) Build MBTiles
echo "Building MBTiles with Tippecanoe: $MBTILES_FILE..."
tippecanoe "${TIPPECANOE_OPTS[@]}" "$GEOJSON_FILE"

echo "Done!"
echo " • XML:     $XML_FILE"
echo " • GeoJSON: $GEOJSON_FILE"
echo " • MBTiles: $MBTILES_FILE"
