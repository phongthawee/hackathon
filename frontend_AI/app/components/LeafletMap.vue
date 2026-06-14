<template>
  <div :class="fullCanvas ? 'w-full h-full relative' : 'bg-surface-container-lowest rounded-xl p-md shadow-sm border border-surface-variant flex flex-col h-full min-h-[460px]'">
    <!-- Card header -->
    <div v-if="!fullCanvas" class="flex justify-between items-center mb-md border-b border-surface-variant pb-xs">
      <div>
        <h3 class="font-headline-sm text-lg text-on-surface font-bold">แผนที่การระบาดระดับภูมิศาสตร์</h3>
        <p class="text-xs text-on-surface-variant mt-0.5">แผนที่พิกัดจริง GIS แสดงระดับความรุนแรงของโรคติดต่อและพิกัดสถานพยาบาล</p>
      </div>
      <div class="flex items-center gap-xs text-[10px] font-bold text-on-surface-variant">
        🟢 สถิติต่ำ | 🟡 เฝ้าระวังสีเหลือง | 🔴 ระบาดรุนแรง
      </div>
    </div>

    <!-- Map viewport -->
    <div :class="fullCanvas ? 'w-full h-full' : 'flex-grow rounded-lg border border-surface-variant overflow-hidden min-h-[380px] relative'">
      <div id="leaflet-map" class="absolute inset-0 w-full h-full z-10"></div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, watch } from 'vue';

