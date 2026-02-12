"use client";

import React from "react";
import usePersistedState from "@/lib/usePersistedState";
import MapsShell from "@/components/maps/MapsShell";
import MapPlaceholder from "@/components/maps/MapPlaceholder";
import QiblaView from "@/components/maps/QiblaView";
import { PillarKey } from "@/lib/pillars";

type SalahMode = "map" | "qibla";

export default function PillarMapBar({ active }: { active: PillarKey }) {
  // Only show for Salah + Hajj (for now)
  if (active !== "salah" && active !== "hajj") return null;

  // Salah: has toggle
  if (active === "salah") {
    const [mode, setMode] = usePersistedState<SalahMode>("fp_salah_map_mode_v1", "qibla");

    return (
      <MapsShell
        title="Salah"
        subtitle="Quick tools for prayer"
        modes={[
          { key: "map", label: "Maps" },
          { key: "qibla", label: "Qibla" }
        ]}
        activeMode={mode}
        onModeChange={(k) => setMode(k as SalahMode)}
      >
        {mode === "map" ? (
          <MapPlaceholder hint="(Nearby mosques + prayer-friendly guidance can live here later.)" />
        ) : (
          <QiblaView />
        )}
      </MapsShell>
    );
  }

  // Hajj: persistent map area (no toggle yet, you can add later)
  return (
    <MapsShell title="Hajj" subtitle="Locations & guidance (always visible)">
      <MapPlaceholder hint="(Mina, Arafat, Muzdalifah, Jamarat, Haram — with your Hajj flow below.)" />
    </MapsShell>
  );
}
