# Upstream sync

OSMCha2 rewrites the OSMCha frontend. This folder logs, per parent project, which upstream commits we have reviewed and what we decided. The workflow is the `upstream-sync` skill; this file is the project context for a run.

## Parents

| Log                    | Repository                                                          | What it is to us                                                                        |
| ---------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `osmcha-frontend.json` | [OSMCha/osmcha-frontend](https://github.com/OSMCha/osmcha-frontend) | The app we rewrite. Our git history contains theirs up to `c20d672` (v1.4.0), the base. |
| `osmcha-django.json`   | [OSMCha/osmcha-django](https://github.com/OSMCha/osmcha-django)     | The API we call (osmcha.org). Only changes to endpoints, payloads or auth matter.       |
| `changeset-map.json`   | [osmlab/changeset-map](https://github.com/osmlab/changeset-map)     | The old diff map; our map in `src/views/` replaces it.                                  |

Local reference checkouts sit next to this repo (`../osmcha-frontend`, `../osmcha-django`, `../osmcha--changeset-map`, forks under `tordans/`). Do not fetch into them; the sync script keeps its own mirrors.

## Folder map (theirs → ours)

| Upstream                                            | OSMCha2                                                              |
| --------------------------------------------------- | -------------------------------------------------------------------- |
| `src/views/changeset*`, `src/components/changeset/` | `src/components/changeset/`, `src/views/` (map, camera, layers)      |
| `src/components/list/`, `src/views/changesets_list` | `src/components/list/`                                               |
| `src/components/filters/`, `src/views/filters`      | `src/components/filters/`, `src/views/filters.tsx`                   |
| `src/views/` (watchlist, user, teams, about)        | `src/views/`, `src/components/user/`, `src/components/teams/`        |
| `src/network/`, `src/query/`                        | `src/network/`, `src/query/`                                         |
| `src/stores/` (Zustand)                             | `src/stores/`                                                        |
| `src/config/`                                       | `src/config/`                                                        |
| `src/app.tsx` routes                                | `src/routes/` (TanStack Router file routes), `src/router.tsx`        |
| build: `vite.config`, `tsconfig`, CI                | ours are separate (`vite.config.js`, `tsconfig*.json`, `.github/`)   |
| osmcha-django API (`osmchadjango/`)                 | callers in `src/network/`, `src/query/`; auth in `src/utils/auth.ts` |

## Where we differ on purpose

- Stack: TanStack Router and Query, Zustand, Tailwind with Catalyst/Headless UI, React Compiler, Bun. UI-structure and styling commits upstream rarely transfer as code; judge the intent (the UX problem they fixed) instead.
- Layout: our review screen is a map with a resizable review column on desktop and a list/map sheet on phones; work areas group spread-out changesets.
- Hosting on GitHub Pages: sign-in is by pasting the osmcha.org API token (see OSMCha/osmcha-frontend#931).
- Spyglass overlay is off on GitHub Pages (needs allow-listing).
- Our own dependency updates come through Dependabot; upstream dependency bumps are noise.

## A run in this project

- Checks: `bun run check-ci` and `bun run build`; format with `bun run format`.
- Commits follow the `finish-work` format, with `Ping <upstream commit or PR URL>` for adopted intents.
- `later` work goes to GitHub issues on `tordans/osmcha2`; put the issue URL in the intent's reason.
- Do not push unless asked.
