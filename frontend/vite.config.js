// frontend/vite.config.js
import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  plugins: [
    basicSsl() // Генерирует самоподписанный SSL сертификат
  ],
  server: {
    port: 5173,
    host: true, // Разрешаем доступ с других устройств
    https: true, // Включаем HTTPS
    strictPort: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false // Отключаем sourcemap для production
  }
});