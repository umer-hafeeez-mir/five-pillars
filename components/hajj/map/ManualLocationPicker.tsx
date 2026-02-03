// components/hajj/map/ManualLocationPicker.tsx
"use client";

import { useMapContext } from "@/lib/mapContext";
import { HAJJ_SITES } from "@/components/hajj/data/sites";

export default function ManualLocationPicker() {
  const { locationMode, setLocationMode, setManualLocation, clearManualLocation } = useMapContext();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold tracking-wide text-slate-500">LOCATION MODE</div>
          <div className="mt-1 text-sm font-semibold text-slate-900">
            {locationMode === "gps" ? "Auto (GPS)" : "Manual"}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Use manual mode if GPS is inaccurate or unavailable.
          </div>
        </div>

        <button
          type="button"
          onClick={() => setLocationMode(locationMode === "gps" ? "manual" : "gps")}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          {locationMode === "gps" ? "Use manual" : "Use GPS"}
        </button>
      </div>

      {locationMode === "manual" && (
        <div className="mt-3">
          <div className="text-xs font-semibold text-slate-600">Pick your location</div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {HAJJ_SITES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setManualLocation(s.coords)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition text-left"
              >
                <div>{s.title}</div>
                <div className="mt-1 text-[11px] font-medium text-slate-500">{s.hint}</div>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={clearManualLocation}
            className="mt-3 w-full rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 py-3 text-sm font-semibold transition"
          >
            Reset to GPS
          </button>
        </div>
      )}
    </div>
  );
}

