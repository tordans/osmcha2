import type { MapLibreAugmentedDiffViewer } from "@osmcha/maplibre-adiff-viewer";
import type * as maplibre from "maplibre-gl";
import Mousetrap from "mousetrap";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router";

import { Changeset as ChangesetWorkspace } from "../components/changeset/index.tsx";
import { FILTER_BY_USER } from "../config/bindings.ts";
import { useFilters } from "../hooks/useFilters.ts";
import { useChangeset } from "../query/hooks/useChangeset.ts";
import { showToast } from "../utils/toast.ts";
import { CMap } from "../views/map.tsx";

interface ChangesetData {
  properties?: {
    user?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

function Changeset() {
  const { setFilters } = useFilters();
  const { id } = useParams<{ id: string }>();
  const changesetId = id ? parseInt(id, 10) : null;

  const { data: currentChangeset, error } = useChangeset(changesetId);

  const changeset = currentChangeset as ChangesetData | undefined;

  const [camera, setCamera] = useState<any>(null);
  const [selected, setSelected] = useState<any>(null);
  const [showElements, setShowElements] = useState<Array<string>>([
    "node",
    "way",
    "relation",
  ]);
  const [showActions, setShowActions] = useState<Array<string>>([
    "create",
    "modify",
    "delete",
    "noop",
  ]);

  const mapRef = useRef<{
    map: maplibre.Map;
    adiffViewer: MapLibreAugmentedDiffViewer;
  } | null>(null);

  const filterChangesetsByUser = useCallback(() => {
    if (changeset?.properties) {
      const userName = changeset.properties.user;
      setFilters({
        users: [
          {
            label: userName,
            value: userName,
          },
        ],
      });
    }
  }, [changeset, setFilters]);

  useEffect(() => {
    Mousetrap.bind(FILTER_BY_USER.bindings, filterChangesetsByUser);
    return () => {
      for (const k of FILTER_BY_USER.bindings) {
        Mousetrap.unbind(k);
      }
    };
  }, [filterChangesetsByUser]);

  useEffect(() => {
    setSelected(null);
    setShowElements(["node", "way", "relation"]);
    setShowActions(["create", "modify", "delete", "noop"]);
  }, []);

  useEffect(() => {
    if (error) {
      showToast({
        kind: "error",
        title: `changeset:${changesetId} failed to load`,
        description: "Try reloading osmcha",
      });
      console.error(error);
    }
  }, [error, changesetId]);

  return (
    <ChangesetWorkspace
      changesetId={changesetId}
      currentChangeset={changeset}
      showElements={showElements}
      showActions={showActions}
      setShowElements={setShowElements}
      setShowActions={setShowActions}
      mapRef={mapRef}
      selected={selected}
      setSelected={setSelected}
      camera={camera}
    >
      <CMap
        changesetId={changesetId}
        mapRef={mapRef}
        className="h-full w-full"
        showElements={showElements}
        showActions={showActions}
        setSelected={setSelected}
        setCamera={setCamera}
      />
    </ChangesetWorkspace>
  );
}

export { Changeset };
