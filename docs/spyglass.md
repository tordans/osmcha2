# Spyglass

How OSMCha v2 shows live tagged OSM objects on the changeset map: an opt-in overlay of Jochen Topf's Spyglass tiles. Hover-inspect only.

Canonical code: [`src/views/spyglassOverlay.ts`](../src/views/spyglassOverlay.ts), [`src/views/SpyglassOverlay.tsx`](../src/views/SpyglassOverlay.tsx), [`src/views/map.tsx`](../src/views/map.tsx), [`src/stores/spyglass-store.ts`](../src/stores/spyglass-store.ts), [`src/components/changeset/map_options.tsx`](../src/components/changeset/map_options.tsx). **Update this page when overlay toggle, zoom floor, hover flyout, tile source, or noop hover changes.**

---

## Glossary

| Term                  | Meaning here                                                                           |
| --------------------- | -------------------------------------------------------------------------------------- |
| **Spyglass**          | Jochen Topf's live OSM object tiles. Formerly OSM X-RAY.                               |
| **Spyglass overlay**  | OSMCha's opt-in MapLibre overlay of those tiles. Hover-inspect only.                   |
| **Off**               | Toggle is off. Source and Layer are unmounted.                                         |
| **Armed**             | Toggle is on, zoom &lt; 15. Tiles are not mounted.                                     |
| **Active**            | Toggle is on and zoom ≥ 15. Source and Layer are mounted.                              |
| **Unchanged element** | Adiff `noop`: an object in the changeset payload that was not edited (purple context). |
| **Unchanged tags**    | Tags that did not change on an edited object. Distinct from an unchanged element.      |

---

## What it is

