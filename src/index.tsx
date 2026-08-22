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
import { waitForAuthHydration } from './stores/authStore.ts'

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
