import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      injectRegister: "auto",
      registerType: "autoUpdate",
      manifest: {
        name: "CosmicWatch Recorder",
        short_name: "CW Recorder",
        theme_color: "#ffffff",
        icons: [
          // PWAのアイコン設定
        ],
      },
    }),
  ],
  build: {
    target: "esnext",
  },
});
