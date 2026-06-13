<template>
  <div class="charts-container">
    <!-- 1. Line Trend Chart -->
    <div class="chart-card glass-panel trend-card">
      <div class="chart-header">
        <h4>Weekly Symptom Trend (90 วันย้อนหลัง)</h4>
        <div class="legend-row">
          <span class="legend-item" v-for="item in seriesMeta" :key="item.key">
            <span class="legend-color" :style="{ backgroundColor: item.color }"></span>
            {{ item.name }}
          </span>
        </div>
      </div>
      
      <div class="chart-svg-container">
        <svg viewBox="0 0 540 220" class="trend-svg" xmlns="http://www.w3.org/2000/svg">
          <!-- Gradients for fill areas -->
          <defs v-for="item in seriesMeta" :key="'grad-' + item.key">
            <linearGradient :id="'areaGrad-' + item.key" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" :stop-color="item.color" stop-opacity="0.25" />
              <stop offset="100%" :stop-color="item.color" stop-opacity="0" />
            </linearGradient>
          </defs>

          <!-- Grid Lines -->
          <g stroke="rgba(255, 255, 255, 0.03)" stroke-width="1">
            <line x1="40" y1="20" x2="520" y2="20" />
            <line x1="40" y1="65" x2="520" y2="65" />
            <line x1="40" y1="110" x2="520" y2="110" />
            <line x1="40" y1="155" x2="520" y2="155" />
            <line x1="40" y1="180" x2="520" y2="180" />
          </g>

          <!-- Y Axis Labels -->
          <g fill="var(--text-muted)" font-size="9" text-anchor="end" font-family="var(--font-body)">
            <text x="32" y="24">{{ maxY }}</text>
            <text x="32" y="69">{{ Math.round(maxY * 0.75) }}</text>
            <text x="32" y="114">{{ Math.round(maxY * 0.5) }}</text>
            <text x="32" y="159">{{ Math.round(maxY * 0.25) }}</text>
            <text x="32" y="184">0</text>
          </g>

          <!-- Render Areas and Lines for each disease series -->
          <g v-for="series in seriesMeta" :key="'lines-' + series.key">
            <!-- Gradient Area -->
            <path 
              :d="getAreaPath(series.key)" 
              :fill="`url(#areaGrad-${series.key})`" />
            <!-- Line path -->
            <path 
              :d="getLinePath(series.key)" 
              fill="none" 
              :stroke="series.color" 
              stroke-width="2.5" 
              stroke-linecap="round" 
              stroke-linejoin="round" />
          </g>

          <!-- X Axis Labels (every 2 weeks to prevent overlap) -->
          <g fill="var(--text-muted)" font-size="9" text-anchor="middle" font-family="var(--font-body)">
            <text 
              v-for="(point, idx) in trend" 
              v-show="idx % 2 === 0" 
              :key="'lbl-' + idx" 
              :x="getX(idx)" 
              y="198">
              {{ point.label }}
            </text>
          </g>
        </svg>
      </div>
    </div>

    <!-- 2. Donut Composition Chart -->
    <div class="chart-card glass-panel donut-card">
      <div class="chart-header">
        <h4>Top 5 Symptoms Profile</h4>
      </div>
      
      <div class="donut-body">
        <div class="donut-svg-wrapper">
          <svg viewBox="0 0 200 200" class="donut-svg">
            <g v-for="(slice, idx) in donutSlices" :key="'slice-' + idx">
              <circle 
                cx="100" 
                cy="100" 
                r="70" 
                fill="none" 
                :stroke="slice.color" 
                stroke-width="20" 
                :stroke-dasharray="slice.dashArray" 
                :stroke-dashoffset="slice.dashOffset" 
                transform="rotate(-90 100 100)" 
                class="donut-segment" />
            </g>
            <!-- Center circle cover -->
            <circle cx="100" cy="100" r="55" fill="var(--bg-surface-solid)" />
            <!-- Total count label -->
            <g font-family="var(--font-title)" text-anchor="middle" fill="#ffffff">
              <text x="100" y="96" font-size="11" fill="var(--text-secondary)">เคสสะสม</text>
              <text x="100" y="118" font-size="20" font-weight="800">{{ totalSymptomCases }}</text>
            </g>
          </svg>
        </div>
        
        <div class="donut-legend">
          <div class="donut-legend-item" v-for="(slice, idx) in donutSlices" :key="'dlegend-' + idx">
            <span class="legend-color" :style="{ backgroundColor: slice.color }"></span>
            <div class="legend-text-row">
              <span class="symptom-name">{{ slice.name }}</span>
              <span class="symptom-percent">{{ slice.percent }}% ({{ slice.value }} เคส)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  trend: {
    type: Array,
    default: () => []
  },
  topSymptoms: {
    type: Array,
    default: () => []
  }
});

