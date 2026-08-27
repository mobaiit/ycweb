import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import postsPlugin from './plugins/vite-plugin-posts.js';

// https://vite.dev/config/
export default defineConfig({
  plugins: [postsPlugin(), react()],
});
