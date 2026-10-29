# Mobile performance audit, October 2026

Where the changeset review screen was slow on phones, what was fixed, and what is left. Measured on 2026-10-29 against `f534d87` (before) and `f3f8e60` (after the six fixes below).

---

## How it was measured

**Test data.** Changeset 190904081 (about 210 elements, 104 list rows, 16 way splits, proximity groups, minor moves, traffic signs). The osmcha.org API was stubbed (Playwright route in Chrome, a temporary service worker in Safari); the adiff came from the saved fixture, OSM API calls went to the real service. No real token was used.

**Builds.** Always production builds (`vite build`), served by a small static server with gzip (as GitHub Pages does). Before/after pairs were built side by side and run **interleaved** (A, B, A, B, …), because other agents were loading the machine at times (load average up to 34); medians are reported.

**Chrome, phone profile** (Playwright 1.64.1, full Chromium headless on the Mac GPU via ANGLE/Metal):

- 390×844 viewport, touch, DPR 2, **4× CPU throttling** to approximate a mid-range phone.
- Optional slow 4G: 1.6 Mbit/s down, 150 ms latency.
- Load: first contentful paint, first list row in the DOM, long tasks (`longtask` observer, TBT = sum of time over 50 ms), CDP `Performance.getMetrics` (script, style recalc, layout, heap).
- Interactions: Event Timing `duration` (input to next paint) for selecting a row, marking a row seen and each keystroke in a note.
- Re-render counts: a minimal `__REACT_DEVTOOLS_GLOBAL_HOOK__` that walks each commit the way React DevTools does (`PerformedWork` flag, bailed-out subtrees skipped).
- CPU profiles (CDP Profiler) on an unminified build for attribution.

**Safari on the iOS Simulator** (iPhone 17e, iOS 26.5 runtime, Mobile Safari 18.7):

- A temporary probe script (scratch builds only) logged to the local server: first contentful paint, first row in the DOM, the frame after it, rAF gaps over 50 ms as a stand-in for long tasks (Safari has no `longtask`), and synthetic `click()` timings to the second frame after the click.
- Each run cleared the persisted query cache (IndexedDB `keyval-store`); assets came from the HTTP cache. The two builds ran alternately in one tab, 6 loads each.

**What I could not measure**

- **No real phone.** The simulator runs on the Mac's CPU and GPU, so its absolute numbers are optimistic; only the before/after ratio is meaningful.
- **No real touch input in Safari.** The Claude iOS Simulator tool refused to run because `xcode-select` points at the Command Line Tools, not Xcode (fix: `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`). I drove Safari with `xcrun simctl openurl` only, so Safari interaction numbers are synthetic clicks, not taps, and the sheet drag was only measured in Chrome.
- **No Safari Web Inspector profile**, so the remaining Safari selection cost (see open items) is not attributed.
- **GPU work** (WebGL context creation, shader compiles) runs on the Mac GPU in every setup and says nothing about a phone GPU.

---

## Results, before vs after (all six fixes)

### Chrome, 4× CPU, phone viewport (A/B interleaved, median of 4 cold loads)

| Metric                        |  Before |  After | Change |
| ----------------------------- | ------: | -----: | -----: |
| First contentful paint        | 1428 ms | 766 ms |   −46% |
| First list row                | 1200 ms | 660 ms |   −45% |
| Longest task                  | 1019 ms | 348 ms |   −66% |
| Total blocking time           | 1122 ms | 381 ms |   −66% |
| Style recalc                  |  417 ms |  51 ms |   −88% |
| Layout                        |  175 ms |  61 ms |   −65% |
| JS heap after load            |   59 MB |  43 MB |   −27% |
| Select a row (event duration) |  112 ms |  52 ms |   −54% |
| Mark a row seen               |  104 ms |  40 ms |   −62% |
| Keystroke in a note (median)  |   64 ms |  16 ms |   −75% |

### Chrome, 4× CPU and slow 4G (median of 2)

| Metric              |  Before |   After |
| ------------------- | ------: | ------: |
| JS transferred      | 1262 KB | 1143 KB |
| List visible        | 6179 ms | 5119 ms |
| Total blocking time |  825 ms |  367 ms |

### Safari, iOS Simulator (median of 6 alternating loads)

| Metric                           |       Before |        After |
| -------------------------------- | -----------: | -----------: |
| First contentful paint           |      1120 ms |       514 ms |
| List painted                     |      1273 ms |       555 ms |
| Longest frame gap during load    |       820 ms |       209 ms |
| Sum of frame gaps over 50 ms     |       883 ms |       307 ms |
| Synthetic select (1st / 2nd row) | 128 / 147 ms | 114 / 144 ms |
| Synthetic mark seen              |        93 ms |        78 ms |

---

