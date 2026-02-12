"use client";

import React, { useMemo, useState } from "react";
import MapsShell from "./MapsShell";
import LeafletMap from "./LeafletMap";
import { PillarKey } from "@/lib/pillars";

type Mode = "maps" | "qibla";

export default function PillarMapBar({ active }: { active: PillarKey }) {
  const show = active === "salah" || active === "hajj";
  if (!show) return null;

  const [mode, setMode] = useState<Mode>("maps");

  const config = useMemo(() => {
    if (active === "hajj") {
      return {
        title: "Hajj Map",
        subtitle: "Key locations for the Hajj journey (early access)",
        center: { lat: 21.4225, lng: 39.8262 },
        zoom: 11,
        markers: [
          { id: "kaaba", title: "Kaaba", description: "Masjid al-Haram", lat: 21.4225, lng: 39.8262 },
          { id: "mina", title: "Mina", description: "Tents city", lat: 21.4133, lng: 39.8940 },
          { id: "arafat", title: "Arafat", description: "Day of Arafah", lat: 21.3550, lng: 39.9840 },
          { id: "muzdalifah", title: "Muzdalifah", description: "Collect pebbles", lat: 21.3900, lng: 39.9310 }
        ]
      };
    }

    // Salah
    return {
      title: "Salah",
      subtitle: "Maps + Qibla (uses your location when you tap Locate me)",
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
    <div className="container-page">
      <div className="max-w-3xl mx-auto mt-2">
        <MapsShell
          title={config.title}
          subtitle={config.subtitle}
          modes={modes}
          activeMode={active === "salah" ? mode : undefined}
          onModeChange={active === "salah" ? (k) => setMode(k as Mode) : undefined}
        >
          <LeafletMap
            center={config.center}
            zoom={config.zoom}
            markers={config.markers}
            height={300}
            enableSearch={mode === "maps"}          // search only in maps mode
            enableLanguageSwitch={true}            // always available
            enableQibla={active === "salah" && mode === "qibla"} // qibla compass mode
          />
        </MapsShell>
      </div>
    </div>
  );
}
