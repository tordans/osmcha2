import { TanStackDevtools } from '@tanstack/react-devtools'
import { formDevtoolsPlugin } from '@tanstack/react-form-devtools'
import { hotkeysDevtoolsPlugin } from '@tanstack/react-hotkeys-devtools'
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'
import { ClientOnly } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'

/**
 * TanStack devtools panel (Query, Router).
 *
 * - `@tanstack/devtools-vite` strips `<TanStackDevtools>` and its panel imports from
 *   production builds, leaving an empty `<ClientOnly>` — so no devtools ship to prod.
 * - `<ClientOnly>` mounts the panel after hydration.
 * - The floating trigger is visually hidden; DebugOverlay's "TanStack" segment opens it.
 *
 * Panels must be referenced inline in `plugins` (not via local wrapper components)
 * so the strip plugin can detect and remove their imports.
 */
export function TanStackAppDevtools() {
  return (
    <ClientOnly fallback={null}>
      {/* Hide TanStack's own floating trigger; the admin bar proxies the click. */}
      <style>{`
        button[aria-label="Open TanStack Devtools"] {
          position: fixed !important;
          width: 1px !important;
          height: 1px !important;
          padding: 0 !important;
          margin: 0 !important;
          overflow: hidden !important;
          clip: rect(0, 0, 0, 0) !important;
          border: 0 !important;
          opacity: 0 !important;
          pointer-events: none !important;
          bottom: 0 !important;
          left: 0 !important;
        }
      `}</style>
      <TanStackDevtools
        config={{
          hideUntilHover: false,
          position: 'bottom-left',
          panelLocation: 'bottom',
          customTrigger: <span aria-hidden="true" />,
        }}
        eventBusConfig={{
          connectToServerBus: false,
        }}
        plugins={[
          {
            name: 'TanStack Query',
            render: <ReactQueryDevtoolsPanel />,
          },
          {
            name: 'TanStack Router',
            render: <TanStackRouterDevtoolsPanel />,
          },
          hotkeysDevtoolsPlugin(),
          formDevtoolsPlugin(),
        ]}
      />
    </ClientOnly>
  )
}
