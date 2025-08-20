import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      manifest: {
        "short_name": "Creativity",
        "name": "Creativity Ventures",
        "icons": [
        {
        "src": "icons/icon-192x192.png",
        "sizes": "192x192",
        "type": "image/png"
        },
        {
        "src": "icons/icon-512x512.png",
        "sizes": "512x512",
        "type": "image/png"
        }
        ],
        "start_url": ".",
        "display": "standalone",
        "theme_color": "#000000",
        "background_color": "#ffffff",
        "orientation": "portrait"
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 6000000  // Adjust higher if needed for larger assets
      }
    })
  ],
});
