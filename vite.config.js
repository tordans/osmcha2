import os from 'node:os'
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig, loadEnv, searchForWorkspaceRoot } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'OSMCHA_')

  const plugins = [tailwindcss(), react()]
  if (process.env.ANALYZE) {
    plugins.push(visualizer({ open: true }))
  }

  return {
    base: process.env.VITE_BASE || '/',
    plugins,

    define: {
      'process.env.NODE_ENV': JSON.stringify(env.NODE_ENV || mode),
    },

    server: {
      port: 3000,
      host: '127.0.0.1',
      open: false,
      // Bun globalStore (bunfig.toml) symlinks realpath outside the project.
      // Extend Vite defaults — do not replace the project/workspace root.
      fs: {
        allow: [
          searchForWorkspaceRoot(process.cwd()),
          path.join(os.homedir(), '.bun/install/cache/links'),
        ],
      },
    },

    build: {
      outDir: 'build',
      sourcemap: true,
    },

    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      env: {
        TZ: 'UTC',
      },
    },
  }
})
