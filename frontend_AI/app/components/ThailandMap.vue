<template>
  <div class="bg-surface-container-lowest rounded-xl p-md shadow-sm border border-surface-variant flex flex-col h-full min-h-[460px]">
    <div class="flex justify-between items-center mb-md border-b border-surface-variant pb-xs">
      <div>
        <h3 class="font-headline-sm text-lg text-on-surface font-bold">Live Outbreak Map</h3>
        <p class="text-xs text-on-surface-variant mt-0.5">คลิกหมุดจังหวัดเพื่อวิเคราะห์กลุ่มอาการคลัสเตอร์ระบาด</p>
      </div>
      <span class="inline-flex items-center gap-1.5 bg-error-container text-on-error-container px-2.5 py-1 rounded-full font-label-caps text-[10px] font-bold tracking-wider">
        <span class="w-1.5 h-1.5 bg-error rounded-full animate-pulse"></span> LIVE
      </span>
    </div>
    
    <div class="flex-1 flex items-center justify-center relative bg-surface-container-low/40 rounded-lg p-2 border border-surface-variant overflow-hidden">
      <!-- Thailand Stylized SVG Map -->
      <svg viewBox="0 0 420 620" class="w-full h-auto max-h-[420px]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="mapBgGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="rgba(0, 108, 73, 0.04)" />
            <stop offset="100%" stop-color="rgba(255, 255, 255, 0)" />
          </radialGradient>
        </defs>

        <!-- Background grid design -->
        <rect width="420" height="620" fill="url(#mapBgGrad)" />
        <g stroke="rgba(0, 0, 0, 0.02)" stroke-width="1">
          <path d="M 50 0 L 50 620 M 100 0 L 100 620 M 150 0 L 150 620 M 200 0 L 200 620 M 250 0 L 250 620 M 300 0 L 300 620 M 350 0 L 350 620" />
          <path d="M 0 50 L 420 50 M 0 100 L 420 100 M 0 150 L 420 150 M 0 200 L 420 200 M 0 250 L 420 250 M 0 300 L 420 300 M 0 350 L 420 350 M 0 400 L 420 400 M 0 450 L 420 450 M 0 500 L 420 500 M 0 550 L 420 550" />
        </g>

        <!-- Stylized Outline of Thailand Map (Abstract Silhouette in Light Mode) -->
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
        fill="rgba(0, 108, 73, 0.02)" 
        stroke="rgba(0, 0, 0, 0.08)" 
        stroke-width="2" 
        stroke-linejoin="round" />

        <!-- Connecting vectors -->
        <g stroke="rgba(0, 108, 73, 0.1)" stroke-width="1" stroke-dasharray="3 3">
          <line x1="150" y1="160" x2="210" y2="320" /> <!-- Chiang Mai to Bangkok -->
          <line x1="290" y1="240" x2="210" y2="320" /> <!-- Khon Kaen to Bangkok -->
          <line x1="230" y1="350" x2="210" y2="320" /> <!-- Chon Buri to Bangkok -->
          <line x1="130" y1="520" x2="210" y2="320" /> <!-- Phuket to Bangkok -->
        </g>

        <!-- Hotspot pins with dynamic colors -->
        <g v-for="pin in mappedHotspots" :key="pin.city" class="cursor-pointer group" @click="selectCity(pin)">
          <!-- Pulsating wave -->
          <circle 
            :cx="pin.x" 
            :cy="pin.y" 
            :r="getPulseRadius(pin)" 
            :fill="getSeverityColor(pin.severity, 0.12)" 
            class="map-ping-circle"
            :class="'pulse-' + pin.severity" />
            
          <!-- Inner core marker -->
          <circle 
            :cx="pin.x" 
            :cy="pin.y" 
            :r="getPinRadius(pin)" 
            :fill="getSeverityColor(pin.severity, 0.85)" 
            stroke="#ffffff" 
            stroke-width="1.5" 
            class="transition-all duration-300"
            :class="{ 'glowing': activePingCity === pin.city }" />

          <!-- City title text -->
          <text 
            :x="pin.x" 
            :y="pin.y - 14" 
            text-anchor="middle" 
            fill="#191c1e" 
            font-size="10" 
            font-weight="bold"
            font-family="var(--font-title)"
            class="select-none pointer-events-none drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]">
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

// Stylized coordinate mappings
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
  return getPinRadius(pin) * 2.3;
}

function getSeverityColor(severity, alpha = 1) {
  if (severity === 'high') return `rgba(186, 26, 26, ${alpha})`; // primary red
  if (severity === 'medium') return `rgba(245, 158, 11, ${alpha})`; // yellow
  return `rgba(0, 108, 73, ${alpha})`; // secondary green
}

function selectCity(pin) {
  emit('select-city', pin);
}
</script>
