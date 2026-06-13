<template>
  <div class="map-wrapper glass-panel">
    <div class="map-header">
      <div class="map-title-row">
        <h3>Live Outbreak Map</h3>
        <span class="live-badge">
          <span class="ping-dot"></span> LIVE
        </span>
      </div>
      <p class="map-subtitle">คลิกหมุดจังหวัดเพื่อวิเคราะห์กลุ่มอาการคลัสเตอร์ระบาด</p>
    </div>
    
    <div class="map-container-inner">
      <!-- Thailand Stylized SVG Map -->
      <svg viewBox="0 0 420 620" class="thailand-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="mapBgGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="rgba(6, 182, 212, 0.08)" />
            <stop offset="100%" stop-color="rgba(9, 10, 15, 0)" />
          </radialGradient>
          <linearGradient id="gridGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="rgba(255, 255, 255, 0.01)" />
            <stop offset="100%" stop-color="rgba(255, 255, 255, 0.04)" />
          </linearGradient>
        </defs>

        <!-- Background grid design -->
        <rect width="420" height="620" fill="url(#mapBgGrad)" />
        <g stroke="rgba(255, 255, 255, 0.03)" stroke-width="1">
          <path d="M 50 0 L 50 620 M 100 0 L 100 620 M 150 0 L 150 620 M 200 0 L 200 620 M 250 0 L 250 620 M 300 0 L 300 620 M 350 0 L 350 620" />
          <path d="M 0 50 L 420 50 M 0 100 L 420 100 M 0 150 L 420 150 M 0 200 L 420 200 M 0 250 L 420 250 M 0 300 L 420 300 M 0 350 L 420 350 M 0 400 L 420 400 M 0 450 L 420 450 M 0 500 L 420 500 M 0 550 L 420 550" />
        </g>

        <!-- Stylized Outline of Thailand Map (Abstract Sci-fi Silhouette) -->
        <path d="
          M 140 80 L 190 70 L 210 90 L 220 120 L 200 150 L 220 170 
          L 260 175 L 300 170 L 330 200 L 310 240 L 320 270 L 280 300 
          L 250 280 L 240 310 L 220 320 L 210 350 L 190 350 L 190 320 
          L 170 300 L 160 260 L 150 240 L 120 230 L 120 190 L 130 160 
          L 110 140 L 120 100 Z
          M 190 350 L 195 380 L 185 410 L 175 440 L 160 470 L 150 500 
          L 130 530 L 120 570 L 135 600 L 145 570 L 155 530 L 175 500 
          L 190 460 L 210 420 L 220 380 Z
        " 
        fill="rgba(255, 255, 255, 0.02)" 
        stroke="rgba(255, 255, 255, 0.08)" 
        stroke-width="2" 
        stroke-linejoin="round" />

        <!-- Connecting data vectors -->
        <g stroke="rgba(6, 182, 212, 0.15)" stroke-width="1" stroke-dasharray="3 3">
          <line x1="150" y1="160" x2="210" y2="320" /> <!-- CM to BKK -->
          <line x1="290" y1="240" x2="210" y2="320" /> <!-- KK to BKK -->
          <line x1="230" y1="350" x2="210" y2="320" /> <!-- CB to BKK -->
          <line x1="130" y1="520" x2="210" y2="320" /> <!-- PK to BKK -->
        </g>

        <!-- Hotspot interactive pins -->
        <g v-for="pin in mappedHotspots" :key="pin.city" class="map-pin-group" @click="selectCity(pin)">
          <!-- Outer Pulsating circle -->
          <circle 
            :cx="pin.x" 
            :cy="pin.y" 
            :r="getPulseRadius(pin)" 
            :fill="getSeverityColor(pin.severity, 0.15)" 
            class="map-ping-circle"
            :class="'pulse-' + pin.severity" />
            
          <!-- Inner solid circle -->
          <circle 
            :cx="pin.x" 
            :cy="pin.y" 
            :r="getPinRadius(pin)" 
            :fill="getSeverityColor(pin.severity, 0.85)" 
            stroke="#ffffff" 
            stroke-width="1.5" 
            class="map-pin-dot" 
            :class="{ 'glowing': activePingCity === pin.city }" />

          <!-- Label -->
          <text 
            :x="pin.x" 
            :y="pin.y - 14" 
            text-anchor="middle" 
            fill="#ffffff" 
            font-size="10" 
            font-weight="bold"
            font-family="var(--font-title)"
            class="pin-label">
            {{ pin.city }} ({{ pin.totalCases }})
          </text>
        </g>
      </svg>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  hotspots: {
    type: Array,
    default: () => []
  },
  activePingCity: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['select-city']);