## Findings

| #   | Finding                                                                                                                                                                                                                                                                  | Measured impact (before)                                        | Status                   |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- | ------------------------ |
| 1   | The Changes list rendered every row up front: 104 rows were 11,600 DOM elements (13,700 px of scroll in a 700 px sheet). Style and layout ran for all of them; motion's drag measured the whole sheet in a forced layout on mount.                                       | Style 438 ms + layout 184 ms of a 1075 ms task (4× CPU)         | Fixed (526fea0, 7bde783) |
| 2   | React rendered and committed the whole list in one task before the first paint.                                                                                                                                                                                          | Longest task 585 ms after fix 1                                 | Fixed (7bde783)          |
| 3   | `DetailsChanges` rebuilt the whole diff model (`buildElementChanges`, notes location) on every render; the React Compiler did not memoize it there. New change objects re-rendered all rows on every selection. `ReviewColumn`, `Changeset` and the map also rebuilt it. | 4522 components per selection                                   | Fixed (f3f8e60)          |
| 4   | Every row subscribed to the whole notes draft and seen map, and read the user through a query observer. Each keystroke in a note re-rendered all rows.                                                                                                                   | 64 ms per keystroke                                             | Fixed (aa7f832)          |
| 5   | The Editor Layer Index (imagery list, 80 KB gzip) was in the changeset route chunk, only needed for `imagery_used` matching and the backgrounds panel.                                                                                                                   | +434 ms to list on slow 4G                                      | Fixed (ec4f7a4)          |
| 6   | The Markdown stack (react-markdown, micromark, unified; 46 KB gzip) was in the route chunk for the profile text in the user menu.                                                                                                                                        | +292 ms to list on slow 4G                                      | Fixed (b38243e)          |
| 7   | The traffic-sign converter chunk is 261 KB gzip (2 MB raw; `opening_hours` is about 1.1 MB of source) and loads on every changeset with a `traffic_sign` tag, at the same time as the MapLibre worker. Its parse did not show as a long task in Chrome.                  | 3.5 s of transfer on slow 4G, delays the map worker             | Open                     |
| 8   | The MapLibre worker chunk (143 KB gzip) is requested only after the main MapLibre chunk has run, so map data waits for a second round of downloads.                                                                                                                      | Worker arrives at about 9 s on slow 4G                          | Open                     |
| 9   | motion is fully bundled in the entry chunk (`motion` component with layout, drag and gestures).                                                                                                                                                                          | 49 KB gzip; `m` + LazyMotion core is 28 KB                      | Open                     |
| 10  | 955 tooltip popovers (2,247 elements, 19% of the list DOM) are always in the DOM.                                                                                                                                                                                        | Part of the 11,600 elements                                     | Open                     |
| 11  | Selection is still 114–144 ms in simulator Safari, against 52 ms in Chrome at 4×. Not attributed (no Web Inspector).                                                                                                                                                     | See Safari table                                                | Open                     |
| 12  | The parsed adiff stays in memory for the tab session (`cacheChangesetMap.gcTime: Infinity`).                                                                                                                                                                             | About 0.4 MB heap per large changeset (43.5 → 53.4 MB after 10) | Open, low                |
| 13  | About 30 map `Layer` components re-render on each selection and mark-seen (new layer prop objects; react-map-gl diffs them).                                                                                                                                             | Small                                                           | Open, low                |

Checked and fine:

- **Diff model cost.** `buildElementChanges` for 210 elements is about 26 ms at 4× CPU; way splits, clustering and minor moves are a small part. It now runs once per adiff.
- **Persisted query cache.** 15 KB in IndexedDB after ten changesets (adiffs are not persisted).
- **Map.** 10 WebGL programs; hover and selection update feature state by diff (`changesetFeatureState.ts`), seen state skips unchanged features (`syncSeenFeatureState`). No GeoJSON re-uploads on selection.
- **Sheet drag.** Frame gaps p95 16 ms at 4× CPU in Chrome during drag and snap.
- **Fonts and CSS.** Main CSS 182 KB raw / 27 KB gzip; six Open Sans weights are declared, only the used ones download.

---

## What was fixed

