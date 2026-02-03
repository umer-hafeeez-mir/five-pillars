// lib/geo.ts
"use client";

export type LatLng = { lat: number; lng: number };

type GeoResult =
  | { ok: true; coords: LatLng; accuracy?: number }
  | { ok: false; error: string };

export async function getCurrentPositionOnce(options?: PositionOptions): Promise<GeoResult> {
  if (typeof window === "undefined") return { ok: false, error: "Not available on server." };
  if (!("geolocation" in navigator)) return { ok: false, error: "Geolocation not supported." };

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          ok: true,
          coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          accuracy: pos.coords.accuracy
        });
      },
      (err) => {
        resolve({ ok: false, error: err.message || "Could not get location." });
      },
      options ?? { enableHighAccuracy: true, timeout: 8000, maximumAge: 30_000 }
    );
  });
}

export function startGeoWatch(
  onUpdate: (coords: LatLng, accuracy?: number) => void,
  onError: (error: string) => void,
  options?: PositionOptions
) {
  if (typeof window === "undefined") return { stop: () => {} };
  if (!("geolocation" in navigator)) {
    onError("Geolocation not supported.");
    return { stop: () => {} };
  }

  const id = navigator.geolocation.watchPosition(
    (pos) => onUpdate({ lat: pos.coords.latitude, lng: pos.coords.longitude }, pos.coords.accuracy),
    (err) => onError(err.message || "Could not get location."),
    options ?? { enableHighAccuracy: true, timeout: 10000, maximumAge: 15_000 }
  );

  return { stop: () => navigator.geolocation.clearWatch(id) };
}

/**
 * Helper to push GPS state into MapProvider without importing context directly.
 * MapProvider exposes window.__FP_MAP__.setGps(...)
 */
export function pushGpsState(coords: LatLng | null, accuracy: number | null, error: string | null) {
  // @ts-ignore
  const api = typeof window !== "undefined" ? window.__FP_MAP__ : null;
  if (api && typeof api.setGps === "function") api.setGps(coords, accuracy, error);
}

