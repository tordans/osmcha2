import { QueryClient } from '@tanstack/react-query'
import { cacheFiveMinutes } from './cachePolicy.ts'

// Note: In React 18 development mode, you may see duplicate requests in DevTools.
// This is expected behavior - React intentionally double-mounts components to help
// catch bugs. The second request will show 0B transferred because it's served from
// TanStack Query's cache. This only happens in dev mode, not in production.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: cacheFiveMinutes.staleTime,
      gcTime: cacheFiveMinutes.gcTime,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
})
