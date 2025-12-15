import { defineConfig, build } from 'vite';
import react from '@vitejs/plugin-react';
import hotReloadExtension from 'hot-reload-extension-vite';
import { resolve } from 'path';

// 单独构建 background.js 的插件
function buildBackgroundPlugin() {
  return {
    name: 'build-background',
    async closeBundle() {
      // 单独构建 background.ts，确保它是一个独立的单文件
      await build({
        configFile: false,
        build: {
          emptyOutDir: false,
          outDir: 'dist',
          lib: {
            entry: resolve(__dirname, 'src/background.ts'),
            name: 'background',
            formats: ['iife'], // 立即执行函数，无外部依赖
            fileName: () => 'background.js',
          },
          rollupOptions: {
            output: {
              // IIFE 格式确保所有代码内联
              inlineDynamicImports: true,
            },
          },
          minify: true,
        },
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    hotReloadExtension({
      log: true,
      backgroundPath: 'src/background.ts',
    }),
    buildBackgroundPlugin(),
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        entryFileNames: 'assets/[name].js',
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
