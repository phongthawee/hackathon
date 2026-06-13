// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  
  app: {
    head: {
      title: 'Health Radar - Surveillance & Outbreak System',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap' },
        // Leaflet Stylesheet
        { rel: 'stylesheet', href: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css' },
        // Leaflet Marker Cluster Stylesheets
        { rel: 'stylesheet', href: 'https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.css' },
        { rel: 'stylesheet', href: 'https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.Default.css' }
      ],
      script: [
        // Leaflet Javascript Core
        { src: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js' },
        // Leaflet Marker Cluster plugin
        { src: 'https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js' }
      ]
    }
  }
})
