import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import * as path from 'node:path'
import tailwindcss from '@tailwindcss/vite'

declare let process: {
  env: {
    VITE_BASE_PATH?: string
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      plugins: [
        [
          '@swc-contrib/plugin-graphql-codegen-client-preset',
          {
            artifactDirectory: path
              .resolve(__dirname, './src/graphql/generated')
              .replaceAll('\\', '/'),
            gqlTagName: 'graphql',
          },
        ],
      ],
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  base: process.env.VITE_BASE_PATH ?? '/',
  server: {
    proxy: {
      '/spectre-api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  css: {
    devSourcemap: true,
  },
})
