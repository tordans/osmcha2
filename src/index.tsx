import { QueryClientProvider } from '@tanstack/react-query'
import {
  persistQueryClientRestore,
  persistQueryClientSubscribe,
} from '@tanstack/react-query-persist-client'
import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppToaster } from './components/shared/toast/AppToaster.tsx'
import '@fontsource/open-sans/latin.css'
import './assets/index.css'

import { queryClient } from './query/client.ts'
import { persistQueryOptions } from './query/persist.ts'
import { router } from './router.tsx'
import { waitForAuthHydration } from './stores/auth-store.ts'

const CHUNK_RELOAD_KEY = 'osmcha-chunk-reload-at'
const CHUNK_RELOAD_WINDOW_MS = 10_000

// A tab opened before a new GitHub Pages deploy still requests the chunk files
// the deploy removed. One reload loads the new index.html; the timestamp keeps
// a persistent failure from reloading in a loop. Without storage, do not reload.
window.addEventListener('vite:preloadError', (event) => {
  try {
    const lastReload = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY)) || 0
    if (Date.now() - lastReload < CHUNK_RELOAD_WINDOW_MS) return
    sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()))
  } catch {
    return
  }
  event.preventDefault()
  window.location.reload()
})

const container = document.getElementById('root')
if (!container) throw new Error('Root element not found')

const root = createRoot(container)

async function bootstrap() {
  await Promise.all([
    persistQueryClientRestore({
      queryClient,
      persister: persistQueryOptions.persister,
      maxAge: persistQueryOptions.maxAge,
    }).catch((error) => {
      console.warn('Could not restore query cache', error)
    }),
    waitForAuthHydration(),
  ])

  persistQueryClientSubscribe({
    queryClient,
    persister: persistQueryOptions.persister,
    dehydrateOptions: persistQueryOptions.dehydrateOptions,
  })

  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <AppToaster />
      </QueryClientProvider>
    </StrictMode>,
  )
}

void bootstrap()
