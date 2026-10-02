import { defineConfig } from 'vite';
import { contentPlugin } from './tools/vite-plugin-content';

export default defineConfig({
  base: './',
  plugins: [contentPlugin()],
});