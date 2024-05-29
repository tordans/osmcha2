import { ChangesetListeSidebar } from './_components/ChangesetListeSidebar'

export default async function MapLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const resp = await fetch(
    'https://osmcha.org/api/v1/changesets/?page=1&page_size=25&date__gte=2024-05-27&date__lte=2024-05-29%2019%3A41',
    { headers: { Authorization: `Token ${process.env.NEXT_PUBLIC_TEMPORARY_USER_TOKE}` } },
  )
  const data = await resp.json()

  return (
    <div className="flex h-full grow gap-3">
      <nav className="w-72 flex-none lg:rounded-lg lg:bg-white lg:shadow-sm lg:ring-1 lg:ring-zinc-950/5 dark:lg:bg-zinc-900 dark:lg:ring-white/10">
        <ChangesetListeSidebar changesets={data} />
      </nav>
      <main className="flex-1  lg:rounded-lg lg:bg-white lg:shadow-sm lg:ring-1 lg:ring-zinc-950/5 dark:lg:bg-zinc-900 dark:lg:ring-white/10">
        {children}
      </main>
    </div>
  )
}

// TODO: ZOD types
// {
//   "id": 152004600,
//   "type": "Feature",
//   "geometry": {
//     "type": "Polygon",
//     "coordinates": [
//       [
//         [
//           49.2316708,
//           -123.0352745
//         ],
//         [
//           49.2316708,
//           -123.0331436
//         ],
//         [
//           49.251088,
//           -123.0331436
//         ],
//         [
//           49.251088,
//           -123.0352745
//         ],
//         [
//           49.2316708,
//           -123.0352745
//         ]
//       ]
//     ]
//   },
//   "properties": {
//     "check_user": null,
//     "reasons": [],
//     "tags": [],
//     "features": [],
//     "user": "joel56dt",
//     "uid": "3794090",
//     "editor": "Every Door Android 5.0",
//     "comment": "Created a residential, a bicycle_parking, and a bench; Updated 8 buildings, 4 house buildings, and a pastry shop",
//     "comments_count": 0,
//     "source": "Not reported",
//     "imagery_used": "Not reported",
//     "date": "2024-05-29T19:40:59Z",
//     "reviewed_features": [],
//     "tag_changes": {},
//     "create": 3,
//     "modify": 13,
//     "delete": 0,
//     "area": 0.00004137611147994803,
//     "is_suspect": false,
//     "harmful": null,
//     "checked": false,
//     "check_date": null,
//     "metadata": {}
//   }
// }

// OR
// "properties": {
//   "check_user": null,
//   "reasons": [
//       {
//           "id": 40,
//           "name": "New mapper"
//       }
//   ],
//   "tags": [],
//   "features": [],
//   "user": "Dawid2849",
//   "uid": "10642775",
//   "editor": "iD 2.29.0",
//   "comment": "uzupełnienie ambasady Palestyny",
//   "comments_count": 0,
//   "source": "Not reported",
//   "imagery_used": "Geoportal 2: Orthophotomap (latest aerial imagery) (WMTS)",
//   "date": "2024-05-29T19:57:59Z",
//   "reviewed_features": [],
//   "tag_changes": {
//       "office": [
//           "diplomatic"
//       ],
//       "landuse": [
//           "commercial"
//       ],
//       "offcial_name:ar": [
//           "سفارة دولة فلسطين – الجمهورية البولندية"
//       ],
//       "official_name:ar": [
//           "سفارة دولة فلسطين – الجمهورية البولندية"
//       ]
//   },
//   "create": 0,
//   "modify": 1,
//   "delete": 0,
//   "area": 2.088741000000005e-07,
//   "is_suspect": false,
//   "harmful": null,
//   "checked": false,
//   "check_date": null,
//   "metadata": {
//       "host": "https://www.openstreetmap.org/edit",
//       "locale": "pl",
//       "changesets_count": 15887
//   }
// }
