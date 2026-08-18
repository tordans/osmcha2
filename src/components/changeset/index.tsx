import type { MapLibreAugmentedDiffViewer } from "@osmcha/maplibre-adiff-viewer";
import bbox from "@turf/bbox";
import type * as maplibre from "maplibre-gl";
import { useHotkeys } from "@tanstack/react-hotkeys";
import React, { useRef, useState } from "react";
import {
  CHANGESET_DETAILS_DETAILS,
  CHANGESET_DETAILS_DISCUSSIONS,
  CHANGESET_DETAILS_MAP,
} from "../../config/bindings.ts";
import { useAuth } from "../../hooks/useAuth.ts";
import { useChangesetMap } from "../../query/hooks/useChangesetMap.ts";
import { useChangesetMapper } from "../../query/hooks/useChangesetMapper.ts";
import { DebugDataHelper } from "../debug/DebugDataHelper.tsx";
import ElementInfo from "../element_info.tsx";
import { exclusiveKeyToggleState } from "./exclusiveKeyToggle.ts";
import { MapOptions } from "./map_options.tsx";
import { ReviewColumn } from "./ReviewColumn.tsx";

type ChangesetProps = {
  changesetId: number | null;
  currentChangeset: any;
  showElements: Array<string>;
  showActions: Array<string>;
  setShowElements: (elements: Array<string>) => any;
  setShowActions: (actions: Array<string>) => any;
  mapRef: React.RefObject<{
    map: maplibre.Map;
    adiffViewer: MapLibreAugmentedDiffViewer;
  } | null>;
  selected: any;
  setSelected: (selected: any) => void;
  children: React.ReactNode;
};

const columnToggleOptions = [
  CHANGESET_DETAILS_DETAILS,
  CHANGESET_DETAILS_DISCUSSIONS,
];

/**
 * Review workspace: map pane (children) plus the review column / bottom sheet.
 * Selected-feature card and map options stay on the map.
 */
function Changeset({
  changesetId,
  currentChangeset,
  showElements,
  showActions,
  setShowElements,
  setShowActions,
  mapRef,
  selected,
  setSelected,
  children,
}: ChangesetProps) {
  const { token } = useAuth();
  const { data: osmInfo } = useChangesetMap(changesetId);
  const { userDetails, whosThat } = useChangesetMapper(
    currentChangeset?.properties?.uid,
    Boolean(token),
  );
  const ready = Boolean(changesetId && currentChangeset);
  const mapOptionsButtonRef = useRef<HTMLButtonElement>(null);

  const [bindingsState, setBindingsState] = useState<Record<string, boolean>>(
    () => {
      const initial: Record<string, boolean> = {};
      for (const opt of columnToggleOptions) {
        initial[opt.label] = opt === CHANGESET_DETAILS_DETAILS;
      }
      return initial;
    },
  );

  function exclusiveKeyToggle(label: string) {
    setBindingsState((prev) => exclusiveKeyToggleState(columnToggleOptions, prev, label));
  }

  useHotkeys(
    CHANGESET_DETAILS_MAP.hotkeys.map((hotkey) => ({
      hotkey,
      callback: () => {
        mapOptionsButtonRef.current?.click();
      },
    })),
  );

  function setHighlight(type: string, id: number, isHighlighted: boolean) {
    if (!mapRef.current) return;
    const { adiffViewer } = mapRef.current;
    if (isHighlighted) {
      adiffViewer.highlight(type, id);
    } else {
      adiffViewer.unhighlight(type, id);
    }
  }

  function zoomToAndSelect(type: string, id: number) {
    if (!mapRef.current) return;
    const { map, adiffViewer } = mapRef.current;

    const features = adiffViewer.geojson.features.filter(
      (feature: any) =>
        feature.properties.type === type && feature.properties.id === id,
    );

    let bounds = bbox({ type: "FeatureCollection", features });
    if (bounds.length === 6) {
      bounds = [bounds[0], bounds[1], bounds[3], bounds[4]];
    }
    const nextCamera = map.cameraForBounds(bounds, {
      padding: 50,
      maxZoom: 18,
    });
    if (nextCamera) {
      map.jumpTo(nextCamera);
    }

    adiffViewer.select(type, id);

    const action = adiffViewer.adiff.actions.find((item: any) => {
      const element = item.new ?? item.old;
      return element.type === type && element.id === id;
    });

    setSelected(action);
  }

  return (
    <div className="relative flex h-full min-h-0 min-w-0 flex-col min-[56rem]:flex-row min-[56rem]:gap-3">
      <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden min-[56rem]:rounded-lg min-[56rem]:ring-1 min-[56rem]:ring-zinc-950/5">
        {children}
        <div
          className="absolute top-[max(0.75rem,env(safe-area-inset-top))] right-[max(0.75rem,env(safe-area-inset-right))] z-10 flex flex-col-reverse items-end gap-2 min-[56rem]:top-auto min-[56rem]:bottom-[max(0.75rem,env(safe-area-inset-bottom))] min-[56rem]:flex-col"
        >
          {ready && changesetId && selected && (
            <div className="max-h-[40%] min-w-0 max-w-[min(100%,24rem)] overflow-y-auto rounded-lg bg-white px-3 py-2 shadow-sm ring-1 ring-zinc-950/10 min-[56rem]:max-h-[60%] min-[56rem]:max-w-[34rem]">
              <ElementInfo
                action={selected}
                setHighlight={setHighlight}
                changeset={currentChangeset}
                changesetId={changesetId}
              />
            </div>
          )}
          {ready && (
            <MapOptions
              ref={mapOptionsButtonRef}
              showElements={showElements}
              showActions={showActions}
              setShowElements={setShowElements}
              setShowActions={setShowActions}
            />
          )}
        </div>
      </div>
      {ready && changesetId && (
        <ReviewColumn
          changesetId={changesetId}
          currentChangeset={currentChangeset}
          userDetails={userDetails}
          whosThat={whosThat}
          bindingsState={bindingsState}
          exclusiveKeyToggle={exclusiveKeyToggle}
          osmInfo={osmInfo}
          selected={selected}
          setHighlight={setHighlight}
          zoomToAndSelect={zoomToAndSelect}
        />
      )}
      <DebugDataHelper
        changesetId={changesetId}
        selected={selected}
        mapRef={mapRef}
      />
    </div>
  );
}

export { Changeset };
