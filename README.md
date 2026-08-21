# osmcha-frontend-v2

Vite SPA for reviewing OpenStreetMap changesets against the live
[osmcha.org](https://osmcha.org/) API (`https://osmcha.org/api/v1`). This
worktree is a restyle of [`osmcha-frontend`](https://github.com/OSMCha/osmcha-frontend);
it is not the production osmcha.org UI.

## Development

1. Install [Bun](https://bun.sh) ≥ 1.3.14 (see [`.tool-versions`](./.tool-versions)).
2. `bun install`
3. `bun run dev` — http://127.0.0.1:3000
4. `bun run check` before a commit; CI runs `bun run check-ci` then `bun run build`. Push runs `bun run check-pre-push` via Husky.

OAuth sign-in works on **localhost / 127.0.0.1** against production Django
(Origin redirect). Other public hosts (including GitHub Pages) use **token
import**: copy the API token from osmcha.org (Account, or `localStorage` key
`auth`) and paste it here. Guest browsing the list/map needs no token.

API hosts, page size, and date defaults live in [`src/config/constants.ts`](./src/config/constants.ts). There is no `.env` file.

How routes and APIs are cached: [`docs/caching.md`](./docs/caching.md).

## GitHub Pages

Static hosting. The Vite `base` comes from `VITE_BASE` (GitHub Actions sets it
from `actions/configure-pages`). Deep links work because the production build
copies `index.html` → `404.html`.

To publish later (not done from this sandbox):

1. Create a GitHub repo and push branch `v2` or `main`.
2. Settings → Pages → Source: **GitHub Actions**.
3. Push; the [Deploy GitHub Pages](.github/workflows/deploy-pages.yml) workflow
   builds and deploys. The app talks to `https://osmcha.org/api/v1` (see
   `src/config/constants.ts`).

Preview a project-pages build locally:

```bash
VITE_BASE=/osmcha-frontend-v2/ bun run build
bun run preview
```

## Related

- [`osmcha-django`](https://github.com/OSMCha/osmcha-django) — production API
- [`maplibre-adiff-viewer`](https://github.com/OSMCha/maplibre-adiff-viewer) — changeset map