| Commit  | Change                                                                                                                                                                                               | Before → after                                                                                                             |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 526fea0 | Rows off screen skip style, layout and paint (`content-visibility: auto`, height estimate from tag rows, `offscreenRows.ts`); the selected row always renders.                                       | FCP 1572 → 1140 ms, longest task 1075 → 638 ms, style 438 → 66 ms, layout 184 → 77 ms; select 136 → 88 ms, seen 96 → 64 ms |
| aa7f832 | Rows read only their own seen state and drafts (`useObjectSeenAt`, `useIsUnseenOverride`, `useObjectDrafts`, `useDraftsForObjects`); selection as a yes/no prop; `memo` on rows; user key read once. | Keystroke 64 → 16 ms; seen 64 → 48 ms                                                                                      |
| b38243e | Profile Markdown loads with the user menu (`ProfileMarkdown.tsx`).                                                                                                                                   | Route chunk 258 → 212 KB gzip; list on slow 4G 6172 → 5880 ms                                                              |
| ec4f7a4 | Editor Layer Index loads on its own (`eliModule.ts`), only for `imagery_used` or the backgrounds panel.                                                                                              | Route chunk 212 → 135 KB gzip; list on slow 4G 5799 → 5365 ms                                                              |
| 7bde783 | The first render draws the top 20 list items and the selected one; the rest follows via `useDeferredValue`.                                                                                          | FCP 1022 → 790 ms, longest task 585 → 372 ms, TBT 679 → 428 ms                                                             |
| f3f8e60 | `buildElementChanges` caches per adiff; the list memoizes flagged features and located notes.                                                                                                        | Components per selection 4522 → 324 (rows 105 → 2); select 88 → 56 ms                                                      |

Each commit body has the exact setup and numbers. Each step was A/B-measured against the commit before it.

---

## What is left, by priority

| Priority | Item                                                                                                                                                                                                                                                                                                                                                                                                                                   | Effort                       | Expected gain                                                                              |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------ |
| 1        | **Traffic-sign converter weight** (finding 7). Upstream in `@osm-traffic-signs/converter`: load `opening_hours` lazily (only conditional restrictions need it) and split the sign data by country. In the app until then: start the converter load when a sign row first scrolls into view instead of on render.                                                                                                                       | M upstream, S in the app     | Up to 260 KB gzip less on changesets with signs; the map worker no longer competes with it |
| 2        | **Start the MapLibre worker download earlier** (finding 8). Tried: a `fetch(workerUrl)` when the map module loads. Chrome downloaded the worker twice (the worker request did not reuse the in-flight fetch), so it was reverted. Next try: mount the map (and with it the worker) before the list's deferred rows, or let MapLibre create its worker pool from the route chunk. Measure on slow 4G that the list does not get slower. | S–M                          | Map data about 1 s earlier on slow networks                                                |
| 3        | **Find the Safari selection cost** (finding 11) with Web Inspector on a real iPhone: likely candidates are style invalidation from row class changes, motion's projection snapshot when `ReviewSheet` re-renders, and the camera start.                                                                                                                                                                                                | S to measure, unknown to fix | Selection 114–144 ms in simulator Safari toward Chrome's 52 ms                             |
| 4        | **Tooltips render their popover on first interest** instead of always (finding 10). Keep `aria-describedby` working: screen readers need the description element, and Chromium's `interestfor` needs its target to exist. The hidden popovers are `display: none`, so they cost render and commit, not layout.                                                                                                                         | S–M                          | About 19% fewer list elements; faster commit of the deferred rows                          |
| 5        | **LazyMotion** (finding 9): `m.*` components with `LazyMotion features={() => import(...domMax)}` at the root. Drag (`ReviewSheet`) and `layoutId` (navbar, sidebar) need `domMax`. Check that closed disclosure panels do not flash open before the features load.                                                                                                                                                                    | M                            | About 21 KB gzip off the entry chunk for every route                                       |
| 6        | **Virtualize very large lists** with `@tanstack/react-virtual` (already a dependency, used by filters) if changesets with 1,000+ elements matter: today every row still mounts, only later. Needs care for scroll-to-selected, deep links, sticky work-area headings and the phone sheet.                                                                                                                                              | L                            | Bounded DOM for any size; today about 110 elements per row                                 |
| 7        | **Bound the adiff cache** (finding 12): `gcTime` of about 30 minutes instead of `Infinity` in `cacheChangesetMap`. Update `docs/caching.md`.                                                                                                                                                                                                                                                                                           | S                            | Caps memory in long review sessions on phones                                              |
| 8        | **Stable map layer props** (finding 13): build layer specs once per style/epoch.                                                                                                                                                                                                                                                                                                                                                       | S                            | Small; fewer react-map-gl diffs per selection                                              |

**Dependencies.** No upgrade or swap was needed for these fixes, and none is proposed as a quick win. The two that would pay off are upstream changes to packages of this project's author: the converter split above, and in `@osm-editor-kit/maplibre-editor-layer-index` a separate entry point for the sync locator list, so apps can lazy-load it without a wrapper like `eliModule.ts`.

**How to re-run.** The scripts were kept out of the repo. The method: build two variants into separate folders, serve both with gzip on two ports, and alternate Playwright runs (4× CPU, 390×844, touch) collecting the metrics above; for Safari, add a probe script to a scratch copy of `index.html` that logs to the local server.
