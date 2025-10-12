<template>
  <div class="charger-popup" :style="{ maxWidth: '320px' }">
    <div class="popup-header-container">
      <div class="popup-header">
        {{ features.length }} stations here
      </div>
      <CloseButton class="popup-close-btn" @click="closePopup"></CloseButton>
    </div>
    <ul class="charger-list">
      <li v-for="(feature, index) in features" :key="index" class="charger-item">
        <button @click="selectCharger(feature)" class="charger-button">
          <div class="charger-button-content">
            <div class="lightning-icon" :style="{ background: feature.layer.paint['icon-color'] }">
              <img src="@/assets/lightning.svg" alt="Lightning" :title="feature.properties.percentile" class="lightning-svg" />
            </div>
            <div class="charger-info">
              <div class="charger-name">
                {{ getChargerName(feature) }}
              </div>
              <div class="charger-details">
                {{ getChargerDetails(feature) }}
              </div>
            </div>
          </div>
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import CloseButton from '@/components/ui/CloseButton.vue'

const props = defineProps({
  features: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['select-charger', 'close-popup'])

function getChargerName(feature) {
  const p = feature.properties || {}
  return p.name || 'Unnamed'
}

function getChargerDetails(feature) {
  const p = feature.properties || {}

  // Transform typeOfSite to readable label (same as in MainPage)
  const typeOfSiteMap = {
    openSpace: 'Open Space',
    onstreet: 'On Street',
    inBuilding: 'In Building',
    other: 'Other'
  };

  const rawType = p.typeOfSite || 'other';
  const typeLabel = typeOfSiteMap[rawType] || typeOfSiteMap.other;

  return typeLabel
}

function selectCharger(feature) {
  emit('select-charger', feature)
}

function closePopup() {
  emit('close-popup')
}
</script>

<style scoped>
.charger-popup {
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(60, 64, 67, 0.3), 0 2px 6px 2px rgba(60, 64, 67, 0.15);
}

.popup-header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  position: relative;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.popup-header {
  font-weight: 600;
  font-size: 16px;
  color: #2c3e50;
  letter-spacing: -0.02em;
}

.popup-close-btn {
  position: relative;
  min-width: 28px;
  height: 28px;
  aspect-ratio: 1;
  font-size: 1.5rem;
}

@media (hover: hover) and (pointer: fine) {
  .popup-close-btn:hover {
    box-shadow:
      inset 2px 2px 4px rgba(0, 0, 0, 0.02),
      inset -1px -1px 2px rgba(255, 255, 255, 0.8);
  }
}

.popup-close-btn:active {
  box-shadow:
    inset 3px 3px 6px rgba(0, 0, 0, 0.1),
    inset -2px -2px 4px rgba(255, 255, 255, 0.7);
}

.charger-list {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 240px;
  overflow: auto;
  scrollbar-width: thin;
}

.charger-item {
  margin: 0 0 8px 0;
}

.charger-button {
  width: 100%;
  text-align: left;
  border: 0;
  background: #ffffff;
  padding: 12px 16px;
  border-radius: 10px;
  cursor: pointer;
  border: 1px solid rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
  transition: box-shadow .2s ease, color .2s ease;
}

.charger-button:hover {
  background: #f8f9fa;
  box-shadow:
    inset 2px 2px 4px rgba(0, 0, 0, 0.1),
    inset -1px -1px 2px rgba(255, 255, 255, 0.8);
  border-color: rgba(0, 0, 0, 0.15);
}

.charger-button:active {
  background: #f0f0f0;
  transform: none;
  box-shadow:
    inset 3px 3px 6px rgba(0, 0, 0, 0.15),
    inset -2px -2px 4px rgba(255, 255, 255, 0.7);
  border-color: rgba(0, 0, 0, 0.2);
}

.charger-button-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.lightning-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  color: #ffffff;
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.lightning-svg {
  width: 12px;
  height: 12px;
}

.charger-info {
  flex: 1;
  min-width: 0;
}

.charger-name {
  font-weight: 600;
  font-size: 0.9forem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 6px;
  color: #2c3e50;

  line-height: 1.3;
}

.charger-details {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
  letter-spacing: 0.01em;
  opacity: 0.8;
}
</style>
