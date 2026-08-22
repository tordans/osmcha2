# Notes in OSM discussion URLs

OSMCha has no store for per-object discussion; the only durable write is an OSM discussion post, which cannot be edited after it is sent. We encode notes as working OSMCha deep links inside those posts — the URL is the schema — and freeze that encoding here, because posted text is irreversible.

## Considered Options

- **OSM discussion posts containing OSMCha deep links** (chosen). No OSMCha-side storage. No Django change in this slice.
- **Django / OSMCha storage for notes.** Would need a backend and would not appear on osm.org.
- **Separate `element` and `tag` query parameters.** A tag without an object is meaningless; one `ref` path is the OSM-shaped address.
- **Markdown in the discussion body.** OSM changeset discussion is plain text; formatting would show as punctuation on osm.org.

## Consequences

- One `ref` parameter, not `element` plus `tag`: `type/id` or `type/id/key`. The key is everything after the second `/`. Absent `ref` means the changeset itself.
- Orthogonal `pin=lat,lng`, rounded to five decimals.
- Canonical posted URL: `{NOTE_PUBLIC_ORIGIN}/changesets/{id}?ref=...&pin=...` (today `https://tordans.github.io/osmcha2/changesets/{id}?…`). Never include `map=`. The parser accepts `/changesets/{id}` and `/osmcha2/changesets/{id}` on allowlisted hosts so GitHub Pages and local Vite both round-trip.
- Groups split on a line starting with `See ` plus an allowlisted `https://` URL whose path is this changeset and whose query has `ref` and/or `pin`. The visible label is decoration; OSMCha derives chips from `ref`.
- The composer writes frozen labels: backticks around object and key, `>` for object→tag, 📍 first when a pin is present. The parser never requires the label.
- Reference footer `See https://<origin>/changesets/{id}` only when there is no See group.
- Foreign handwritten refs (`n/123`, `way-123`) are ignored, not interpreted.
- OSM changeset discussion is plain text, not Markdown.
