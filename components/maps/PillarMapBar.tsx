"use client";

import React, { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import MapsShell from "./MapsShell";
import { PillarKey } from "@/lib/pillars";
import LeafletMap from "./LeafletMap";
import QiblaCompass from "./QiblaCompass";
type Mode = "maps" | "qibla";

// ✅ IMPORTANT: Leaflet must be loaded client-side only (prevents "window is not defined" on prerender)
const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 soft-shadow">
      <div className="text-sm font-semibold text-slate-900">Loading map…</div>
      <div className="mt-1 text-sm text-slate-600">Preparing map tiles.</div>
    </div>
  )
});

export default function PillarMapBar({ active }: { active: PillarKey }) {
  const show = active === "salah" || active === "hajj";
  if (!show) return null;

  const [mode, setMode] = useState<Mode>("maps");

  const config = useMemo(() => {
    if (active === "hajj") {
      return {
        title: "Hajj Map",
        subtitle: "Key locations for the Hajj journey",
        center: { lat: 21.4225, lng: 39.8262 },
        zoom: 12,
        markers: [
          { id: "kaaba", title: "Kaaba", description: "Masjid al-Haram", lat: 21.4225, lng: 39.8262 },
          { id: "mina", title: "Mina", description: "Tents city", lat: 21.4133, lng: 39.894 },
          { id: "arafat", title: "Arafat", description: "Day of Arafah", lat: 21.355, lng: 39.984 },
          { id: "muzdalifah", title: "Muzdalifah", description: "Collect pebbles", lat: 21.39, lng: 39.931 }
        ]
      };
    }

    return {
      title: "Salah",
      subtitle: "Map and Qibla tools",
      center: { lat: 21.4225, lng: 39.8262 },
      zoom: 4,
      markers: [
        { id: "kaaba", title: "Kaaba", description: "Qibla reference", lat: 21.4225, lng: 39.8262 }
      ]
    };
  }, [active]);

  const modes =
    active === "salah"
      ? [
          { key: "maps", label: "Maps" },
          { key: "qibla", label: "Qibla" }
        ]
      : undefined;

  return (
    <MapsShell
      title={config.title}
      subtitle={config.subtitle}
      modes={modes}
      activeMode={active === "salah" ? mode : undefined}
      onModeChange={active === "salah" ? (k) => setMode(k as Mode) : undefined}
    >
      {active === "salah" && mode === "qibla" ? (
        <QiblaCompass />
      ) : (
        <LeafletMap center={config.center} zoom={config.zoom} markers={config.markers} height={260} />
      )}
    </MapsShell>
  );
}

