<template>
  <!-- 1. Line Trend Chart -->
  <div v-if="type === 'line'" class="bg-surface-container-lowest rounded-xl p-md shadow-sm border border-surface-variant flex flex-col min-h-[400px]">
    <div class="flex items-center justify-between mb-md">
      <h3 class="font-headline-sm text-lg text-on-surface font-bold">แนวโน้มอาการรายเดือน</h3>
      <div class="flex items-center gap-sm">
        <span class="flex items-center gap-1.5 text-xs font-data-mono cursor-pointer transition-opacity duration-300" 
              v-for="series in seriesMeta" :key="series.key"
              @mouseenter="hoveredSymptom = series.name"
              @mouseleave="hoveredSymptom = null"
              :class="{ 'opacity-100': hoveredSymptom === null || hoveredSymptom === series.name, 'opacity-40': hoveredSymptom !== null && hoveredSymptom !== series.name }">
          <span class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: series.color }"></span>
          {{ series.name }}
        </span>
      </div>
    </div>
    
    <div class="flex-1 w-full bg-surface-container-low rounded-lg relative overflow-hidden flex items-end p-4 border border-surface-variant">
      <svg viewBox="0 0 540 200" class="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
        <!-- Area gradients -->
        <defs v-for="series in seriesMeta" :key="'grad-' + series.key">
          <linearGradient :id="'area-' + series.key" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" :stop-color="series.color" stop-opacity="0.3" />
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
        <g v-for="series in seriesMeta" :key="'paths-' + series.key" 
           class="group transition-opacity duration-300"
           :class="{ 'opacity-100': hoveredSymptom === null || hoveredSymptom === series.name, 'opacity-10': hoveredSymptom !== null && hoveredSymptom !== series.name }">
          <path :d="getAreaPath(series.key)" :fill="`url(#area-${series.key})`" class="transition-all duration-1000 ease-out opacity-80 group-hover:opacity-100" />
          <path :d="getLinePath(series.key)" fill="none" :stroke="series.color" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" class="drop-shadow-md transition-all duration-1000 ease-out" style="filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.1));" />
          <!-- Interactive hover dots -->
          <circle v-for="(point, idx) in data" :key="'pt-'+idx" :cx="getX(idx)" :cy="getY(point[series.key] || 0)" r="4.5" :fill="series.color" stroke="#ffffff" stroke-width="2" class="opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-crosshair drop-shadow-sm" />
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
            @mouseenter="hoveredSymptom = slice.name"
            @mouseleave="hoveredSymptom = null"
            class="transition-all duration-300 cursor-pointer"
            :class="{ 'opacity-100': hoveredSymptom === null || hoveredSymptom === slice.name, 'opacity-30': hoveredSymptom !== null && hoveredSymptom !== slice.name }" />
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <span class="font-headline-md text-xl font-bold text-on-surface">{{ topSymptomPercentage }}%</span>
          <span class="font-label-caps text-[9px] text-on-surface-variant">{{ topSymptomName }}</span>
        </div>
      </div>

      <!-- Donut Legend details -->
      <div class="flex flex-col gap-2 font-data-mono text-xs">
        <div class="flex items-center gap-2 cursor-pointer transition-opacity duration-300" 
             v-for="(slice, idx) in donutSlices" :key="idx"
             @mouseenter="hoveredSymptom = slice.name"
             @mouseleave="hoveredSymptom = null"
             :class="{ 'opacity-100': hoveredSymptom === null || hoveredSymptom === slice.name, 'opacity-40': hoveredSymptom !== null && hoveredSymptom !== slice.name }">
          <div class="w-3 h-3 rounded-sm" :style="{ backgroundColor: slice.color }"></div>
          <span class="text-on-surface font-medium">{{ slice.name }} ({{ slice.percent }}%)</span>
        </div>
      </div>
    </div>
  </div>

  <!-- 3. Bar Chart (Appointment status) -->
  <div v-else-if="type === 'bar'" class="bg-surface-container-lowest rounded-xl p-md shadow-sm border border-surface-variant flex flex-col h-[320px]">
    <div class="flex items-center justify-between mb-md">
      <h3 class="font-headline-sm text-lg text-on-surface font-bold">สถานะการนัดหมาย</h3>
      <div class="flex gap-2">
        <span class="px-2 py-1 bg-surface-variant/50 rounded-md text-[11px] font-medium text-on-surface-variant font-data-mono">รวม {{ totalAppointments }} รายการ</span>
      </div>
    </div>

    <div class="w-full relative flex-1 bg-surface-container-low/30 rounded-xl flex items-end justify-around border border-surface-variant pb-8 pt-12 mt-auto overflow-hidden">
      <!-- Background grid lines -->
      <div class="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 pt-12">
        <div class="w-full border-b border-surface-variant/40 border-dashed"></div>
        <div class="w-full border-b border-surface-variant/40 border-dashed"></div>
        <div class="w-full border-b border-surface-variant/40 border-dashed"></div>
        <div class="w-full border-b border-surface-variant/40 border-dashed"></div>
      </div>

      <!-- Confirmed Bar -->
      <div class="relative w-20 h-full flex flex-col justify-end items-center group cursor-pointer z-10">
        <div class="absolute bottom-0 w-12 h-[calc(100%-1rem)] bg-surface-variant/20 rounded-t-xl group-hover:bg-surface-variant/40 transition-colors duration-300"></div>
        
        <div class="w-12 bg-gradient-to-t from-emerald-600/30 via-emerald-500 to-emerald-400 rounded-t-xl relative shadow-[0_0_15px_rgba(16,185,129,0.15)] group-hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all duration-700 ease-out border-t-2 border-emerald-200/50 backdrop-blur-sm" :style="{ height: getBarHeight(barData ? barData.confirmed : 0) }">
           <div class="absolute inset-x-1 top-1 bottom-0 bg-gradient-to-b from-white/20 to-transparent rounded-t-lg pointer-events-none"></div>
        </div>
        
        <div class="absolute transition-all duration-500 flex flex-col items-center" :style="{ bottom: `calc(${getBarHeight(barData ? barData.confirmed : 0)} + 8px)` }">
          <div class="bg-surface-container-highest shadow-xl border border-surface-variant rounded-full px-3 py-1 font-data-mono text-sm font-bold text-emerald-500 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-md z-20">
            {{ barData ? barData.confirmed : 0 }}
          </div>
          <div class="absolute top-2 font-data-mono text-sm font-bold text-emerald-600 dark:text-emerald-400 group-hover:opacity-0 transition-opacity duration-300">
            {{ barData ? barData.confirmed : 0 }}
          </div>
        </div>

        <div class="absolute -bottom-7 flex flex-col items-center w-full">
          <span class="font-label-caps text-[11px] text-emerald-600 dark:text-emerald-400 font-bold tracking-wider">✅ ยืนยัน</span>
        </div>
      </div>
      
      <!-- Cancelled Bar -->
      <div class="relative w-20 h-full flex flex-col justify-end items-center group cursor-pointer z-10">
        <div class="absolute bottom-0 w-12 h-[calc(100%-1rem)] bg-surface-variant/20 rounded-t-xl group-hover:bg-surface-variant/40 transition-colors duration-300"></div>
        
        <div class="w-12 bg-gradient-to-t from-rose-600/30 via-rose-500 to-rose-400 rounded-t-xl relative shadow-[0_0_15px_rgba(244,63,94,0.15)] group-hover:shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all duration-700 ease-out border-t-2 border-rose-200/50 backdrop-blur-sm" :style="{ height: getBarHeight(barData ? barData.cancelled : 0) }">
           <div class="absolute inset-x-1 top-1 bottom-0 bg-gradient-to-b from-white/20 to-transparent rounded-t-lg pointer-events-none"></div>
        </div>
        
        <div class="absolute transition-all duration-500 flex flex-col items-center" :style="{ bottom: `calc(${getBarHeight(barData ? barData.cancelled : 0)} + 8px)` }">
          <div class="bg-surface-container-highest shadow-xl border border-surface-variant rounded-full px-3 py-1 font-data-mono text-sm font-bold text-rose-500 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-md z-20">
            {{ barData ? barData.cancelled : 0 }}
          </div>
          <div class="absolute top-2 font-data-mono text-sm font-bold text-rose-600 dark:text-rose-400 group-hover:opacity-0 transition-opacity duration-300">
            {{ barData ? barData.cancelled : 0 }}
          </div>
        </div>

        <div class="absolute -bottom-7 flex flex-col items-center w-full">
          <span class="font-label-caps text-[11px] text-rose-600 dark:text-rose-400 font-bold tracking-wider">❌ ยกเลิก</span>
        </div>
      </div>
      
      <!-- No-show Bar -->
      <div class="relative w-20 h-full flex flex-col justify-end items-center group cursor-pointer z-10">
        <div class="absolute bottom-0 w-12 h-[calc(100%-1rem)] bg-surface-variant/20 rounded-t-xl group-hover:bg-surface-variant/40 transition-colors duration-300"></div>
        
        <div class="w-12 bg-gradient-to-t from-amber-600/30 via-amber-500 to-amber-400 rounded-t-xl relative shadow-[0_0_15px_rgba(245,158,11,0.15)] group-hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all duration-700 ease-out border-t-2 border-amber-200/50 backdrop-blur-sm" :style="{ height: getBarHeight(barData ? barData.noshow : 0) }">
           <div class="absolute inset-x-1 top-1 bottom-0 bg-gradient-to-b from-white/20 to-transparent rounded-t-lg pointer-events-none"></div>
        </div>
        
        <div class="absolute transition-all duration-500 flex flex-col items-center" :style="{ bottom: `calc(${getBarHeight(barData ? barData.noshow : 0)} + 8px)` }">
          <div class="bg-surface-container-highest shadow-xl border border-surface-variant rounded-full px-3 py-1 font-data-mono text-sm font-bold text-amber-500 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-md z-20">
            {{ barData ? barData.noshow : 0 }}
          </div>
          <div class="absolute top-2 font-data-mono text-sm font-bold text-amber-600 dark:text-amber-400 group-hover:opacity-0 transition-opacity duration-300">
            {{ barData ? barData.noshow : 0 }}
          </div>
        </div>

        <div class="absolute -bottom-7 flex flex-col items-center w-full">
          <span class="font-label-caps text-[11px] text-amber-600 dark:text-amber-400 font-bold tracking-wider">⚠️ ไม่มา</span>
        </div>
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

