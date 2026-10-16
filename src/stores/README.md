# Stores

Zustand v5 stores, one file per concern, named `{domain}-store.ts`. Each store keeps its `create` hook private and exports:

- `use{Slice}` selector hooks for state, one atomic value per hook.
- `use{Domain}Actions` for the `actions` namespace.

## Deliberate exception: `get*` accessors

Each store also exports non-reactive accessors, such as `getAuthToken`, `getAuthActions`, `getMapStyle`, `getListWidth`, `getListPaneOpen`, `getOpenEditor`, `getChangesetDraft` and `getFocusedObject`. They wrap `useXStore.getState()`. The stock Zustand skill does not allow this, but this repo keeps them on purpose, for code that runs outside React: event handlers, route loaders and the request layer in `src/network/request.ts`.

Rules:

- Never call a `get*` accessor in a render body (a component body, or a hook it calls while rendering). A `get*` read does not subscribe, so the component will not update when the value changes.
- Components read state through `use*` hooks. Use `get*` only in event handlers, loaders and non-React modules, where the current value is read at the moment of the action.
- Actions come from `use{Domain}Actions` in components and `get{Domain}Actions` outside React.