// 5 Series Meta details
const seriesMeta = [
  { key: 'Flu symptoms', name: 'ไข้หวัดใหญ่', color: '#06b6d4' },
  { key: 'Food Poisoning', name: 'อาหารเป็นพิษ', color: '#ef4444' },
  { key: 'Dengue Fever', name: 'ไข้เลือดออก', color: '#f59e0b' },
  { key: 'Covid-19', name: 'โควิด-19', color: '#10b981' },
  { key: 'Diarrhea', name: 'ท้องร่วง', color: '#8b5cf6' }
];

// 1. Line Trend Math calculations
const maxY = computed(() => {
  if (!props.trend.length) return 10;
  let max = 0;
  props.trend.forEach(point => {
    seriesMeta.forEach(series => {
      const val = point[series.key] || 0;
      if (val > max) max = val;
    });
  });
  // Return rounded multiple of 4
  return Math.ceil((max + 2) / 4) * 4;
});

const chartWidth = 480; // (520 - 40)
const chartHeight = 160; // (180 - 20)

function getX(index) {
  if (!props.trend.length) return 40;
  const count = props.trend.length;
  return 40 + (index / (count - 1)) * chartWidth;
}

function getY(value) {
  const ratio = value / maxY.value;
  return 180 - (ratio * chartHeight);
}

function getLinePath(key) {
  if (!props.trend.length) return '';
  return props.trend.map((point, idx) => {
    const x = getX(idx);
    const y = getY(point[key] || 0);
    return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
}

function getAreaPath(key) {
  if (!props.trend.length) return '';
  const linePath = getLinePath(key);
  const startX = getX(0);
  const endX = getX(props.trend.length - 1);
  const baseY = getY(0);
  return `${linePath} L ${endX} ${baseY} L ${startX} ${baseY} Z`;
}

// 2. Donut Composition Math calculations
const donutColors = ['#06b6d4', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6'];

const totalSymptomCases = computed(() => {
  return props.topSymptoms.reduce((acc, curr) => acc + curr.value, 0);
});

const donutSlices = computed(() => {
  const circumference = 2 * Math.PI * 70; // 2 * pi * r = 439.82
  let accumulatedPercent = 0;

  return props.topSymptoms.map((sym, idx) => {
    const percent = totalSymptomCases.value > 0 
      ? Math.round((sym.value / totalSymptomCases.value) * 100) 
      : 0;

    const dashArray = `${circumference}`;
    const dashOffset = `${circumference - (sym.value / totalSymptomCases.value) * circumference}`;
    
    // Compute cumulative offset rotated
    const offsetRotation = (accumulatedPercent / 100) * circumference;
    accumulatedPercent += (sym.value / totalSymptomCases.value) * 100;

    return {
      name: sym.name,
      value: sym.value,
      percent,
      color: donutColors[idx % donutColors.length],
      dashArray,
      dashOffset: circumference - (accumulatedPercent / 100) * circumference
    };
  });
});
</script>

<style scoped>
.charts-container {
  display: grid;
  grid-template-columns: 1.8fr 1.2fr;
  gap: 24px;
  margin-bottom: 24px;
}

.chart-card {
  padding: 24px;
  display: flex;
  flex-direction: column;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.chart-header h4 {
  font-family: var(--font-title);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.legend-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.legend-color {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.chart-svg-container {
  flex-grow: 1;
  display: flex;
  align-items: center;
}

.trend-svg {
  width: 100%;
  height: auto;
}

.donut-body {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  flex-grow: 1;
}

.donut-svg-wrapper {
  width: 130px;
  height: 130px;
}

.donut-svg {
  width: 100%;
  height: 100%;
}

.donut-segment {
  transition: stroke-width 0.2s ease, stroke-dashoffset 0.5s ease;
  transform-origin: center;
}

.donut-segment:hover {
  stroke-width: 24px;
}

.donut-legend {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-grow: 1;
}

.donut-legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-text-row {
  display: flex;
  flex-direction: column;
}

.symptom-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-primary);
}

.symptom-percent {
  font-size: 0.75rem;
  color: var(--text-secondary);
}
</style>
