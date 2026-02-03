// components/hajj/map/MapLegend.tsx
"use client";

import { useMapContext } from "@/lib/mapContext";

export default function MapLegend() {
  const { mapConfig } = useMapContext();
  const items = mapConfig.legend ?? [];

  if (!items.length) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-xs font-semibold tracking-wide text-slate-500">LEGEND</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((x) => (
          <span
            key={`${x.kind}-${x.label}`}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700"
          >
            <span className="inline-block h-2 w-2 rounded-full bg-slate-400" />
            {x.label}
          </span>
        ))}
      </div>
    </div>
  );
}