// Coordinate mappings on the stylized SVG canvas
const coordinateMap = {
  'Chiang Mai': { x: 150, y: 160 },
  'Bangkok': { x: 210, y: 320 },
  'Khon Kaen': { x: 290, y: 240 },
  'Chon Buri': { x: 230, y: 350 },
  'Phuket': { x: 130, y: 520 }
};

const mappedHotspots = computed(() => {
  return props.hotspots.map(h => {
    const coords = coordinateMap[h.city] || { x: 210, y: 320 };
    return {
      ...h,
      x: coords.x,
      y: coords.y
    };
  });
});

function getPinRadius(pin) {
  const base = 5;
  const scale = Math.min(pin.totalCases / 30, 8);
  return base + scale;
}

function getPulseRadius(pin) {
  return getPinRadius(pin) * 2.2;
}

function getSeverityColor(severity, alpha = 1) {
  if (severity === 'high') return `rgba(239, 68, 68, ${alpha})`;
  if (severity === 'medium') return `rgba(245, 158, 11, ${alpha})`;
  return `rgba(16, 185, 129, ${alpha})`;
}

function selectCity(pin) {
  emit('select-city', pin);
}
</script>

<style scoped>
.map-wrapper {
  padding: 24px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.map-header {
  margin-bottom: 20px;
}

.map-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.map-title-row h3 {
  font-family: var(--font-title);
  font-size: 1.25rem;
  color: var(--text-primary);
}

.live-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #ef4444;
  letter-spacing: 0.05em;
}

.ping-dot {
  width: 6px;
  height: 6px;
  background-color: #ef4444;
  border-radius: 50%;
  box-shadow: 0 0 8px #ef4444;
  animation: flash-green 1s infinite alternate;
}

.map-subtitle {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-top: 4px;
}

.map-container-inner {
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.thailand-svg {
  max-width: 100%;
  max-height: 480px;
  filter: drop-shadow(0 4px 20px rgba(0,0,0,0.4));
}

.map-pin-group {
  cursor: pointer;
}

.map-pin-dot {
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.map-pin-group:hover .map-pin-dot {
  filter: drop-shadow(0 0 10px #ffffff);
}

.map-pin-dot.glowing {
  animation: flash-green 0.5s ease-in-out infinite alternate;
}

/* Outer pulse waves based on severity levels */
.map-ping-circle {
  transform-origin: center;
}

.pulse-high {
  animation: pulse-wave-red 2.5s infinite ease-out;
}

.pulse-medium {
  animation: pulse-wave-yellow 2.5s infinite ease-out;
}

.pulse-low {
  animation: pulse-wave-green 2.5s infinite ease-out;
}

@keyframes pulse-wave-red {
  0% { transform: scale(0.6); opacity: 0.8; }
  100% { transform: scale(1.4); opacity: 0; }
}

@keyframes pulse-wave-yellow {
  0% { transform: scale(0.6); opacity: 0.8; }
  100% { transform: scale(1.4); opacity: 0; }
}

@keyframes pulse-wave-green {
  0% { transform: scale(0.6); opacity: 0.8; }
  100% { transform: scale(1.4); opacity: 0; }
}

.pin-label {
  pointer-events: none;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.8));
  user-select: none;
}
</style>
