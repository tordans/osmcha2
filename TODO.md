## Create config as global variable/store

See `_references/changeset-map/lib/config.js`

## Changes: Filter empty notes

When note was created but is emtpy and it is is part of a way, filter it in the sidebar because it does not add any value to the list.

## Guard when Real Changeset is missing

It is not uncommon for the real changeset data to be missing yet or forever.
We need to recover from that, ideally show a message…

### Add overpass fallback

https://github.com/osmlab/changeset-map/pull/228/commits/338c3ac5a4e987ba4a7699b3ca3de0640f294e0f#diff-7404d92aa704d015273f3031f949a2f0c337d99d7aea2232ddd3ca1a7f8d183fL25

## Make sidebar resizable

https://medium.com/@ngpaulhenry/building-a-resizable-sidebar-component-with-persisting-width-using-react-tailwindcss-bdec28a594f

## Migrate osm-adiff-parser-saxjs

- Move from mapbox to the osmcha orga, update npm package
- https://www.npmjs.com/package/osm-adiff-parser-saxjs
- Convert packages to typescript, update dependencies

## Migrate real-changesets-parser

> [!NOTE]
> WIP in https://github.com/tordans/real-changesets-parser/

- Move from mapbox to the osmcha orga, update npm package
- https://www.npmjs.com/package/real-changesets-parser, https://github.com/mapbox/real-changesets-parser/
- Convert packages to typescript, update dependencies
- Note: https://github.com/ideditor/id-area-keys/network/dependents has nothing to do with https://github.com/openstreetmap/iD/blob/379be391a3fa8c95c2b142a3ce224d060bd4cebc/modules/osm/tags.js#L46-L69 but processes the tagging schema project to extract tags that are allowed on areas.