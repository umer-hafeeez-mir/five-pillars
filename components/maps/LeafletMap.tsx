"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import type { Map as LeafletMapType } from "leaflet";
import L from "leaflet";

/* ---------------- Marker Icons ---------------- */

// Default marker
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// 🔴 Pulsing user location dot
const UserLocationDotIcon = L.divIcon({
  className: "",
  html: `
    <div class="fp-user-dot-wrap">
      <div class="fp-user-dot"></div>
      <div class="fp-user-dot-pulse"></div>
    </div>
  `,
  iconSize: [18, 18],
  iconAnchor: [9, 9]
});

// ➤ Heading arrow marker (rotates via inline style)
function headingArrowIcon(rotationDeg: number) {
  return L.divIcon({
    className: "",
    html: `
      <div class="fp-heading-arrow" style="transform: rotate(${rotationDeg}deg);">
        <div class="fp-heading-arrow-tip"></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
}

/* ---------------- Types ---------------- */

type MapMarker = {
  id: string;
  title: string;
  description?: string;
  lat: number;
  lng: number;
};

type Props = {
  center: { lat: number; lng: number };
  zoom?: number;
  markers?: MapMarker[];
  height?: number;
};

type UserLoc = {
  lat: number;
  lng: number;
  accuracy: number;
};

/* ---------------- Helpers ---------------- */

function clampDeg(deg: number) {
  const d = deg % 360;
  return d < 0 ? d + 360 : d;
}

// Try to normalize heading from:
// - Geolocation coords.heading (some devices)
// - DeviceOrientation (alpha / webkitCompassHeading)
function useDeviceHeading(enabled: boolean) {
  const [heading, setHeading] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;

    let active = true;

    const onOrientation = (evt: any) => {
      if (!active) return;

      // iOS Safari gives webkitCompassHeading (0..360, where 0 = North)
      if (typeof evt.webkitCompassHeading === "number") {
        setHeading(clampDeg(evt.webkitCompassHeading));
        return;
      }

      // Generic browsers: alpha is 0..360 but direction can vary.
      // We'll treat alpha as "compass-ish" heading for now.
      if (typeof evt.alpha === "number") {
        // Some devices report clockwise from north; good enough for an early access compass.
        setHeading(clampDeg(evt.alpha));
      }
    };

    window.addEventListener("deviceorientationabsolute", onOrientation, true);
    window.addEventListener("deviceorientation", onOrientation, true);

    return () => {
      active = false;
      window.removeEventListener("deviceorientationabsolute", onOrientation, true);
      window.removeEventListener("deviceorientation", onOrientation, true);
    };
  }, [enabled]);

  return heading;
}

/* ---------------- Component ---------------- */

export default function LeafletMap({
  center,
  zoom = 12,
  markers = [],
  height = 260
}: Props) {
  const mapRef = useRef<LeafletMapType | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const [userLocation, setUserLocation] = useState<UserLoc | null>(null);
  const [geoHeading, setGeoHeading] = useState<number | null>(null);
  const [locError, setLocError] = useState<string | null>(null);

  // Use device heading when we have location (makes sense only then)
  const deviceHeading = useDeviceHeading(!!userLocation);

  // Choose best heading source:
  // 1) Geolocation heading (if provided)
  // 2) Device orientation heading
  const heading = geoHeading ?? deviceHeading;

  const mapCenter = useMemo(
    () => [center.lat, center.lng] as [number, number],
    [center.lat, center.lng]
  );

  const flyToUser = (z = 15) => {
    if (!userLocation || !mapRef.current) return;
    mapRef.current.flyTo([userLocation.lat, userLocation.lng], z, { duration: 1.0 });
  };

  const startGeolocationWatch = () => {
    if (typeof window === "undefined") return;
    if (!navigator.geolocation) {
      setLocError("Geolocation not supported.");
      return;
    }

    // Clear old watch
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setLocError(null);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        };

        setUserLocation(coords);

        // Some devices provide heading (degrees from true north)
        if (typeof pos.coords.heading === "number" && !Number.isNaN(pos.coords.heading)) {
          setGeoHeading(clampDeg(pos.coords.heading));
        }

        // First fix: fly to user
        if (mapRef.current) {
          mapRef.current.flyTo([coords.lat, coords.lng], 15, { duration: 1.0 });
        }
      },
      (err) => {
        // Silent-ish but keep a small status
        setLocError(err?.message || "Location permission denied.");
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 15000
      }
    );
  };

  // Auto start watching on mount (no button required for first-time UX)
  useEffect(() => {
    startGeolocationWatch();
    return () => {
      if (typeof window === "undefined") return;
      if (watchIdRef.current != null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Compass rotation: rotate the compass needle to match heading
  const compassRotation = typeof heading === "number" ? clampDeg(heading) : 0;

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white soft-shadow relative">
      {/* Global CSS for pulsing dot + arrow + UI */}
      <style jsx global>{`
        .fp-user-dot-wrap {
          position: relative;
          width: 18px;
          height: 18px;
        }
        .fp-user-dot {
          position: absolute;
          inset: 0;
          background: #e11d48;
          border-radius: 9999px;
          border: 2px solid #ffffff;
          box-shadow: 0 6px 18px rgba(2, 6, 23, 0.22);
          z-index: 2;
        }
        .fp-user-dot-pulse {
          position: absolute;
          inset: -6px;
          background: rgba(225, 29, 72, 0.25);
          border-radius: 9999px;
          animation: fpPulse 1.6s ease-out infinite;
          z-index: 1;
        }
        @keyframes fpPulse {
          0% {
            transform: scale(0.6);
            opacity: 0.8;
          }
          70% {
            transform: scale(1.4);
            opacity: 0.15;
          }
          100% {
            transform: scale(1.6);
            opacity: 0;
          }
        }

        .fp-heading-arrow {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          transform-origin: 50% 50%;
          filter: drop-shadow(0 8px 12px rgba(2, 6, 23, 0.18));
        }
        .fp-heading-arrow-tip {
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-bottom: 14px solid rgba(2, 132, 199, 0.95);
          transform: translateY(-6px);
        }

        .fp-map-ui {
          position: absolute;
          right: 12px;
          top: 12px;
          z-index: 999;
          display: flex;
          flex-direction: column;
          gap: 10px;
          pointer-events: none; /* allow map pan/zoom, enable buttons manually */
        }
        .fp-map-ui > * {
          pointer-events: auto;
        }

        .fp-locate-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: 40px;
          padding: 0 12px;
          border-radius: 9999px;
          border: 1px solid rgb(226 232 240);
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(8px);
          color: rgb(15 23 42);
          font-weight: 700;
          font-size: 13px;
          box-shadow: 0 10px 25px rgba(2, 6, 23, 0.12);
          transition: transform 120ms ease, background 120ms ease;
        }
        .fp-locate-btn:active {
          transform: scale(0.98);
        }

        .fp-compass {
          width: 44px;
          height: 44px;
          border-radius: 9999px;
          border: 1px solid rgb(226 232 240);
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(8px);
          box-shadow: 0 10px 25px rgba(2, 6, 23, 0.12);
          display: grid;
          place-items: center;
          position: relative;
        }
        .fp-compass-needle {
          width: 2px;
          height: 18px;
          background: rgb(15 23 42);
          border-radius: 9999px;
          transform-origin: 50% 85%;
        }
        .fp-compass-n {
          position: absolute;
          top: 4px;
          font-size: 10px;
          font-weight: 800;
          color: rgb(15 23 42);
          opacity: 0.85;
        }
      `}</style>

      {/* Floating UI (inside map corner) */}
      <div className="fp-map-ui">
        <button
          type="button"
          className="fp-locate-btn"
          onClick={() => {
            // Ensure watch is running + fly to current
            if (!userLocation) startGeolocationWatch();
            else flyToUser(15);
          }}
          aria-label="Locate me"
          title="Locate me"
        >
          <span aria-hidden="true">📍</span>
          Locate me
        </button>

        <div className="fp-compass" aria-label="Compass" title="Compass">
          <div className="fp-compass-n">N</div>
          <div
            className="fp-compass-needle"
            style={{ transform: `rotate(${compassRotation}deg)` }}
          />
        </div>
      </div>

      <div style={{ height }}>
        <MapContainer
          center={mapCenter}
          zoom={zoom}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
          whenCreated={(map) => {
            mapRef.current = map;
          }}
        >
          {/* Free OpenStreetMap tiles */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />

          {/* Default markers */}
          {markers.map((m) => (
            <Marker key={m.id} position={[m.lat, m.lng]} icon={DefaultIcon}>
              <Popup>
                <div className="text-sm font-semibold">{m.title}</div>
                {m.description ? (
                  <div className="text-xs text-slate-600 mt-1">{m.description}</div>
                ) : null}
              </Popup>
            </Marker>
          ))}

          {/* 🔴 User location + accuracy circle */}
          {userLocation && (
            <>
              <Marker
                position={[userLocation.lat, userLocation.lng]}
                icon={UserLocationDotIcon}
              >
                <Popup>
                  <div className="text-sm font-semibold">Your location</div>
                  {typeof heading === "number" ? (
                    <div className="text-xs text-slate-600 mt-1">
                      Heading: {Math.round(heading)}°
                    </div>
                  ) : null}
                </Popup>
              </Marker>

              {/* ➤ Heading arrow (only if we have heading) */}
              {typeof heading === "number" && (
                <Marker
                  position={[userLocation.lat, userLocation.lng]}
                  icon={headingArrowIcon(heading)}
                />
              )}

              {/* Accuracy circle */}
              <Circle
                center={[userLocation.lat, userLocation.lng]}
                radius={userLocation.accuracy}
                pathOptions={{
                  color: "#e11d48",
                  fillColor: "#e11d48",
                  fillOpacity: 0.12
                }}
              />
            </>
          )}
        </MapContainer>
      </div>

      {/* Tiny status (optional but helpful) */}
      {locError ? (
        <div className="absolute left-3 bottom-3 z-[999] text-xs font-semibold text-slate-700 bg-white/90 backdrop-blur border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
          Location unavailable: {locError}
        </div>
      ) : null}
    </div>
  );
}
