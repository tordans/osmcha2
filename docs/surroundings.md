# Surroundings

How OSMCha v2 shows the OSM objects around a change, as an alternative to the switched-off [Spyglass overlay](spyglass.md). A test: Postpass is a free public service, so we may have to switch this off or host it ourselves.

Canonical code: [`src/views/surroundingsBoxes.ts`](../src/views/surroundingsBoxes.ts), [`src/network/postpass.ts`](../src/network/postpass.ts), [`src/query/hooks/useSurroundings.ts`](../src/query/hooks/useSurroundings.ts), [`src/components/changeset/SurroundingsButton.tsx`](../src/components/changeset/SurroundingsButton.tsx), [`src/views/SurroundingsLayers.tsx`](../src/views/SurroundingsLayers.tsx).

## What it does

The map button lights up when changes in view lack their surroundings. A click loads them; the map view does not move. Moving to other changes lights the button up again. The objects are thin dotted white lines and small nodes (the map is dimmed, so the black of the Spyglass overlay would not show), with hover inspect only. Areas are thinner and carry a band along their inside edge, as MAID draws them. What counts as an area is the rule of our presets (`matcher.isArea`, from iD by way of MAID); relations follow Postpass's polygon. A dashed frame shows where the loaded data ends. The top edge of each box carries the age of the data, a symbol layer drawn from a canvas image: our map styles have no glyphs for text. The data is today's OSM, not the state at the time of the changeset. The Filter map panel hides and shows it.

## Rules

- A request starts only from a click. Nothing loads on move, zoom, page load or changeset change, and nothing goes into the URL.
- One request at a time, 20 seconds at most, no retries. A click with several areas loads them one by one and stops at the first failure.
- A box is the changes in view plus 60 m around them, minor moves left out. 0.25 km² is its limit, not its size: it grows only as far as its changes need, and changes that do not fit go into further boxes. At most 6 boxes per click; the focused group or element goes first, then what is nearest to the centre of the view.
- `LIMIT 5000` per box, and reading stops above 4 MB: Postpass sends neither a size nor compression.
- The SQL holds only the numbers of a validated box. Requests carry no credentials.

## The query

```sql
SELECT osm_type, osm_id, tags,
  ST_Dimension(geom) = 2 AS polygon,
  ST_Dimension(geom) = 2 OR ST_IsClosed(geom) AS closed,
  ST_ClipByBox2D(<outline, counter-clockwise>, <box>) AS geom
FROM postpass_pointlinepolygon
WHERE geom && <box>
  AND NOT (osm_type = 'R' AND (tags ? 'route' OR tags ? 'route_master' OR tags ? 'boundary'))
LIMIT 5000
```

Areas are cut as outlines, because a cut polygon closes itself along the edge of the box and would draw straight lines there. Their rings run counter-clockwise so that the band's line offset lands inside. That includes closed ways Postpass keeps as lines, in the direction they were drawn: our area rule can call them areas too, so they are turned the same way with `ST_BuildArea`. Clipping is what makes relations possible: unclipped, 388 relations around Kreuzberg held 5.8 million points. Measured on 2026-10-31 over 0.26 km² there, the limit: 3093 objects, 1.3 MB, 0.44 s. Most relations there are routes and boundaries (336 of 350), which would only fill the hover. Postpass leaves the relation tag `type` out, so these are filtered by their other tags.

## Storage

Boxes do not belong to a changeset: a second one in the same place loads only what the first did not cover. They live in one Query entry (`['surroundings']`, see [caching](caching.md)) and in their own IndexedDB store for one hour, at most 60 boxes. Boxes can overlap; an object in two of them is then simply drawn twice.

The Query entry restores from IndexedDB only; it never touches the network. The click writes new boxes into it.

## Decisions

- Tags stay a JSON string on the feature and are parsed on hover. Flattened, tags such as `type` or `user` would clash with our own properties.
- Features have no id, so no `promoteId`: nothing uses feature state, and an object clipped into two boxes is two features.
- Plain boxes instead of `@osm-editor-kit/osm-coverage`: that package needs an OSM graph with node ids, and Postpass answers GeoJSON. Whether a change is covered is a test against the loaded boxes.
- Boxes instead of a fixed tile grid: tiles loaded whole areas around a few changes.
