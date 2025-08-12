#!/usr/bin/env bash
set -euo pipefail
trap 'echo "Error at line $LINENO" >&2; exit 1' ERR

# Parse flags
ONLY_TIPPECANOE=false
while [[ $# -gt 0 ]]; do
  case "$1" in
    -t|--tippecanoe-only)
      ONLY_TIPPECANOE=true
      shift
      ;;
    -*)
      echo "Usage: $0 [--tippecanoe-only]" >&2
      exit 1
      ;;
    *)
      # you can add more positional args here if needed
      shift
      ;;
  esac
done

# Determine script directory and cd into datex_to_geojson
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/datex_to_geojson"

# Ensure output folders exist
mkdir -p ../mbtiles
mkdir -p /files/ev_router_data

# Configuration (all paths are now relative to datex_to_geojson/)
URL="https://infocar.dgt.es/datex2/v3/miterd/EnergyInfrastructureTablePublication/electrolineras.xml"
XML_FILE="electrolineras.xml"
GEOJSON_FILE_LOCAL="chargers.geojson"
GEOJSON_FILE_TARGET="/files/ev_router_data/chargers.geojson"
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
      [ "all", [">=", "percentile", 75], [">=", "$zoom", 7] ],
      [ "all", [">=", "percentile", 30], [">=", "$zoom", 9] ],
      [ "all", [">=", "percentile",  0], [">=", "$zoom", 11] ]
    ]
  }'
  --no-tile-size-limit
  -o "$MBTILES_FILE"
)

if [[ "$ONLY_TIPPECANOE" = true ]]; then
  echo "Tippecanoe-only mode: skipping download & conversion steps."

  # Verify GeoJSON exists (check both local and target locations)
  if [[ -s "$GEOJSON_FILE_LOCAL" ]]; then
    echo "Using local GeoJSON file: $GEOJSON_FILE_LOCAL"
    GEOJSON_FOR_TIPPECANOE="$GEOJSON_FILE_LOCAL"
  elif [[ -s "$GEOJSON_FILE_TARGET" ]]; then
    echo "Using target GeoJSON file: $GEOJSON_FILE_TARGET"
    GEOJSON_FOR_TIPPECANOE="$GEOJSON_FILE_TARGET"
  else
    echo "Error: GeoJSON file not found in either '$GEOJSON_FILE_LOCAL' or '$GEOJSON_FILE_TARGET'. Cannot build MBTiles." >&2
    exit 1
  fi
else
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
  wget \
    --user-agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/115.0.0.0 Safari/537.36" \
    -L  \
    "$URL" -O "$XML_FILE"
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

  # 3) Convert XML → GeoJSON (create local copy first)
  echo "Converting XML ($XML_FILE) to GeoJSON: $GEOJSON_FILE_LOCAL..."
  python3 datex_to_geojson.py "$XML_FILE" "$GEOJSON_FILE_LOCAL"

  # Copy to target location
  echo "Copying GeoJSON to target location: $GEOJSON_FILE_TARGET..."
  cp "$GEOJSON_FILE_LOCAL" "$GEOJSON_FILE_TARGET"
  
  # Use local file for tippecanoe (since we're in the datex_to_geojson directory)
  GEOJSON_FOR_TIPPECANOE="$GEOJSON_FILE_LOCAL"
fi

# 4) Build MBTiles
echo "Building MBTiles with Tippecanoe: $MBTILES_FILE..."
tippecanoe "${TIPPECANOE_OPTS[@]}" "$GEOJSON_FOR_TIPPECANOE"

echo "Done!"
echo " • XML:     $XML_FILE"
echo " • GeoJSON (Local):  $GEOJSON_FILE_LOCAL"
echo " • GeoJSON (Target): $GEOJSON_FILE_TARGET"
echo " • MBTiles: $MBTILES_FILE"
