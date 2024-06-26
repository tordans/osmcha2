## Create config as global variable/store

See `_references/changeset-map/lib/config.js`

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

## TODO Code

```
  getRelationMembers(result) {
    let relationMembers = []
    result.geojson.features
      .filter((feature) => feature.properties.type === 'relation')
      .forEach((relation) =>
        relation.properties.relations.forEach((element) => {
          element.properties.relation = relation.properties.id
          element.properties.changeType = relation.properties.changeType
          relationMembers.push(element)
        }),
      )

    // exclude invalid relation members coordinates
    // caused by https://github.com/drolbr/Overpass-API/issues/536
    relationMembers = relationMembers.filter((member) => member.geometry.coordinates.length > 0)
    relationMembers.forEach((member) => {
      member.geometry.coordinates = member.geometry.coordinates.filter(
        (i) => typeof i === 'number' || (typeof i === 'object' && !isNaN(i[0])),
      )
    })
    return featureCollection(relationMembers)
  }
```

```
this.map.queryRenderedFeatures([x1y1, x2y2], {
        layers: [
          'added-line',
          'added-point-tagged',
          'modified-old-line',
          'modified-old-point-tagged',
          'modified-old-point-untagged',
          'modified-new-line',
          'modified-new-point-tagged',
          'modified-new-point-untagged',
          'deleted-line',
          'deleted-point-tagged',
          'added-relation',
          'modified-old-relation',
          'modified-new-relation',
          'deleted-relation',
        ].concat(Object.keys(this.relationMembersLayers)),
      })
```

## Show status message

https://raw.githubusercontent.com/osmcha/osmcha-frontend/status/status.json

### Trust indicator

```
{isInTrustedlist && (
  <svg className="icon pl3 w18 h18 color-yellow inline-block align-middle">
  <use xlinkHref="#icon-star" />
  </svg>
)}
{isInWatchlist && (
  <svg className="icon pl3 w18 h18 color-red inline-block align-middle">
  <use xlinkHref="#icon-alert" />
  </svg>
)}
```

```
const [isInTrustedlist, isInWatchlist] = useIsUserListed(
  user,
  properties.get('uid'),
  trustedlist,
  watchlisted,
)
```

```
export const useIsUserListed = (
  username,
  uid,
  trustedlist,
  watchlist
) => {
  const [isInTrustedlist, setIsInTrustedlist] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  useEffect(() => {
    try {
      setIsInTrustedlist(trustedlist.indexOf(username) !== -1);
    } catch (e) {
      setIsInTrustedlist(false);
    }
    try {
      setIsInWatchlist(
        watchlist.map((user) => user.get("uid")).indexOf(uid) !==
          -1
      );
    } catch (e) {
      setIsInWatchlist(false);
    }
  }, [username, uid, watchlist, trustedlist]);

  return [isInTrustedlist, isInWatchlist];
};

```

### Form: Query for suspicion reasons, tags

```
https://osmcha.org/api/v1/suspicion-reasons/?page_size=200
https://osmcha.org/api/v1/tags/?page_size=200
https://osmcha.org/api/v1/mapping-team/
https://osmcha.org/api/v1/blacklisted-users/

```

We will need this, once we build the filter form.

### Random lists of improvements

- Mobile UI
- Linkify Wikidata items in the changes table

### Guard against empty user json response

https://osmcha2.test:3000/changesets/152744764

> "Error: Unexpected end of JSON input"

### Add pagination to changeset list

### Change filter links

- Use nuqs to update the URL, not <Link>
- Make the call non-shallow, maybe refresh router
- Pass an object, not string
- Parse the object with zod
- Maybe https://github.com/47ng/nuqs/discussions/572 is needed to understand when data is passed or not

### Add link to OSMCha1

… to the changeset dropdown. To allow quick comparisons.

### Add metadata like source somewhere

https://osmcha2.test:3000/changesets/150440098 was reverted for it's source but the source is not visible in OSMCha2, yet
(Except for the imagery used in the image switcher)

### Add ELI for more background images

And provide a quick way to use the same image that the changeset used.
Use the "best" image for a region by default.

### No RealChangeset? > Show text on the map

ATM, the map stays half empty with no RealChangeset. We should at least show a message that the changest geometry is missing.

### Add tooltips

Some of the `title` attribute helper texts are too important to hide behind an attribute; we should have a tooltip library that shows them more prominently. Ideally, we wait for catalyst to add one so we don't have to figure this out ourselves… (again). Or use the new browser API?

### selectedFeature: Switch to nuqs

Wait for https://github.com/47ng/nuqs/discussions/574 or just do it now and accept the rerenders, they are not a real issue in production anyways.

### selectedFeature: Scroll changes list into view

Maybe we can use https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView to scroll the change into view when a feature is selected on the map?