[Spyglass](https://spyglass.jochentopf.com/) is Jochen Topf's viewer of live tagged OSM objects. It was formerly OSM X-RAY. Source is [GPL-3 on Codeberg](https://codeberg.org/jot/osm-spyglass). See also the [info page](https://spyglass.jochentopf.com/info/index.html), [February 2026](https://blog.jochentopf.com/2026-02-19-osm-spyglass.html), and [June 2026](https://blog.jochentopf.com/2026-06-03-spyglass-improvements.html).

Stack: Postgres / PostGIS / osm2pgsql plus a Go tile server. About 1.2 TB disk and 128 GB RAM. Updates are minutely; z11+ is 3–5 minutes behind. Vector tiles at high zoom; raster at low and medium zoom. All objects are interactive from z15.

It is hosted at spyglass.jochentopf.com until OSMF takes it ([operations#1313](https://github.com/openstreetmap/operations/issues/1313)).

README: the Go server sets CORS `*`. Live nginx on spyglass.jochentopf.com restricts tile CORS to localhost (see Tile probe). osmcha2 is ISC: consume HTTP tiles; do not copy the GPL UI.

---

## How osm.org discusses it

These four issues are the load-bearing ones:

| Issue                                                                                                                                                                             | What it says                                                                                |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| [operations#1313](https://github.com/openstreetmap/operations/issues/1313) Host OpenStreetMap Spyglass                                                                            | Host Spyglass on the `/map` data-layer path. Jochen: own site first; not yet a general API. |
| [openstreetmap-website#6234](https://github.com/openstreetmap/openstreetmap-website/issues/6234) Migrate new vector layers from maplibre-gl-leaflet to “unwrapped” maplibre-gl-js | After MapLibre, the query tool and data layer should use Spyglass GeoJSON.                  |
| [openstreetmap-website#6757](https://github.com/openstreetmap/openstreetmap-website/issues/6757) Use npm for leaflet-osm                                                          | leaflet-osm `DataLayer` is a stopgap until Spyglass.                                        |
| [openstreetmap-website#6678](https://github.com/openstreetmap/openstreetmap-website/issues/6678) API: `/api/0.6/map` that returns intersecting ways                               | Spatial queries belong on a derivative like Spyglass, not the main OSM API.                 |

Spyglass also comes up in passing on [#6641](https://github.com/openstreetmap/openstreetmap-website/issues/6641) (search prefixes), [#6512](https://github.com/openstreetmap/openstreetmap-website/issues/6512) (edit-restricted regions), [#6849](https://github.com/openstreetmap/openstreetmap-website/issues/6849) (heatmap rename), and [#3243](https://github.com/openstreetmap/openstreetmap-website/issues/3243) (Map Data overlay performance).

---

## Use / Do not

### Use

- Opt-in overlay on the changeset map, current viewport only.
- Hover flyout (`flyoutSurfaceClassName`). Same hover for adiff `noop` (dedicated unchanged layers and halo layers with `action=noop`), and only while the overlay is on.
- Cursor `help` on spyglass and noop. `pointer` wins if a clickable changeset feature is under the cursor.
- Clicks never select spyglass or noop, including when the overlay is off. An inspect-only click does not clear the selected changeset `ref`.

### Do not

- Iframe Spyglass.
- Copy the GPL UI (osmcha2 is ISC).
- Host a planet / run our own Spyglass.
- Replace adiff or Overpass.
- Default the overlay on.
- Dump GeoJSON.
- Consume raster tiles.
- Filter by tag.
- Globe view.
- Admin overlays.
- Click-to-lock.
- Click-to-select a spyglass object.
- Public comments from the overlay.

---

## Overlay

Three states. Source and Layer stay unmounted unless the toggle is on **and** zoom ≥ 15.

| State      | Toggle | Zoom    | What you see                                                                             |
| ---------- | ------ | ------- | ---------------------------------------------------------------------------------------- |
| **Off**    | off    | any     | No Spyglass source or layers. Noop keeps its usual changeset styling; no spyglass hover. |
| **Armed**  | on     | &lt; 15 | No tiles. Pill: “Zoom in to see OSM data”. Clicking it `easeTo(15)`.                     |
| **Active** | on     | ≥ 15    | Source and layers mounted. Hover flyout. Noop uses the same hover.                       |

v1 draws ways and nodes only. Relations are out.

Paint: thin solid black lines (0.5–1px), small black nodes. Stack above the changeset dim (`changeset-overlay-bg`), below changeset features. No dashed lines, no teal / yellow / red / purple, no 8px halo.

Hover is inspect only. The flyout uses `flyoutSurfaceClassName`. While the overlay is on, adiff noop geometry gets that same hover — not a second flyout. Halo layers such as `changeset-way-bg` include noop via `ACTION_TYPE_FILTER`; treat a hit as noop when the layer is a dedicated unchanged layer **or** `properties.action === 'noop'` on a `changeset-*` layer. Do not treat a Spyglass OSM tag `action=*` as changeset noop.

Clicks never select a spyglass or noop object as the changeset `ref`, overlay on or off. Clicking inspect-only geometry must not clear the current selection. If a clickable changeset feature (create / modify / delete) is under the cursor, the cursor is `pointer` and that feature wins.

The zoom gate prefers the live map zoom. Until `onLoad`, fall back to the URL `map` camera so a changeset already at z15+ is **active**, not **armed**.

---

## Tile probe

Live probe 2026-08-30 against spyglass.jochentopf.com.

Dataset is `osm`. `/vector/(nodes|ways|relations)/…` returns 404 `invalid dataset`.

Template: `https://spyglass.jochentopf.com/vector/osm/{z}/{x}/{y}.mvt`

MapLibre: one source. Native vector tiles exist z2–18 (`invalid tile` at z0, z1, z19). OSMCha v1 mounts at zoom ≥ 15.

```tsx
<Source
  type="vector"
  tiles={['https://spyglass.jochentopf.com/vector/osm/{z}/{x}/{y}.mvt']}
  minzoom={15}
  maxzoom={18}
/>
```

Berlin check: `15/17603/10749` → 200.

source-layer: `nodes`, `ways`, `relations` in the same tileset. OSMCha v1 mounts `ways` and `nodes` only.

OSM type = source-layer name. OSM id = MVT feature id (integer), not a property.

Tags = flat string properties. Skip keys starting with `@` (`@only_discardable`; on ways/relations also `@xmin` `@ymin` `@xmax` `@ymax` bbox floats).

Headers: `Content-Type: application/vnd.mapbox-vector-tile`. gzip. `Cache-Control: max-age=600`. `Vary: Origin`.

### CORS (production tiles, not README)

- Origin `http://localhost:5173` → `Access-Control-Allow-Origin` echo
- Origin `https://osmcha.org` → no ACAO
- `http://127.0.0.1:5173` and `https://localhost:5173` → no ACAO
- `/status.json` is ACAO `*` (different endpoint)

Overlay works in local Vite. osmcha.org cannot load tiles until Spyglass nginx allows that origin or we add a proxy (out of scope).
