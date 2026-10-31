# Notes in OSM discussion URLs

OSMCha has no store for per-object discussion; the only durable write is an OSM discussion post, which cannot be edited after it is sent. We encode notes as working OSMCha deep links inside those posts. The URL is the schema. We freeze that encoding here, because posted text is irreversible.

## Considered options

- **OSM discussion posts containing OSMCha deep links** (chosen). No OSMCha-side storage. No Django change in this slice.
- **Django / OSMCha storage for notes.** Would need a backend and would not appear on osm.org.
- **Separate `element` and `tag` query parameters.** A tag without an object is meaningless; one `ref` path is the OSM-shaped address.
- **Markdown in the discussion body.** OSM changeset discussion is plain text; formatting would show as punctuation on osm.org.

## Consequences

- One `ref` parameter, not `element` plus `tag`: `type/id` or `type/id/key`. The key is everything after the second `/`. Absent `ref` means the changeset itself.
- Orthogonal `pin=lat,lng`, rounded to five decimals.
- A note on a tag row of a "Same tag changes" group is about the whole group. It adds `group=<size>` to the `ref` of the group's first member and that tag key: `?ref=node/14331471295/man_made&group=2`. The size is 2 or more and only valid with a tag key; anything else is ignored and leaves a normal object or tag note. The URL never lists the other members: a group can have hundreds, and OSM limits the comment length. The composer writes the label ``See `node/14331471295` > `man_made` + 1 more <url>`` so a reader on osm.org understands it; the parser never relies on it. `group` goes after `ref` and before `pin`. Posts without `group` keep their meaning.
- A regrouped list (the changeset's grouping is derived, and the tool can group differently later): a group note stays with the member its `ref` names. If that member is in a group of two or more, the note shows in that group's panel, whatever the group's size now is; the posted size is context for readers, not matched. If that member has no group any more, the note shows on its row as an ordinary note on that object and tag, so nothing is lost.
- Canonical posted URL: `{NOTE_PUBLIC_ORIGIN}/changesets/{id}?ref=...&pin=...` (today `https://tordans.github.io/osmcha2/changesets/{id}?…`). Never include `map=`. The parser accepts `/changesets/{id}` and `/osmcha2/changesets/{id}` on allowlisted hosts so GitHub Pages and local Vite both round-trip.
- Groups split on a line starting with `See ` plus an allowlisted `https://` URL whose path is this changeset and whose query has `ref` and/or `pin`. The visible label is decoration; OSMCha derives chips from `ref`.
- The composer writes frozen labels: backticks around object and key, `>` for object→tag, 📍 first when a pin is present. The parser never requires the label.
- Reference footer `See https://<origin>/changesets/{id}` only when there is no See group.
- Foreign handwritten refs (`n/123`, `way-123`) are ignored, not interpreted.
- OSM changeset discussion is plain text, not Markdown.
