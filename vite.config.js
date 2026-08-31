import { copyFileSync, existsSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig, searchForWorkspaceRoot } from 'vite'

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

const emptyNodeStream = path.resolve(process.cwd(), 'src/shims/empty-node-stream.ts')

/**
 * Cursor's embedded browser requests its own Inter / Bricolage fonts from this
 * origin. Vite's SPA fallback would serve index.html as those `.ttf`/`.woff2`
 * files (OTS "invalid sfntVersion"). 404 instead.
 */
function rejectMissingHashedFonts() {
  return {
    name: 'reject-missing-hashed-fonts',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = req.url?.split('?')[0] ?? ''
        if (!/^\/assets\/[^/]+\.(woff2?|ttf|otf|eot)$/i.test(pathname)) {
          next()
          return
        }
        res.statusCode = 404
        res.end()
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const plugins = [
    devtools({
      // Headless UI Listbox/Combobox/Menu often render Fragments; injecting
      // data-tsd-source onto those nodes throws "Passing props on Fragment".
      injectSource: {
        ignore: {
          components: [/^Headless\./],
        },
      },
    }),
    tanstackRouter({
      target: 'react',
      routesDirectory: './src/routes',
      generatedRouteTree: './src/routeTree.gen.ts',
    }),
    tailwindcss(),
    viteReact({ compiler: true }),
    githubPagesSpaFallback(),
    rejectMissingHashedFonts(),
  ]
  if (process.env.ANALYZE) {
    plugins.push(visualizer({ open: true }))
  }

  return {
    base: viteBase(),
    plugins,

    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
    },

    server: {
      port: 3000,
      host: '127.0.0.1',
      open: false,
      // Spyglass nginx CORS allows `localhost`, not `127.0.0.1`. Same-origin tiles in Vite.
      proxy: {
        '/spyglass': {
          target: 'https://spyglass.jochentopf.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/spyglass/, ''),
        },
      },
      // Cursor's embedded browser was serving a stale prebundle (`?v=de1bebf7`)
      // after the stream shim landed; skip caching in dev.
      headers: {
        'Cache-Control': 'no-store',
      },
      // Bun globalStore (bunfig.toml) symlinks realpath outside the project.
      // Extend Vite defaults. Do not replace the project/workspace root.
      fs: {
        allow: [
          searchForWorkspaceRoot(process.cwd()),
          path.join(os.homedir(), '.bun/install/cache/links'),
        ],
      },
    },

    // `sax` (via `@osmcha/osm-adiff-parser`) probes `require('stream').Stream`
    // at load. Vite's browser stub warns on that access; the parser only uses
    // `sax.parser()`, so an empty Stream class is enough.
    resolve: {
      alias: {
        stream: emptyNodeStream,
        'node:stream': emptyNodeStream,
      },
    },
    optimizeDeps: {
      include: ['@osmcha/osm-adiff-parser'],
      rolldownOptions: {
        resolve: {
          alias: {
            stream: emptyNodeStream,
            'node:stream': emptyNodeStream,
          },
        },
      },
    },

    build: {
      outDir: 'dist',
      sourcemap: true,
    },

    test: {
      globals: true,
      environment: 'jsdom',
      env: {
        TZ: 'UTC',
      },
    },
  }
})
