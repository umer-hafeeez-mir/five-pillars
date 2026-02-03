// components/hajj/sections/HajjShell.tsx
"use client";

import { useEffect } from "react";
import { MapProvider, useMapContext } from "@/lib/mapContext";
import { startGeoWatch, pushGpsState } from "@/lib/geo";

import HajjMapCard from "@/components/hajj/map/HajjMapCard";
import HajjHome from "@/components/hajj/hajjHome";

function HajjShellInner() {
  const { locationMode } = useMapContext();

  // Keep GPS updated while in gps mode; pause in manual mode.
  useEffect(() => {
    if (locationMode !== "gps") return;

    const watcher = startGeoWatch(
      (coords, accuracy) => pushGpsState(coords, accuracy ?? null, null),
      (err) => pushGpsState(null, null, err)
    );

    return () => watcher.stop();
  }, [locationMode]);

  return (
    <div className="mt-6 space-y-4">
      {/* Persistent map card */}
      <HajjMapCard />

      {/* Tabs + active section content */}
      <HajjHome />
    </div>
  );
}

export default function HajjShell() {
  return (
    <MapProvider>
      <HajjShellInner />
    </MapProvider>
  );
}

