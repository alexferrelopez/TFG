FROM ubuntu:24.04

ENV BUILD_PACKAGES="cmake git build-essential"

RUN apt-get update -qq \
 && apt-get install -y --no-install-recommends \
      $BUILD_PACKAGES \
      libsqlite3-dev zlib1g-dev \
      python3 python3-venv python3-dev python3-pip python3-xmltodict cron wget ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 # build tippecanoe
 && git clone https://github.com/mapbox/tippecanoe.git \
 && cd tippecanoe \
 && make -j && make install \
 && cd .. && rm -rf tippecanoe \
 # clean up build deps
 && apt-get remove --purge -y $BUILD_PACKAGES \
 && apt-get autoremove --purge -y \
 && apt-get autoclean -y \
 && mkdir /files

WORKDIR /files

# keep the container running
CMD ["./make_charger_tiles.bash"]
