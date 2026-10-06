import { fileURLToPath, URL } from 'node:url'
import { existsSync, readFileSync } from 'node:fs'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// Training is the default runtime. Its database isolation is enforced by the backend,
// while the browser and API keep the same ports across restarts.
const apiTarget='http://127.0.0.1:3001'

// Self-signed, LAN-IP-covered cert for testing camera/mic features (getUserMedia requires a
// secure context — plain http:// on a non-localhost origin like 10.1.27.222 is blocked by the
// browser outright). Generated via: openssl req -x509 -newkey rsa:2048 -keyout .cert/dev.key
// -out .cert/dev.crt -days 3650 -nodes -subj "/CN=smartehr-training-lan"
// -addext "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:10.1.27.222". Falls back to plain HTTP
// when the cert isn't present so a fresh checkout still runs without extra setup.
const certPath=fileURLToPath(new URL('./.cert/dev.crt', import.meta.url))
const keyPath=fileURLToPath(new URL('./.cert/dev.key', import.meta.url))
const https=existsSync(certPath)&&existsSync(keyPath)?{cert:readFileSync(certPath),key:readFileSync(keyPath)}:undefined

export default defineConfig({
  server: { port: 5173, strictPort: true, https, proxy: { '/api': { target: apiTarget, changeOrigin: false } } },
  // Keep preview API requests same-origin when testing from other devices.
  preview: { port: 4173, strictPort: true, https, proxy: { '/api': { target: apiTarget, changeOrigin: false } } },
  plugins: [
    vue(),
    tailwindcss(),
  ],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
