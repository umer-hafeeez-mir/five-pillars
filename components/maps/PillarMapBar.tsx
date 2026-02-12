"use client";

import React, { useMemo, useState } from "react";
import MapShell from "./MapShell";
import { PillarKey } from "@/lib/pillars";

type Mode = "maps" | "qibla";

export default function PillarMapBar({ active }: { active: PillarKey }) {
  // Show only on Salah + Hajj for now
  const show = active === "salah" || active === "hajj";
  if (!show) return null;

  const [mode, setMode] = useState<Mode>("maps");

  const config = useMemo(() => {
    if (active === "hajj") {
      return {
        title: "Hajj Map",
        center: { lat: 21.4225, lng: 39.8262 }, // Makkah
        zoom: 12,
        markers: [
          { id: "kaaba", title: "Kaaba", description: "Masjid al-Haram", lat: 21.4225, lng: 39.8262 },
          { id: "mina", title: "Mina", description: "Tents city", lat: 21.4133, lng: 39.8940 },
          { id: "arafat", title: "Arafat", description: "Day of Arafah", lat: 21.3550, lng: 39.9840 },
          { id: "muzdalifah", title: "Muzdalifah", description: "Collect pebbles", lat: 21.3900, lng: 39.9310 }
        ]
      };
    }

    // Salah (generic “map” mode – can later add “nearby mosques”)
    return {
      title: "Salah",
      center: { lat: 21.4225, lng: 39.8262 }, // default to Makkah for now, or your user’s location later
      zoom: 4,
      markers: [{ id: "kaaba", title: "Kaaba", description: "Qibla direction reference", lat: 21.4225, lng: 39.8262 }]
    };
  }, [active]);

  return (
    <div className="container-page">
      <div className="max-w-3xl mx-auto mt-2">
        {/* Salah only: toggle Maps / Qibla */}
        {active === "salah" ? (
          <div className="mb-3 flex items-center justify-center">
            <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setMode("maps")}
                className={[
                  "px-4 py-2 text-sm font-semibold rounded-lg transition",
                  mode === "maps"
                    ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                    : "text-slate-700"
                ].join(" ")}
              >
                Maps
              </button>

              <button
                type="button"
                onClick={() => setMode("qibla")}
                className={[
                  "px-4 py-2 text-sm font-semibold rounded-lg transition",
                  mode === "qibla"
                    ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                    : "text-slate-700"
                ].join(" ")}
              >
                Qibla
              </button>
            </div>
          </div>
        ) : null}

        {/* Content */}
        {active === "salah" && mode === "qibla" ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 soft-shadow">
            <div className="text-sm font-semibold text-slate-900">Qibla (coming soon)</div>
            <div className="mt-1 text-sm text-slate-600">
              We’ll add a proper Qibla compass using your location (with permission).
            </div>
          </div>
        ) : (
          <MapShell center={config.center} zoom={config.zoom} markers={config.markers} height={260} />
        )}
      </div>
    </div>
  );
}
