import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import hotReloadExtension from 'hot-reload-extension-vite';
import { resolve } from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    hotReloadExtension({
      log: true,
      backgroundPath: 'src/background.ts',
    }),
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        background: resolve(__dirname, 'src/background.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // background service worker 放在根目录
          if (chunkInfo.name === 'background') {
            return 'background.js';
          }
          return 'assets/[name].js';
        },
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
    // 禁用代码分割，让所有代码打包到一个文件
    cssCodeSplit: false,
  },
  // 使用相对路径，适配浏览器插件
  base: './',
});
