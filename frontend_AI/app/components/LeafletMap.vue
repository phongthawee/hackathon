<template>
  <div :class="fullCanvas ? 'w-full h-full relative' : 'bg-surface-container-lowest rounded-xl p-md shadow-sm border border-surface-variant flex flex-col h-full min-h-[460px]'">
    <!-- Card header -->
    <div v-if="!fullCanvas" class="flex justify-between items-center mb-md border-b border-surface-variant pb-xs">
      <div>
        <h3 class="font-headline-sm text-lg text-on-surface font-bold">Geographical Outbreak Map</h3>
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
  }
});

const emit = defineEmits(['select-city']);

let mapInstance = null;
let clusterGroup = null;

// Map coordinates mapping for backup cases
const coordinateMap = {
  'Chiang Mai': { lat: 18.7883, lng: 98.9853, name: 'Chiang Mai Ram Hospital' },
  'Bangkok': { lat: 13.7563, lng: 100.5018, name: 'Bangkok General Hospital' },
  'Khon Kaen': { lat: 16.4322, lng: 102.8236, name: 'Khon Kaen City Hospital' },
  'Chon Buri': { lat: 13.3611, lng: 100.9847, name: 'Chon Buri Memorial Hospital' },
  'Phuket': { lat: 7.8804, lng: 98.3923, name: 'Phuket International Hospital' }
};

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

  props.hotspots.forEach(spot => {
    // Lookup coords
    const mapping = coordinateMap[spot.city] || { lat: spot.lat, lng: spot.lng, name: `${spot.city} Clinic` };
    
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
        <h4 class="font-bold text-sm text-primary mb-0.5">${mapping.name}</h4>
        <p class="text-[10px] text-on-surface-variant font-bold mb-2">จังหวัด: ${spot.city}</p>
        
        <div class="bg-surface-container-low p-2.5 rounded border border-outline-variant/30 text-[10px] leading-relaxed text-on-surface mb-3">
          <div class="font-bold text-xs mb-1">สถิติสะสม: ${spot.totalCases} เคส</div>
          <ul class="flex flex-col gap-1 list-none pl-0">
            ${symptomsHtml}
          </ul>
        </div>
        
        <button id="btn-popup-${spot.city}" class="w-full text-center bg-primary text-on-primary py-1.5 px-3 rounded text-[10px] font-bold hover:opacity-90 block">
          ดูรายละเอียดเพิ่มเติม
        </button>
      </div>
    `;

    // Create marker
    const marker = L.marker([mapping.lat, mapping.lng], { icon: customIcon })
      .bindPopup(popupHtml, { maxWidth: 280 });

    // Click handler to open the sidebar panel in parent component
    marker.on('click', () => {
      emit('select-city', spot);
      
      // Delay to ensure popup DOM renders, then register button click trigger
      setTimeout(() => {
        const btn = document.getElementById(`btn-popup-${spot.city}`);
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

onMounted(() => {
  if (typeof window !== 'undefined' && window.L) {
    const L = window.L;

    // Initialize map centered on Thailand
    mapInstance = L.map('leaflet-map', {
      center: [13.736717, 100.523186],
      zoom: 6,
      zoomControl: true
    });

    // Load OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapInstance);

    // Initial render
    renderMarkers();
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
