<template>
  <!-- 1. Line Trend Chart -->
  <div v-if="type === 'line'" class="bg-surface-container-lowest rounded-xl p-md shadow-sm border border-surface-variant flex flex-col min-h-[400px]">
    <div class="flex items-center justify-between mb-md">
      <h3 class="font-headline-sm text-lg text-on-surface font-bold">แนวโน้มอาการรายสัปดาห์</h3>
      <div class="flex items-center gap-sm">
        <span class="flex items-center gap-1.5 text-xs font-data-mono" v-for="series in seriesMeta" :key="series.key">
          <span class="w-2.5 height-2.5 w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: series.color }"></span>
          {{ series.name }}
        </span>
      </div>
    </div>
    
    <div class="flex-1 w-full bg-surface-container-low rounded-lg relative overflow-hidden flex items-end p-4 border border-surface-variant">
      <svg viewBox="0 0 540 200" class="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
        <!-- Area gradients -->
        <defs v-for="series in seriesMeta" :key="'grad-' + series.key">
          <linearGradient :id="'area-' + series.key" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" :stop-color="series.color" stop-opacity="0.15" />
            <stop offset="100%" :stop-color="series.color" stop-opacity="0" />
          </linearGradient>
        </defs>

        <!-- Grids -->
        <g stroke="rgba(0,0,0,0.03)" stroke-width="1">
          <line x1="40" y1="20" x2="520" y2="20" />
          <line x1="40" y1="60" x2="520" y2="60" />
          <line x1="40" y1="100" x2="520" y2="100" />
          <line x1="40" y1="140" x2="520" y2="140" />
          <line x1="40" y1="160" x2="520" y2="160" />
        </g>

        <!-- Y Axis -->
        <g fill="var(--text-muted)" font-size="8" text-anchor="end" font-family="var(--font-body)">
          <text x="32" y="24">{{ maxY }}</text>
          <text x="32" y="64">{{ Math.round(maxY * 0.75) }}</text>
          <text x="32" y="104">{{ Math.round(maxY * 0.5) }}</text>
          <text x="32" y="144">{{ Math.round(maxY * 0.25) }}</text>
          <text x="32" y="164">0</text>
        </g>

        <!-- Render Paths -->
        <g v-for="series in seriesMeta" :key="'paths-' + series.key">
          <path :d="getAreaPath(series.key)" :fill="`url(#area-${series.key})`" />
          <path :d="getLinePath(series.key)" fill="none" :stroke="series.color" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </g>

        <!-- X Axis labels -->
        <g fill="var(--text-muted)" font-size="8" text-anchor="middle" font-family="var(--font-body)">
          <text v-for="(point, idx) in data" v-show="idx % 2 === 0" :key="idx" :x="getX(idx)" y="178">
            {{ point.label }}
          </text>
        </g>
      </svg>
    </div>
  </div>

  <!-- 2. Donut Composition Chart -->
  <div v-else-if="type === 'donut'" class="bg-surface-container-lowest rounded-xl p-md shadow-sm border border-surface-variant flex flex-col min-h-[300px]">
    <h3 class="font-headline-sm text-lg text-on-surface font-bold mb-md">สัดส่วน 5 อันดับอาการสูงสุด</h3>
    <div class="flex-1 flex items-center justify-center gap-lg">
      <!-- Donut Circle SVG -->
      <div class="relative w-36 h-36">
        <svg class="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
          <!-- Background track -->
          <circle cx="18" cy="18" fill="transparent" r="15.9" stroke="#e0e3e5" stroke-width="4"></circle>
          <!-- Slice loops -->
          <circle 
            v-for="(slice, idx) in donutSlices" 
            :key="idx"
            cx="18" 
            cy="18" 
            fill="transparent" 
            r="15.9" 
            :stroke="slice.color" 
            stroke-width="4"
            :stroke-dasharray="slice.dashArray"
            :stroke-dashoffset="slice.dashOffset"
            class="transition-all duration-300" />
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <span class="font-headline-md text-xl font-bold text-on-surface">{{ topSymptomPercentage }}%</span>
          <span class="font-label-caps text-[9px] text-on-surface-variant">{{ topSymptomName }}</span>
        </div>
      </div>

      <!-- Donut Legend details -->
      <div class="flex flex-col gap-2 font-data-mono text-xs">
        <div class="flex items-center gap-2" v-for="(slice, idx) in donutSlices" :key="idx">
          <div class="w-3 h-3 rounded-sm" :style="{ backgroundColor: slice.color }"></div>
          <span class="text-on-surface font-medium">{{ slice.name }} ({{ slice.percent }}%)</span>
        </div>
      </div>
    </div>
  </div>

  <!-- 3. Bar Chart (Appointment status) -->
  <div v-else-if="type === 'bar'" class="bg-surface-container-lowest rounded-xl p-md shadow-sm border border-surface-variant flex flex-col min-h-[300px]">
    <h3 class="font-headline-sm text-lg text-on-surface font-bold mb-md">สถานะการนัดหมาย</h3>
    <div class="flex-1 w-full bg-surface-container-low rounded-lg p-4 flex items-end justify-around border border-surface-variant pb-8 pt-10">
      
      <!-- Confirmed Bar -->
      <div class="w-16 bg-secondary rounded-t flex flex-col justify-end relative group transition-all duration-500" :style="{ height: getBarHeight(barData.confirmed) }">
        <div class="absolute -top-6 w-full text-center font-data-mono text-xs font-bold text-secondary opacity-100">{{ barData.confirmed }}</div>
        <div class="absolute -bottom-6 w-full text-center font-label-caps text-[10px] text-on-surface-variant font-bold">ยืนยัน</div>
      </div>
      
      <!-- Cancelled Bar -->
      <div class="w-16 bg-error rounded-t flex flex-col justify-end relative group transition-all duration-500" :style="{ height: getBarHeight(barData.cancelled) }">
        <div class="absolute -top-6 w-full text-center font-data-mono text-xs font-bold text-error opacity-100">{{ barData.cancelled }}</div>
        <div class="absolute -bottom-6 w-full text-center font-label-caps text-[10px] text-on-surface-variant font-bold">ยกเลิก</div>
      </div>
      
      <!-- No-show Bar -->
      <div class="w-16 bg-tertiary-fixed-dim rounded-t flex flex-col justify-end relative group transition-all duration-500" :style="{ height: getBarHeight(barData.noshow) }">
        <div class="absolute -top-6 w-full text-center font-data-mono text-xs font-bold text-on-tertiary-container opacity-100">{{ barData.noshow }}</div>
        <div class="absolute -bottom-6 w-full text-center font-label-caps text-[10px] text-on-surface-variant font-bold">ไม่มา</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  type: {
    type: String,
    required: true
  },
  data: {
    type: Array,
    default: () => []
  },
  barData: {
    type: Object,
    default: () => ({ confirmed: 10, cancelled: 5, noshow: 2 })
  }
});

