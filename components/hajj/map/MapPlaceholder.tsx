// components/hajj/map/MapPlaceholder.tsx
"use client";

import { useMapContext } from "@/lib/mapContext";

function formatCoords(lat?: number, lng?: number) {
  if (lat == null || lng == null) return "—";
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

export default function MapPlaceholder() {
  const { mapConfig, currentLocation, locationMode, gpsError } = useMapContext();

  const pins = mapConfig.pins ?? [];
  const focus = mapConfig.focus;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold tracking-wide text-slate-500">MAP (PLACEHOLDER)</div>
          <div className="mt-1 text-sm font-semibold text-slate-900">
            {locationMode === "gps" ? "Auto location" : "Manual location"}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Current: {formatCoords(currentLocation?.lat, currentLocation?.lng)}
          </div>
          {gpsError && locationMode === "gps" && (
            <div className="mt-1 text-xs text-rose-600">GPS: {gpsError}</div>
          )}
        </div>

        <div className="text-right text-xs text-slate-500">
          Focus:{" "}
          <span className="font-medium text-slate-700">
            {focus?.type ?? "—"}
          </span>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="text-xs font-semibold text-slate-700">Pins ({pins.length})</div>
        {pins.length === 0 ? (
          <div className="mt-1 text-xs text-slate-500">No markers for this section yet.</div>
        ) : (
          <ul className="mt-2 space-y-2">
            {pins.slice(0, 6).map((p) => (
              <li key={p.id} className="text-xs text-slate-600">
                <span className="font-semibold text-slate-800">{p.title}</span>{" "}
                <span className="text-slate-500">({p.kind})</span>
                {p.subtitle ? <span className="text-slate-500"> — {p.subtitle}</span> : null}
              </li>
            ))}
            {pins.length > 6 && <li className="text-xs text-slate-500">+ {pins.length - 6} more…</li>}
          </ul>
        )}
      </div>
    </div>
  );
}