// Global Hover State for Cross-Highlighting
const hoveredSymptom = useState('hovered-symptom', () => null);

// Shared semantic color palette for Top 1 to Top 5 (matches donut and line)
const rankColors = ['#4f46e5', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
const othersColor = '#94a3b8';

// Dynamic Line series configurations
const seriesMeta = computed(() => {
  if (!props.data.length) return [];
  let keys = Object.keys(props.data[0]).filter(k => k !== 'label' && k !== 'อื่นๆ');
  
  // Calculate total volume over the year to sort keys (Top 1 -> Top N)
  const totals = {};
  keys.forEach(k => {
    totals[k] = props.data.reduce((sum, pt) => sum + (pt[k] || 0), 0);
  });
  
  // Sort descending by total volume
  keys.sort((a, b) => totals[b] - totals[a]);
  
  // Re-append 'อื่นๆ' at the end if it exists
  if (Object.keys(props.data[0]).includes('อื่นๆ')) {
    keys.push('อื่นๆ');
  }

  return keys.map((key, index) => {
    return {
      key: key,
      name: key, // Using raw symptom string from DB
      color: key === 'อื่นๆ' ? othersColor : rankColors[index % rankColors.length]
    };
  });
});

// Donut segment colors (Synced exactly with line palette)
const donutColors = rankColors;

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
    seriesMeta.value.forEach(sm => {
      const v = pt[sm.key] || 0;
      if (v > max) max = v;
    });
  });
  return Math.ceil((max + 2) / 4) * 4;
});

const chartWidth = 480;
const chartHeight = 140;

const barMax = computed(() => {
  if (!props.barData) return 10;
  return Math.max(props.barData.confirmed || 0, props.barData.cancelled || 0, props.barData.noshow || 0, 10);
});

const totalAppointments = computed(() => {
  if (!props.barData) return 0;
  return (props.barData.confirmed || 0) + (props.barData.cancelled || 0) + (props.barData.noshow || 0);
});

function getBarHeight(val) {
  if (barMax.value === 0) return '5%';
  return `${Math.max((val / barMax.value) * 100, 5)}%`;
}

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
  let d = '';
  for (let idx = 0; idx < props.data.length; idx++) {
    const x = getX(idx);
    const y = getY(props.data[idx][key] || 0);
    if (idx === 0) {
      d += `M ${x} ${y}`;
    } else {
      const prevX = getX(idx - 1);
      const prevY = getY(props.data[idx - 1][key] || 0);
      const cp1X = prevX + (x - prevX) * 0.4;
      const cp1Y = prevY;
      const cp2X = x - (x - prevX) * 0.4;
      const cp2Y = y;
      d += ` C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${x} ${y}`;
    }
  }
  return d;
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

</script>
