/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/components/**/*.{vue,js,ts}',
    './app/layouts/**/*.vue',
    './app/pages/**/*.vue',
    './app/composables/**/*.{js,ts}',
    './app/plugins/**/*.{js,ts}',
    './app/utils/**/*.{js,ts}',
    './app/app.vue',
    './app/error.vue'
  ],
  theme: {
    extend: {
      colors: {
        "outline-variant": "#c6c6cd",
        "surface": "#f7f9fb",
        "surface-tint": "#565e74",
        "inverse-primary": "#bec6e0",
        "error-container": "#ffdad6",
        "surface-container-lowest": "#ffffff",
        "background": "#f7f9fb",
        "on-surface": "#191c1e",
        "outline": "#76777d",
        "surface-dim": "#d8dadc",
        "primary": "#000000",
        "tertiary-fixed-dim": "#ffb95f",
        "secondary-fixed": "#6ffbbe",
        "error": "#ba1a1a",
        "on-tertiary": "#ffffff",
        "on-tertiary-fixed": "#2a1700",
        "on-error-container": "#93000a",
        "inverse-surface": "#2d3133",
        "secondary-fixed-dim": "#4edea3",
        "on-secondary-fixed-variant": "#005236",
        "on-tertiary-container": "#b87500",
        "surface-bright": "#f7f9fb",
        "primary-fixed": "#dae2fd",
        "inverse-on-surface": "#eff1f3",
        "on-secondary-fixed": "#002113",
        "on-background": "#191c1e",
        "on-primary-container": "#7c839b",
        "surface-variant": "#e0e3e5",
        "secondary-container": "#6cf8bb",
        "on-primary": "#ffffff",
        "surface-container-high": "#e6e8ea",
        "tertiary-fixed": "#ffddb8",
        "surface-container-highest": "#e0e3e5",
        "surface-container": "#eceef0",
        "on-tertiary-fixed-variant": "#653e00",
        "primary-container": "#131b2e",
        "surface-container-low": "#f2f4f6",
        "on-error": "#ffffff",
        "on-primary-fixed-variant": "#3f465c",
        "on-primary-fixed": "#131b2e",
        "secondary": "#006c49",
        "on-secondary-container": "#00714d",
        "on-secondary": "#ffffff",
        "tertiary": "#000000",
        "primary-fixed-dim": "#bec6e0",
        "on-surface-variant": "#45464d",
        "tertiary-container": "#2a1700"
      },
      borderRadius: {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "0.75rem"
      },
      spacing: {
        "base": "4px",
        "xs": "4px",
        "gutter": "20px",
        "md": "16px",
        "sm": "8px",
        "lg": "24px",
        "xl": "32px",
        "margin": "24px"
      },
      fontFamily: {
        "display-lg-mobile": ["Inter"],
        "body-md": ["Inter"],
        "label-caps": ["Inter"],
        "headline-sm": ["Inter"],
        "data-mono": ["Inter"],
        "body-lg": ["Inter"],
        "display-lg": ["Inter"],
        "headline-md": ["Inter"]
      },
      fontSize: {
        "display-lg-mobile": ["28px", { "lineHeight": "36px", "letterSpacing": "-0.02em", "fontWeight": "700" }],
        "body-md": ["14px", { "lineHeight": "20px", "fontWeight": "400" }],
        "label-caps": ["12px", { "lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "600" }],
        "headline-sm": ["20px", { "lineHeight": "28px", "fontWeight": "600" }],
        "data-mono": ["14px", { "lineHeight": "20px", "fontWeight": "500" }],
        "body-lg": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
        "display-lg": ["36px", { "lineHeight": "44px", "letterSpacing": "-0.02em", "fontWeight": "700" }],
        "headline-md": ["24px", { "lineHeight": "32px", "letterSpacing": "-0.01em", "fontWeight": "600" }]
      }
    }
  },
  plugins: []
};