// Line series configurations
const seriesMeta = [
  { key: 'Flu symptoms', name: 'ไข้หวัดใหญ่', color: '#191c1e' }, // primary-like black
  { key: 'Dengue Fever', name: 'ไข้เลือดออก', color: '#ba1a1a' }, // error red
  { key: 'Covid-19', name: 'COVID-19', color: '#006c49' } // secondary green
];

// Donut segment colors
const donutColors = ['#191c1e', '#ba1a1a', '#006c49', '#ffb95f', '#76777d'];

// Translate symptoms names to Thai for legend display
const symptomTranslation = {
  'Flu symptoms': 'ไข้',
  'Sore throat': 'ไอ',
  'diarrhea': 'ผื่น',
  'Food Poisoning': 'คลื่นไส้',
  'Allergy': 'อ่อนเพลีย',
  'Pregnancy checkup': 'ตรวจครรภ์',
  'Diarrhea': 'ท้องร่วง',
  'Dengue Fever': 'ไข้เลือดออก',
  'Covid-19': 'COVID-19'
};

function getThaiSymptom(name) {
  return symptomTranslation[name] || name;
}

// 1. Line Math calculations
const maxY = computed(() => {
  if (!props.data.length) return 10;
  let max = 0;
  props.data.forEach(pt => {
    seriesMeta.forEach(sm => {
      const v = pt[sm.key] || 0;
      if (v > max) max = v;
    });
  });
  return Math.ceil((max + 2) / 4) * 4;
});

const chartWidth = 480;
const chartHeight = 140;

function getX(idx) {
  if (!props.data.length) return 40;
  return 40 + (idx / (props.data.length - 1)) * chartWidth;
}

function getY(val) {
  const ratio = val / maxY.value;
  return 160 - (ratio * chartHeight);
}

function getLinePath(key) {
  if (!props.data.length) return '';
  return props.data.map((pt, idx) => {
    const x = getX(idx);
    const y = getY(pt[key] || 0);
    return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
}

function getAreaPath(key) {
  if (!props.data.length) return '';
  const line = getLinePath(key);
  const startX = getX(0);
  const endX = getX(props.data.length - 1);
  const baseY = getY(0);
  return `${line} L ${endX} ${baseY} L ${startX} ${baseY} Z`;
}

// 2. Donut math calculations
const totalDonutValue = computed(() => {
  return props.data.reduce((acc, curr) => acc + curr.value, 0);
});

const topSymptomPercentage = computed(() => {
  if (!props.data.length || totalDonutValue.value === 0) return 0;
  return Math.round((props.data[0].value / totalDonutValue.value) * 100);
});

const topSymptomName = computed(() => {
  if (!props.data.length) return 'ไม่มี';
  return getThaiSymptom(props.data[0].name);
});

const donutSlices = computed(() => {
  const circumference = 100; // 100% stroke dash length mapping
  let accumulatedPercent = 0;

  return props.data.map((sym, idx) => {
    const percent = totalDonutValue.value > 0 
      ? Math.round((sym.value / totalDonutValue.value) * 100) 
      : 0;

    const dashArray = `${percent} ${100 - percent}`;
    const dashOffset = `${100 - accumulatedPercent}`;
    
    accumulatedPercent += percent;

    return {
      name: getThaiSymptom(sym.name),
      value: sym.value,
      percent,
      color: donutColors[idx % donutColors.length],
      dashArray,
      dashOffset
    };
  });
});

// 3. Bar Math Height calculations
function getBarHeight(val) {
  const max = Math.max(props.barData.confirmed || 1, props.barData.cancelled || 1, props.barData.noshow || 1, 10);
  const percent = Math.max((val / max) * 100, 5); // minimum 5% to keep visual bar visible
  return `${percent}%`;
}
</script>
