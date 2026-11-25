# Filter saving: states before and after

How the filter form (`/filters`) moves between unsaved URL filters and saved filters (AOIs), before and after the rework in `f20a68e` ("Filters form: one source per list, Save overwrites the saved filter, Duplicate opens a copy").

Canonical code: [`src/views/filters.tsx`](../src/views/filters.tsx), [`src/components/filters/filters_header.tsx`](../src/components/filters/filters_header.tsx), [`src/stores/filter-copy-store.ts`](../src/stores/filter-copy-store.ts), legacy link migration in [`src/routes/__root.tsx`](../src/routes/__root.tsx). **Update the "After" diagram when the form's actions change.**

---

## Before: four list states plus a form draft

```mermaid
stateDiagram-v2
    direction LR

    Recent: Recent<br/>no filters in the URL
    Url: URL filters<br/>?comment=…&geometry=…
    Saved: Saved filter<br/>?aoi=…
    Mixed: Mixed state<br/>?aoi=…&comment=…
    Draft: Form draft<br/>in memory only

    [*] --> Recent
    Recent --> Draft: Edit / New filter
    Url --> Draft: Edit
    Saved --> Draft: Edit (loads saved version)
    Mixed --> Draft: Edit (loads the URL version)

    Draft --> Url: Apply
    Draft --> Saved: Save + name (create new)
    Draft --> Mixed: Apply with aoi
    Draft --> [*]: X (draft lost, no prompt)

    note right of Mixed
        The list only queries /aoi/{id}/changesets/
        and shows the saved version,
        while form and URL show the edited one.
    end note
```

Problems:

- **Mixed state.** Apply on a saved filter wrote the filters into the URL _next to_ `aoi`. The list ignored them, so it looked saved but showed something else than the form.
- **Save and Apply were separate.** Save asked for the name every time. For a new filter it jumped to the list, for an existing one it silently stayed in the form; it was unclear whether Apply was still needed.
- **Drafts got lost.** The X closed the form without asking.
- Reset led back to Recent from anywhere.

## After: two states, one source per list

```mermaid
stateDiagram-v2
    direction LR

    Url: URL filters (unsaved)<br/>?comment=… · Recent = no filters
    Saved: Saved filter<br/>only ?aoi=… in the URL

    [*] --> Url
    Url --> Url: Edit + Apply (new URL, nothing saved) · Reset
    Url --> Saved: Save as… (asks for a name, signed in only)
    Saved --> Saved: Edit + Save (overwrites same aoi, list reloads)
    Saved --> Url: Duplicate (opens a "Copy of …" as URL filters)
    Saved --> Url: Delete

    note left of Url
        Old link with ?aoi= and filters:
        opens as a copy (URL filters)
        with "Copy of …", nothing is lost.
    end note
```

What changed:

- **A list comes from the URL or from a saved filter, never both.** Save writes only `?aoi=…`; Apply and Duplicate write only filters without `aoi`.
- **Save overwrites.** In a saved filter, Save is the one main button: it updates that same filter (name included) and shows its list. The name is asked for only once, in "Save as…", and is a plain field afterwards.
- **Duplicate makes URL filters**, shown as "Copy of _name_". "Save as…" suggests "_name_ (copy)". No orphaned saved filters are created.
- **Unsaved changes are shown, not autosaved.** When the form differs from its source, the header says "Unsaved changes" (saved filter) or "Not applied yet" (URL filters). Leaving via X, Reset or another filter asks "Discard unsaved changes?"; a saved filter also offers "Discard changes". Autosave was rejected because every save reloads the list and half-done input (polygon, place search) would go live at once.
