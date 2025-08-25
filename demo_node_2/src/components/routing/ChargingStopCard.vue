<template>
  <article class="stop" @click="$emit('click', stop)">
    <div class="row top">
      <div class="stoptitle">{{ stop.name }}</div>
      <span class="badge">{{ stop.estimatedChargingTimeFormatted }}</span>
    </div>

    <div class="row sub">
      <span>{{ stop.town }}</span>
      <b>{{ stop.validConnectors }} x {{ stop.maxPowerFormatted }}</b>
    </div>

    <div class="row meta">
      <span class="ellipsis">{{ stop.operator }}</span>
      <span class="ellipsis">
        <img src="@/assets/location.svg" alt="" class="icon" />
        {{ stop.address }}
      </span>
    </div>
  </article>
</template>

<script setup>
const props = defineProps({
  stop: { type: Object, required: true }
})

const emit = defineEmits(['click'])
</script>

<style scoped>
.stop {
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  padding: 10px;
  background: var(--bg);
  transition: background-color .2s;
  cursor: pointer;
  transition: box-shadow .2s ease, color .2s ease;
  -webkit-tap-highlight-color: transparent;
}

@media (hover: hover) and (pointer: fine) {
  .stop:hover {
    background: #f8f9fa;
    box-shadow:
      inset 2px 2px 4px rgba(0, 0, 0, 0.1),
      inset -1px -1px 2px rgba(255, 255, 255, 0.8);
    border-color: rgba(0, 0, 0, 0.15);
  }
}

.stop:active {
  background: #f0f0f0;
  transform: none;
  box-shadow:
    inset 3px 3px 6px rgba(0, 0, 0, 0.15),
    inset -2px -2px 4px rgba(255, 255, 255, 0.7);
  border-color: rgba(0, 0, 0, 0.2);
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.top .stoptitle {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: -.01em;
}

.badge {
  font-size: 12px;
  font-weight: 700;
  color: var(--ok-fg);
  background: var(--ok-bg);
  border: 1px solid var(--ok-br);
  padding: 3px 8px;
  border-radius: 50px;
  white-space: nowrap;
}

.sub,
.meta {
  justify-content: flex-start;
  gap: 12px;
  margin-top: 6px;
  font-size: 14px;
}

.sub {
  color: #374151;
}

.meta {
  color: var(--muted);
  flex-wrap: wrap;
  row-gap: 4px;
}

.icon {
  width: 14px;
  height: 14px;
  vertical-align: middle;
  filter: brightness(0) saturate(100%) invert(15%);
}

.ellipsis {
  align-items: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 240px;
}
</style>
