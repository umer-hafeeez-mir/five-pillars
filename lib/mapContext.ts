// lib/mapContext.ts
"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

export type LatLng = { lat: number; lng: number };

export type HajjSectionKey = "rituals" | "now" | "duas" | "practical" | "ziyarah" | "food";

export type LocationMode = "gps" | "manual";

export type MapPinKind = "site" | "ziyarah" | "food" | "shop" | "pharmacy" | "other";

export type MapPin = {
  id: string;
  kind: MapPinKind;
  title: string;
  subtitle?: string;
  coords: LatLng;
};

export type MapLegendItem = { label: string; kind: MapPinKind };

export type MapFocus =
  | { type: "nearMe"; zoom?: number }
  | { type: "coords"; coords: LatLng; zoom?: number }
  | { type: "bounds"; coords: LatLng[] };

export type MapOverlayRoute = {
  type: "route";
  coords: LatLng[];
  label?: string;
};

export type MapConfig = {
  focus?: MapFocus;
  pins?: MapPin[];
  overlay?: MapOverlayRoute | null;
  legend?: MapLegendItem[];
};

type MapState = {
  activeSection: HajjSectionKey;
  setActiveSection: (s: HajjSectionKey) => void;

  // location
  locationMode: LocationMode;
  setLocationMode: (m: LocationMode) => void;

  gpsLocation: LatLng | null;
  gpsAccuracy: number | null;
  gpsError: string | null;

  manualLocation: LatLng | null;
  setManualLocation: (coords: LatLng) => void;
  clearManualLocation: () => void;

  // map config driven by sections
  mapConfig: MapConfig;
  setMapConfig: (cfg: MapConfig) => void;
  resetMapConfig: () => void;

  // computed "current" location
  currentLocation: LatLng | null;
};

const Ctx = createContext<MapState | null>(null);

export function MapProvider({ children }: { children: React.ReactNode }) {
  const [activeSection, setActiveSection] = useState<HajjSectionKey>("rituals");

  const [locationMode, setLocationMode] = useState<LocationMode>("gps");

  const [gpsLocation, setGpsLocation] = useState<LatLng | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const [manualLocation, _setManualLocation] = useState<LatLng | null>(null);

  const [mapConfig, _setMapConfig] = useState<MapConfig>({
    focus: { type: "nearMe", zoom: 14 },
    pins: [],
    overlay: null,
    legend: []
  });

  const setManualLocation = (coords: LatLng) => {
    _setManualLocation(coords);
    setLocationMode("manual");
  };

  const clearManualLocation = () => {
    _setManualLocation(null);
    setLocationMode("gps");
  };

  const setMapConfig = (cfg: MapConfig) => {
    _setMapConfig((prev) => ({
      ...prev,
      ...cfg,
      // allow clearing overlay by explicitly passing null
      overlay: cfg.overlay === undefined ? prev.overlay : cfg.overlay
    }));
  };

  const resetMapConfig = () => {
    _setMapConfig({
      focus: { type: "nearMe", zoom: 14 },
      pins: [],
      overlay: null,
      legend: []
    });
  };

  const currentLocation = useMemo(() => {
    if (locationMode === "manual") return manualLocation;
    return gpsLocation;
  }, [locationMode, manualLocation, gpsLocation]);

  const value: MapState = {
    activeSection,
    setActiveSection,

    locationMode,
    setLocationMode,

    gpsLocation,
    gpsAccuracy,
    gpsError,

    manualLocation,
    setManualLocation,
    clearManualLocation,

    mapConfig,
    setMapConfig,
    resetMapConfig,

    currentLocation
  };

  // Expose setters for gps via imperative helpers (see geo.ts)
  // We keep them here via window so geo.ts can update without circular deps.
  // This remains offline-safe and client-only.
  if (typeof window !== "undefined") {
    // @ts-ignore
    window.__FP_MAP__ = window.__FP_MAP__ || {};
    // @ts-ignore
    window.__FP_MAP__.setGps = (loc: LatLng | null, acc: number | null, err: string | null) => {
      setGpsLocation(loc);
      setGpsAccuracy(acc);
      setGpsError(err);
    };
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMapContext() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useMapContext must be used within MapProvider");
  return ctx;
}

