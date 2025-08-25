<template>
  <section v-if="legs.length">
    <h4 class="sec" v-if="legs.length > 1">{{ legs.length }} Legs</h4>
    <h4 class="sec" v-else>{{ legs.length }} Leg</h4>
    <ul class="legs">
      <li v-for="leg in legs" :key="leg.legIndex" class="leg">
        <div class="legcol">
          <div class="legline">
            <span class="from">{{ leg.from }}</span>
            <span class="arrow">→</span>
            <span class="to">{{ leg.to }}</span>
          </div>
          <div class="meta">
            <span>{{ leg.distanceFormatted }}</span><span> • </span><span>{{ leg.durationFormatted }}</span>
          </div>
        </div>
      </li>
    </ul>
  </section>
</template>

<script setup>
const props = defineProps({
  legs: { type: Array, required: true }
})
</script>

<style scoped>
.sec {
  font-size: 14px;
  font-weight: 700;
  color: #374151;
  margin: 8px 0;
}

.legs {
  list-style: none;
  margin: 0;
  padding: 0 10px 0 18px;
}

.leg {
  position: relative;
  padding: 8px 4px 8px 16px;
  border-left: 2px solid var(--line);
}

.leg::before {
  content: "";
  position: absolute;
  left: -8px;
  top: 12px;
  width: 10px;
  height: 10px;
  background: var(--accent);
  border: 2px solid var(--bg);
  border-radius: 50%;
  box-shadow: 0 0 0 1px var(--accent-ring);
}

.legcol {
  display: grid;
  gap: 2px;
}

.legline {
  font-size: 14px;
  font-weight: 600;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  align-items: baseline;
}

.arrow {
  color: var(--muted);
}

.meta {
  font-size: 14px;
  color: var(--muted);
  margin-top: 6px;
}
</style>
