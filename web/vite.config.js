import { defineConfig } from "vite";
import solid from "@solidjs/vite-plugin";

// In dev, the Flask API runs separately (see ../README.md).
const api = process.env.API_URL ?? "http://localhost:5000";

export default defineConfig({
  plugins: [solid()],
  server: {
    proxy: {
      "/api": api,
      "/static": api, // the generated map page is served by Flask
    },
  },
  test: {
    // The Solid Vite plugin does not set a test environment.
    environment: "jsdom",
  },
});
