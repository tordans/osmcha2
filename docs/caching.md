# Caching

How OSMCha v2 loads data, how long it keeps it, and when it asks the network again.

Numbers and policy names live in [`src/query/cachePolicy.ts`](../src/query/cachePolicy.ts). **Update this page when that file or a query key / invalidation changes.**

---

## Glossary

| Term | Meaning here |
| --- | --- |
| **Query** | One cached request, identified by a `queryKey` (e.g. `['changeset', 123]`). |
| **staleTime** | How long cached data is treated as fresh. Fresh data is **not** refetched automatically. `Infinity` means never, unless we invalidate. |
| **gcTime** | How long unused data stays in memory after nothing is looking at it. After this, it is dropped and the next visit fetches again. |
| **invalidate** | Mark a query stale and refetch it if something on screen is using it. This is how mutations (mark good/bad, save a filter) update the UI. |
| **refetch** | Hit the network again. The old value stays on screen until the new one arrives. |
| **persist** | Write the Query cache to IndexedDB so a reload can show last session’s data before any request. Lasts **7 days**. Map adiffs are not persisted (too large). |
| **loader** | A route function that runs on navigation (and on link hover). It calls `ensureQueryData`, which uses the Query cache — it does not fetch if the data is still fresh. |
| **refetchOnWindowFocus** | If true, coming back to the browser tab refetches stale queries. Default here is **off**. Saved filters are the exception. |

Defaults for any query that does not set its own policy: **5 minutes** stale, **7 days** gc, no refetch on tab focus. See [`src/query/client.ts`](../src/query/client.ts).

---

## The idea

Cache hard. Prefer showing what we already have. Only go to the network when:

1. we never had the data,
2. a mutation changed it,
3. the user asked (list refresh button / `R`),
4. or the data is cheap and likely to have changed in another tab (saved filters).

The router always *runs* loaders (`defaultPreloadStaleTime: 0`). Query decides whether that actually hits the network.

---

## Routes that prefetch

Hovering a link (`defaultPreload: 'intent'`) can run these loaders early.

| Route | Prefetches |
| --- | --- |
| `/` (root, when the list pane is open and you are signed in) | Changeset list page; the active saved filter if `?aoi=` is set. Not awaited, so the filter menu can update before the list returns. |
| `/changesets/$id` | OSMCha changeset JSON, then map adiff + OSM discussion in parallel. A missing adiff does not block the review pane. |
| `/user`, `/trusted-users` | Signed-in user details (trusted list is a field on that payload). |
| `/watchlist` | Watchlist. |
| `/saved-filters` | All saved filters (AOIs). |
| `/teams` | User details, then that user’s mapping teams. |
| `/teams/$id` | One mapping team. |

Hooks on the page still subscribe with `useQuery` / `useSuspenseQuery` so invalidation and persist keep working. Do not read Query-backed data only from `useLoaderData`.

---

## What each request does

Policies are the named objects in `cachePolicy.ts`.

### Reviewing a changeset

| What | Key | Source | Cache | When it refreshes |
| --- | --- | --- | --- | --- |
| OSMCha changeset | `['changeset', id]` | `GET /api/v1/changesets/{id}/` | Forever (7 day persist) | After mark good/bad, tags, or flag a feature |
| Map adiff | `['changesetMap', id]` | Static file `adiffs.osmcha.org/changesets/{id}.adiff` (Overpass only if that 404s) | Forever **this tab**; not persisted | Never automatically — the file does not change once built |
| Discussion / “Open” pill | `['changesetDiscussion', id]` | OSM `GET /api/0.6/changeset/{id}.json?include_discussion=true` | Stale after **5 min** | Every 5 min while that review pane is open; again when you open the Discussion tab; after you post a comment |

### The list

| What | Key | Source | Cache | When it refreshes |
| --- | --- | --- | --- | --- |
| Changeset list page | `['changesets', 'page', …]` | `GET /api/v1/changesets/` (or `/aoi/{id}/changesets/`) | Forever until you refresh | Refresh button or `R`. After **5 min** the button turns orange. Mark good/bad and tags also invalidate the list. |

### Account and lists you edit

| What | Key | Source | Cache | When it refreshes |
| --- | --- | --- | --- | --- |
| You (OSMCha profile, trusted users) | `['user', 'details']` | `GET /api/v1/users/` (auth) | Forever | After saving comment templates or editing the trusted list |
| Watchlist | `['watchlist']` | OSMCha watchlist API | Forever | After add/remove |
| Mapping teams | `['mappingTeams', username]`, `['mappingTeam', id]` | OSMCha mapping-team API | Forever | After create/update/delete |
| Saved filters (AOIs) | `['aois']`, `['aoi', id]` | OSMCha AOI API | Show cache, then refetch (`staleTime: 0`) | On mount and **when you focus the tab** (so another tab’s edits show up). Also after create/update/delete. |

Trusted users are not a separate request — they live on `['user', 'details']`.

### Mapper on the review pane

| What | Key | Source | Cache |
| --- | --- | --- | --- |
| OSM + OSMCha mapper stats | `['osm-user', uid]` | OSM user JSON + `GET /api/v1/user-stats/{uid}/` | Forever |
| Past usernames | `['whosthat', uid]` | whosthat.osmz.ru | Forever |

### Filters form and other small GETs

| What | Key | Source | Cache |
| --- | --- | --- | --- |
| Reasons for Flagging | `['filter-options', 'suspicion-reasons', …]` | `GET /api/v1/suspicion-reasons/` | 1 hour |
| Reviewer tags (filter picker) | `['filter-options', 'tags', …]` | `GET /api/v1/tags/` | 1 hour |
| Tags on the review form | `['tags', 'changeset-visible']` | `GET /api/v1/tags/` | Forever |
| Place search | `['nominatim', type, query]` | Nominatim | Forever |
| OSMCha status banner | `['status']` | GitHub raw `status.json` | 5 minutes |

---

## Invalidation (who kicks whom)

Optimistic updates patch the changeset and the current list, then invalidate so the server can confirm.

| User action | Updates |
| --- | --- |
| Mark good / bad / unreview | That changeset + all list pages |
| Add / remove a review tag | That changeset + all list pages |
| Flag / unflag a feature | That changeset |
| Post a discussion comment | That changeset’s discussion |
| Save account comment templates | `['user', 'details']` |
| Trusted list add/remove | `['user', 'details']` (optimistic, then invalidate) |
| Watchlist add/remove | `['watchlist']` (optimistic, then invalidate) |
| Create / edit / delete a mapping team | Team list + that team |
| Create / edit / delete a saved filter | `['aois']` and that `['aoi', id]` |
| Log out | `queryClient.clear()` — memory and the next persist write |

---

## Disk cache

On boot we restore IndexedDB (`osmcha-query-cache`) **before** the router starts, then subscribe so later fetches are saved. See [`src/index.tsx`](../src/index.tsx) and [`src/query/persist.ts`](../src/query/persist.ts).

- Kept up to **7 days** (`PERSIST_MAX_AGE_MS`).
- **Not** stored: `changesetMap` (parsed adiffs).
- Reloading the tab: immutable queries (`staleTime: Infinity`) appear instantly and stay. Saved filters appear instantly, then refetch. Discussion refetches if it is older than 5 minutes.

---

## Changing this

1. Edit the named policy in `cachePolicy.ts`, or add one.
2. Spread it into the `queryOptions` / `useQuery` for that key.
3. If a mutation should refresh the UI, `invalidateQueries` that key (do not rely on staleTime).
4. Update the tables on this page.
