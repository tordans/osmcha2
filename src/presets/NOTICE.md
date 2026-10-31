# Notices for src/presets

This folder is a port of the matching part of MAID's presets package, which follows iD. It is not original code.

| What                                                                                                                         | From                                                                                                           | Licence |
| ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------- |
| `matcher.ts`, `locations.ts`, their tests                                                                                    | MAID (`packages/presets/src/presets.ts`, `locations.ts` and tests), commit 24060cc. (c) 2026 Maid contributors | ISC     |
| The rules behind them: preset matching, match scores, area keys, `osmTagSuggestingArea`, test cases                          | iD (`modules/presets`, `modules/osm/tags.ts`, `test/spec/presets`). (c) iD contributors                        | ISC     |
| `data/matching-presets.json`: tags, geometry, scores and English names of the presets, cut from the package by `generate.ts` | `@openstreetmap/id-tagging-schema` 7.x. (c) iD contributors                                                    | ISC     |
| Country borders and region codes used by `locations.ts` (imported, not copied)                                               | `@rapideditor/country-coder`. (c) country-coder contributors                                                   | ISC     |

ISC License

Copyright (c) 2026, Maid contributors
Copyright (c) iD contributors

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
