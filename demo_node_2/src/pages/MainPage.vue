<template>
  <div class="map-container">
    <ChargerCard
      :charger="selectedCharger"
      @close="selectedCharger = null"
    />
    <div id="map" class="map-placeholder"></div>
    <CompassButton
      :bearing="bearing"
      :isNorth="isNorth"
      @reset="resetNorth"
    />
    <ChargerFilters
      v-model:showHigh="showHigh"
      v-model:showMid="showMid"
      v-model:showLow="showLow"
    />
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import CompassButton from '@/components/CompassButton.vue'
import ChargerCard from '@/components/ChargerCard.vue'
import ChargerFilters from '../components/ChargerFilters.vue'


const isNorth = ref(false)
const bearing = ref(0)
const selectedCharger = ref(null)
const showLow  = ref(true)
const showMid  = ref(true)
const showHigh = ref(true)
let map

watch([showLow, showMid, showHigh], applyPercentileFilter)

function applyPercentileFilter() {
  if (!map) return
  const filters = []

  // NOTE: property may be string — convert to number
  const getPct = ['to-number', ['get', 'percentile']]

  if (showLow.value) {
    filters.push([
      'all',
      ['>=', getPct,  0],
      ['<', getPct, 50]
    ])
  }
  if (showMid.value) {
    filters.push([
      'all',
      ['>=', getPct, 50],
      ['<', getPct, 90]
    ])
  }
  if (showHigh.value) {
    filters.push([
      'all',
      ['>=', getPct, 90],
      ['<=', getPct, 100]
    ])
  }

  // if nothing checked, hide all
  const expr = filters.length
    ? ['any', ...filters]
    : ['==', ['literal', 0], ['literal', 1]]

  map.setFilter('chargers-point', expr)
}

function updateDirection() {
  // normalize bearing into [0,360)
  const b = ((map.getBearing() % 360) + 360) % 360
  // within 0.5° of north → treat as north
  bearing.value = b
  isNorth.value = Math.abs(b) < 0.5
}

function resetNorth() {
  map.rotateTo(0, { duration: 800 });}

onMounted(() => {
  map = new maplibregl.Map({
    container: 'map',
    style: 'http://192.168.1.153:3000/style/style',
    center: [3.7492, 40.4637],
    zoom: 2,
    maxZoom: 19,
    minZoom: 4,
    hash: true,
    antialias: true
  })

  map.on('style.load', () => {
        map.setProjection({
            type: 'globe',
        });
  });

  map.on('load',  () => {
    updateDirection()
    applyPercentileFilter()
  })

  map.on('rotate',  updateDirection)
  map.on('moveend', updateDirection)

  // change cursor on hover
  map.on("mouseenter", "chargers-point", () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", "chargers-point", () => {
    map.getCanvas().style.cursor = "";
  });

  map.on("click", "chargers-point", (e) => {
    const feature = e.features[0]
    const p = feature.properties

    selectedCharger.value = {
      id:            p.properties,
      connectorType: p.connectorType,
      maxPower:      p.maxPower,
      status:        p.status,
      percentile:    p.percentile
    }
  })
})
</script>

<style scoped>
.map-container {
  position: relative;
  width: 100%;
  height: 100%;
}
.map-placeholder {
  width: 100%;
  height: 100%;
}
</style>
