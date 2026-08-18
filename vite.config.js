import { copyFileSync, existsSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig, loadEnv, searchForWorkspaceRoot } from 'vite'

/**
 * GitHub Pages has no SPA rewrite. Copy index.html → 404.html so deep links
 * (`/changesets/:id`, `/filters`, `/authorized`) still boot the app.
 */
function githubPagesSpaFallback() {
  let outDir = 'dist'
  return {
    name: 'github-pages-spa-fallback',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir
    },
    closeBundle() {
      const index = path.resolve(outDir, 'index.html')
      if (existsSync(index)) copyFileSync(index, path.resolve(outDir, '404.html'))
    },
  }
}

function viteBase() {
  const raw = process.env.VITE_BASE
  if (raw == null || raw === '') return '/'
  return raw.endsWith('/') ? raw : `${raw}/`
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'OSMCHA_')

  const plugins = [
    tanstackRouter({
      target: 'react',
      routesDirectory: './src/routes',
      generatedRouteTree: './src/routeTree.gen.ts',
    }),
    tailwindcss(),
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler', { target: '19' }]],
      },
    }),
    githubPagesSpaFallback(),
  ]
  if (process.env.ANALYZE) {
    plugins.push(visualizer({ open: true }))
  }

  return {
    base: viteBase(),
    envPrefix: ['VITE_', 'OSMCHA_ENABLE_DEBUG_PANELS'],
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
      outDir: 'dist',
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