const props = defineProps({
  // Accept real-time hotspots calculated from backend
  hotspots: {
    type: Array,
    default: () => []
  },
  fullCanvas: {
    type: Boolean,
    default: false
  },
  // Region key ที่ถูกเลือกจาก parent (เช่น 'north', 'south', '')
  activeRegion: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['select-city']);

let mapInstance = null;
let clusterGroup = null;

// ===== Region Config: พิกัดกรอบของแต่ละภาค (สำหรับ flyToBounds เท่านั้น) =====
const regionConfig = {
  north:     { bounds: [[12.68, 97.34], [20.46, 101.17]], zoom: 7 },
  northeast: { bounds: [[14.06, 100.08], [18.45, 105.64]], zoom: 7 },
  central:   { bounds: [[12.5, 98.5], [16.5, 101.8]], zoom: 8 },
  east:      { bounds: [[12.0, 100.7], [14.4, 103.2]], zoom: 8 },
  west:      { bounds: [[10.5, 97.5], [16.2, 100.5]], zoom: 8 },
  south:     { bounds: [[5.6, 98.0], [12.7, 102.0]], zoom: 7 }
};

// Backup map coordinates when backend does not send coordinates
const coordinateMap = {
  'Chiang Mai': { lat: 18.7883, lng: 98.9853, name: 'Chiang Mai Ram Hospital' },
  'Bangkok': { lat: 13.7563, lng: 100.5018, name: 'Bangkok General Hospital' },
  'Khon Kaen': { lat: 16.4322, lng: 102.8236, name: 'Khon Kaen City Hospital' },
  'Chon Buri': { lat: 13.3611, lng: 100.9847, name: 'Chon Buri Memorial Hospital' },
  'Phuket': { lat: 7.8804, lng: 98.3923, name: 'Phuket International Hospital' }
};

// ===== บินไปยังภาคที่เลือก (ไม่วาด overlay) =====
function flyToRegion(regionKey) {
  if (!mapInstance) return;

  // ถ้าไม่มีภาคที่เลือก → zoom กลับ Thailand
  if (!regionKey || !regionConfig[regionKey]) {
    mapInstance.flyTo([13.736717, 100.523186], 6, {
      duration: 1.0,
      easeLinearity: 0.3
    });
    return;
  }

  const cfg = regionConfig[regionKey];

  // ✈️ FlyToBounds — animate ลื่นไปยังภาคที่เลือก
  mapInstance.flyToBounds(cfg.bounds, {
    padding: [40, 40],
    duration: 1.2,
    easeLinearity: 0.25,
    maxZoom: cfg.zoom
  });
}

// Main function to draw markers on Leaflet
function renderMarkers() {
  if (!mapInstance || !window.L) return;

  const L = window.L;

  // Clear existing layers to redraw fresh points
  if (clusterGroup) {
    clusterGroup.clearLayers();
  } else {
    clusterGroup = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 40
    });
    mapInstance.addLayer(clusterGroup);
  }

  props.hotspots.forEach((spot, index) => {
    // Prefer coordinates delivered from backend, fallback to static map only if missing
    const fallback = coordinateMap[spot.city] || { lat: 13.7563, lng: 100.5018, name: `${spot.city} Clinic` };
    const markerLat = Number(spot.lat) || fallback.lat;
    const markerLng = Number(spot.lng) || fallback.lng;
    const facilityName = spot.hospitalName || spot.hospital || fallback.name;
    
    // Choose pin colors based on severity
    let colorClass = 'bg-secondary';
    let shadowColor = '#006c49';
    if (spot.severity === 'high') {
      colorClass = 'bg-error animate-ping';
      shadowColor = '#ba1a1a';
    } else if (spot.severity === 'medium') {
      colorClass = 'bg-tertiary-fixed-dim';
      shadowColor = '#ffb95f';
    }

    const pinRadius = 4.5 + Math.min(spot.totalCases / 35, 8);

    // Dynamic glowing marker Icon using Tailwind CSS
    const customIcon = L.divIcon({
      html: `
        <div class="relative w-8 h-8 flex items-center justify-center">
          <span class="absolute inline-flex h-full w-full rounded-full opacity-60" style="background-color: ${shadowColor}; animation: pulsate 2s infinite ease-out;"></span>
          <span class="relative inline-flex rounded-full border border-white shadow-md transition-all duration-300 ${colorClass}" style="width: ${pinRadius * 2.2}px; height: ${pinRadius * 2.2}px;"></span>
        </div>
      `,
      className: 'custom-leaflet-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    // Generate symptoms HTML bullet list
    const symptomsHtml = spot.topSymptoms && spot.topSymptoms.length 
      ? spot.topSymptoms.map(sym => `<li>🔹 ${sym}</li>`).join('')
      : '<li>ไม่มีประวัติความผิดปกติ</li>';

    // Tailwind CSS styled popup card template
    const popupHtml = `
      <div class="p-1 font-body-md min-w-[220px]">
        <div class="flex items-center gap-1.5 mb-2">
          <span class="w-2.5 h-2.5 rounded-full ${spot.severity === 'high' ? 'bg-error' : spot.severity === 'medium' ? 'bg-tertiary-fixed-dim' : 'bg-secondary'}"></span>
          <span class="font-label-caps text-[9px] font-bold text-outline uppercase">${spot.severity === 'high' ? 'เตือนภัยระดับวิกฤต' : 'ระดับปกติ/เฝ้าระวัง'}</span>
        </div>
        <h4 class="font-bold text-sm text-primary mb-0.5">${facilityName}</h4>
        <p class="text-[10px] text-on-surface-variant font-bold mb-2">จังหวัด: ${spot.city}</p>
        
        <div class="bg-surface-container-low p-2.5 rounded border border-outline-variant/30 text-[10px] leading-relaxed text-on-surface mb-3">
          <div class="font-bold text-xs mb-1">สถิติสะสม: ${spot.totalCases} เคส</div>
          <ul class="flex flex-col gap-1 list-none pl-0">
            ${symptomsHtml}
          </ul>
        </div>
        
        
      </div>
    `;

    // Create marker
    const marker = L.marker([markerLat, markerLng], { icon: customIcon })
      .bindPopup(popupHtml, { maxWidth: 280 });

    // Click handler to open the sidebar panel in parent component
    marker.on('click', () => {
      emit('select-city', spot);
      
      // Delay to ensure popup DOM renders, then register button click trigger
      setTimeout(() => {
        const btn = document.getElementById(`btn-popup-${spot.city}-${index}`);
        if (btn) {
          btn.addEventListener('click', () => {
            emit('select-city', spot);
          });
        }
      }, 200);
    });

    clusterGroup.addLayer(marker);
  });
}

// Watch hotspots data from parent and refresh markers list
watch(() => props.hotspots, () => {
  renderMarkers();
}, { deep: true });

// Watch activeRegion prop — binto ภาคที่เลือกทันทีที่เปลี่ยน
watch(() => props.activeRegion, (newRegion) => {
  flyToRegion(newRegion);
});

onMounted(() => {
  if (typeof window !== 'undefined' && window.L) {
    const L = window.L;

    // Initialize map centered on Thailand
    mapInstance = L.map('leaflet-map', {
      center: [13.736717, 100.523186],
      zoom: 6,
      zoomControl: true
    });

    // Load Longdo Map tile layer (ใช้ key จาก env)
    const longdoKey = (window.__NUXT__?.config?.public?.longdoKey) || '';
    if (longdoKey) {
      L.tileLayer(`https://ms.longdo.com/mmmap/tile.php?zoom={z}&x={x}&y={y}&key=${longdoKey}&proj=epsg3857&HD=1`, {
        maxZoom: 18,
        attribution: '&copy; <a href="https://map.longdo.com">Longdo Map</a>'
      }).addTo(mapInstance);
    } else {
      // Fallback: OpenStreetMap ถ้าไม่มี key
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapInstance);
    }

    // Initial render markers
    renderMarkers();

    // วาด region overlay ถ้ามีค่าเริ่มต้น
    if (props.activeRegion) {
      drawRegionOverlay(props.activeRegion);
    }
  }
});

onBeforeUnmount(() => {
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
  }
});
</script>

<style>
@keyframes pulsate {
  0% { transform: scale(0.5); opacity: 0.8; }
  100% { transform: scale(2.2); opacity: 0; }
}

.custom-leaflet-icon {
  background: none !important;
  border: none !important;
}

.leaflet-popup-content-wrapper {
  background: #ffffff !important;
  border: 1px solid #e0e3e5 !important;
  border-radius: 12px !important;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
  padding: 4px !important;
}

.leaflet-popup-tip {
  background: #ffffff !important;
  border: 1px solid #e0e3e5 !important;
}
</style>
