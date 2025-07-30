<template>
  <CompassButton
    :bearing="bearing"
    :isNorth="isNorth"
    @reset="resetNorth"
  />
  <ChargerCard
    :charger="selectedCharger"
    @close="selectedCharger = null"
  />
  <div id="map" class="map-placeholder"></div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import CompassButton from '@/components/CompassButton.vue'
import ChargerCard from '@/components/ChargerCard.vue'


const isNorth = ref(false)
const bearing = ref(0)
const selectedCharger = ref(null)
let map

function updateDirection() {
  // normalize bearing into [0,360)
  const b = ((map.getBearing() % 360) + 360) % 360
  // within 0.5° of north → treat as north
  bearing.value = b
  isNorth.value = Math.abs(b) < 0.5
}

function resetNorth() {
  map.easeTo({ bearing: 0, duration: 800 })
}


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

  map.on('load',  updateDirection)
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
.map-placeholder {
  width: 100%;
  height: 100%;
}
</style>
