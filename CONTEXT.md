# OSMCha v2

OSMCha v2 reviews OpenStreetMap changesets. Discussion of objects lives as notes encoded in OSM discussion posts.

## Language

### Changeset discussion

**Changeset description**:
The mapper's `comment=` tag on the changeset.
_Avoid_: Comment

**Discussion post**:
One OSM changeset discussion body, authored by one person at one time.
_Avoid_: Comment

**Note**:
One in-app remark with a target. Many notes plus an optional intro compose into a single discussion post.
_Avoid_: Annotation, comment

**Note target**:
The changeset (no `ref`), an object (`ref=way/123`), or a tag on an object (`ref=way/123/highway`). Each target may also carry a pin.

**Reference** (`ref`):
The path that addresses an object or a tag.
_Avoid_: Element, focus, feature

**Pin**:
A map point attached to a note. Written `pin`, never `PIN`.
_Avoid_: PIN

**See header**:
The `See <url>` line that starts a note group in a discussion post.
_Avoid_: Group header, reference line

**Flag**:
Leftover OSMCha `reviewed_features` data, shown read-only as “Flagged by …”. Not an action in v2.
_Avoid_: treating Flag as a review action

### Map

**Map layers** (`layers`):
Which changeset geometry and overlays the review map shows. Tokens: `create`, `modify`, `delete`, `noop`, `node`, `way`, `relation`, `spyglass`. Hide reviewed geometry with `no-seen` / `no-unseen`. Omit when every changeset layer is on, OSM context is on, and both seen and unseen are shown.
_Avoid_: treating as a changeset list filter.

**Spyglass overlay** / **OSM context**:
Live tagged OSM objects from Spyglass tiles; hover-inspect only. The `spyglass` map layer.
_Avoid_: data layer, query tool, X-RAY.

**Unchanged element**:
An object in the changeset payload that was not edited (adiff `noop`). Shown as purple context. Distinct from **unchanged tags** on an edited object.
