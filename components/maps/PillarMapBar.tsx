"use client";

import React, { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import MapsShell from "./MapsShell";
import { PillarKey } from "@/lib/pillars";
import QiblaCompass from "./QiblaCompass";

// ✅ Load Leaflet map only on client (prevents window SSR crash)
const LeafletMapClient = dynamic(() => import("./LeafletMap"), { ssr: false });

type Mode = "maps" | "qibla";

type MapMarker = {
  id: string;
  title: string;
  description?: string;
  lat: number;
  lng: number;
};

export default function PillarMapBar({ active }: { active: PillarKey }) {
  // Show only on Salah + Hajj
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
        ] as MapMarker[]
      };
    }

    // Salah
    return {
      title: "Salah",
      subtitle: "Map and Qibla tools",
      center: { lat: 21.4225, lng: 39.8262 },
      zoom: 4,
      markers: [
        { id: "kaaba", title: "Kaaba", description: "Qibla direction reference", lat: 21.4225, lng: 39.8262 }
      ] as MapMarker[]
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
    <div className="container-page">
      <MapsShell
        title={config.title}
        subtitle={config.subtitle}
        modes={modes}
        activeMode={active === "salah" ? mode : undefined}
        onModeChange={active === "salah" ? (k) => setMode(k as Mode) : undefined}
      >
        {/* Qibla tab (Salah only) */}
        {active === "salah" && mode === "qibla" ? (
          <QiblaCompass />
        ) : (
          // Maps view (Salah + Hajj)
          <LeafletMapClient center={config.center} zoom={config.zoom} markers={config.markers} height={260} />
        )}
      </MapsShell>
    </div>
  );
}
