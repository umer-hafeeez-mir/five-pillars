// components/hajj/sections/NowSection.tsx
"use client";

import { useEffect } from "react";
import Card from "@/components/Card";
import { useMapContext } from "@/lib/mapContext";
import { HAJJ_SITES } from "@/components/hajj/data/sites";

export default function NowSection() {
  const { setMapConfig, currentLocation } = useMapContext();

  useEffect(() => {
    // Show only the 5 holy sites in Now mode
    setMapConfig({
      focus: currentLocation ? { type: "coords", coords: currentLocation, zoom: 13 } : { type: "nearMe", zoom: 13 },
      pins: HAJJ_SITES.map((s) => ({
        id: s.id,
        kind: "site",
        title: s.title,
        subtitle: s.hint,
        coords: s.coords
      })),
      overlay: null,
      legend: [{ label: "Holy site", kind: "site" }]
    });
  }, [setMapConfig, currentLocation]);

  return (
    <Card title="I’M HERE NOW — WHAT SHOULD I DO?">
      <div className="text-sm text-slate-600 leading-relaxed space-y-3">
        <p>
          Now Mode shows location-specific next steps. For v1, we highlight the five holy sites on the map.
          Next, we’ll attach action checklists to each site.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {["Mina", "Arafat", "Muzdalifah", "Haram"].map((x) => (
            <button
              key={x}
              type="button"
              className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition"
            >
              {x}
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}
