<template>
  <div class="main-page">
    <CompassButton
      :bearing="bearing"
      :isNorth="isNorth"
      @reset="resetNorth"
    />
    <div id="map" class="map-placeholder"></div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import CompassButton from '@/components/CompassButton.vue'

const isNorth = ref(false)
const bearing = ref(0)
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
    antialias: true              // ② enable antialias early (optional)
  })

  map.on('style.load', () => {
        map.setProjection({
            type: 'globe', // Set projection to globe
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

  // show a popup on click
  map.on("click", "chargers-point", (e) => {
    // e.features is an array; we want the first one
    const feature = e.features[0];
    const props = feature.properties;

    // build some HTML from the props
    const html = `
      <strong>Charger ID:</strong> ${props.properties}<br/>
      <strong>Type:</strong> ${props.connectorType || "unknown"}<br/>
      <strong>Max kW:</strong> ${props.maxPower || "n/a"}<br/>
      <strong>Status:</strong> ${props.status || "n/a"}<br/>
      <strong>Percentile:</strong> ${props.percentile || "n/a"}

    `;

    // popup at the click location
    new maplibregl.Popup({ offset: [0, -8] })
      .setLngLat(e.lngLat)
      .setHTML(html)
      .addTo(map);
  });
})
</script>

<style scoped>

/* ← this class ensures the container isn’t 0px tall */
.map-placeholder {
  width: 100%;
  height: 100vh;
}
</style>
