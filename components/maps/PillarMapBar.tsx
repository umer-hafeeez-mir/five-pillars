"use client";

import React, { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { PillarKey } from "@/lib/pillars";
import MapsShell from "./MapsShell";

type Mode = "maps" | "qibla";

// ✅ IMPORTANT: this prevents Leaflet from being imported during SSR/prerender
const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white soft-shadow">
      <div className="h-[260px] flex items-center justify-center text-sm text-slate-500">
        Loading map…
      </div>
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
        subtitle: "Key sites for Hajj (early version)",
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
      subtitle: "Maps + Qibla (coming soon)",
      center: { lat: 21.4225, lng: 39.8262 },
      zoom: 4,
      markers: [
        {
          id: "kaaba",
          title: "Kaaba",
          description: "Qibla direction reference",
          lat: 21.4225,
          lng: 39.8262
        }
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
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-sm font-semibold text-slate-900">Qibla (coming soon)</div>
          <div className="mt-1 text-sm text-slate-600">
            We’ll add a proper Qibla compass using your location (with permission).
          </div>
        </div>
      ) : (
        <LeafletMap center={config.center} zoom={config.zoom} markers={config.markers} height={260} />
      )}
    </MapsShell>
  );
}
