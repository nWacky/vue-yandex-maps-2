import { resolve } from 'path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import del from 'rollup-plugin-delete';

export default defineConfig({
  optimizeDeps: {
    exclude: ['vue', 'vue-demi'],
  },
  build: {
    minify: false,
    sourcemap: true,
    outDir: 'dist',
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['vue', 'vue-demi', 'path'],
      input: {
        'vue-yandex-maps': resolve(__dirname, 'src/index.ts'),
        nuxt2: resolve(__dirname, 'src/plugins/nuxt2'),
      },
      output: {
        format: 'es',
        esModule: true,
        globals: {
          vue: 'Vue',
          'vue-demi': 'VueDemi',
        },
        entryFileNames: '[name].js',
      },
    },
  },
  plugins: [
    del({ targets: 'dist/*' }),
    vue(),
    dts(),
  ],
});
