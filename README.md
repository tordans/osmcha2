# osmcha2

Vite SPA for reviewing OpenStreetMap changesets against the live
[osmcha.org](https://osmcha.org/) API (`https://osmcha.org/api/v1`). It is a
restyle of [`osmcha-frontend`](https://github.com/OSMCha/osmcha-frontend);
it is not the production osmcha.org UI.

Live preview: [tordans.github.io/osmcha2](https://tordans.github.io/osmcha2/).

## Development

1. Install [Bun](https://bun.sh) ≥ 1.3.14 (see [`.tool-versions`](./.tool-versions)).
2. `bun install`
3. `bun run dev` — http://127.0.0.1:3000
4. `bun run check` before a commit; CI runs `bun run check-ci` then `bun run build`. Push runs `bun run check-pre-push` via Husky.

OAuth sign-in works on **localhost / 127.0.0.1** against production Django
(Origin redirect). Other public hosts (including GitHub Pages) use **token
import**: reuse the API token from osmcha.org. The production API requires a
token for list and changeset requests.

### Token import (GitHub Pages and custom hosts)

On the Sign in screen you can:

1. **Bookmarklet.** Drag "Open osmcha2 signed in" (or "Copy auth JSON") onto
   your bookmarks bar. On [osmcha.org](https://osmcha.org) while signed in,
   click the bookmark. The open variant uses `postMessage` from osmcha.org
   only; the token never goes in the URL (avoid `?token=`. It leaks via
   history, Pages logs, and referrers).
2. **Paste.** Account → API key, Chrome Local Storage key `auth`, or a
   Console snippet.

Caveats: Chrome often blocks clicking `javascript:` links on the page.
Drag to the bookmarks bar (or use Copy code). osmcha.org CSP may block some
bookmarklets; then use paste. Only install the bookmarklets from this app's
Sign in screen, and only run them on osmcha.org.

### Preview the GitHub Pages login UI locally

Localhost normally shows OSM Sign in, so you cannot see the token-paste
screen without a flag. In `bun run dev`:

1. Sign out if you are already signed in.
2. Click the pink **token UI** chip next to the breakpoint helper (bottom
   center).
3. The Sign in screen and menu switch to token paste, the same flow as
   [tordans.github.io/osmcha2](https://tordans.github.io/osmcha2/).

The chip is a `sessionStorage` flag (`osmcha-preview-token-import`). It is
only honored in the Vite dev server; production builds ignore it. Click
again to return to OSM OAuth. A bookmarklet built while previewing is baked
to the current origin (`http://127.0.0.1:3000/`); use the Pages deploy’s
Sign in screen for a Pages-targeted bookmarklet.

API hosts, page size, and date defaults live in [`src/config/constants.ts`](./src/config/constants.ts). There is no `.env` file.

How routes and APIs are cached: [`docs/caching.md`](./docs/caching.md).

## GitHub Pages

Static hosting at [tordans.github.io/osmcha2](https://tordans.github.io/osmcha2/).
The Vite `base` comes from `VITE_BASE` (GitHub Actions sets it from
`actions/configure-pages`). Deep links work because the production build
copies `index.html` → `404.html`.

Pages source: **GitHub Actions** via
[Deploy GitHub Pages](.github/workflows/deploy-pages.yml) on push to `main`.
The app talks to `https://osmcha.org/api/v1` (see `src/config/constants.ts`).

Preview a project-pages build locally:

```bash
VITE_BASE=/osmcha2/ bun run build
bun run preview
```

## Related

- [`osmcha-django`](https://github.com/OSMCha/osmcha-django) — production API
- [`maplibre-adiff-viewer`](https://github.com/OSMCha/maplibre-adiff-viewer) — changeset map
- [`osmcha-frontend`](https://github.com/OSMCha/osmcha-frontend) — production frontend this restyles
