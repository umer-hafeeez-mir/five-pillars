"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import MapsShell from "./MapsShell";
import { PillarKey } from "@/lib/pillars";

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

// Kaaba coords
const KAABA = { lat: 21.4225, lng: 39.8262 };

// ---------- Math helpers ----------
function toRad(d: number) {
  return (d * Math.PI) / 180;
}
function toDeg(r: number) {
  return (r * 180) / Math.PI;
}
function normalizeDeg(d: number) {
  const x = d % 360;
  return x < 0 ? x + 360 : x;
}

/**
 * Great-circle initial bearing from point A to point B (degrees from North).
 */
function bearingGreatCircle(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
  const φ1 = toRad(from.lat);
  const φ2 = toRad(to.lat);
  const Δλ = toRad(to.lng - from.lng);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);

  return normalizeDeg(toDeg(θ));
}

/** Haversine distance in km */
function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371; // km
  const φ1 = toRad(a.lat);
  const φ2 = toRad(b.lat);
  const Δφ = toRad(b.lat - a.lat);
  const Δλ = toRad(b.lng - a.lng);

  const s =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  return R * c;
}

function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && (navigator as any).maxTouchPoints > 1);
}

function formatKm(km: number) {
  if (!Number.isFinite(km)) return "—";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(km >= 100 ? 0 : 1)} km`;
}

function formatAccuracy(m?: number) {
  if (!m || !Number.isFinite(m)) return "—";
  if (m < 1000) return `±${Math.round(m)}m`;
  return `±${(m / 1000).toFixed(1)}km`;
}

// ---------- Compass UI ----------
function QiblaDial({
  qiblaBearingFromNorth,
  heading,
  size = 300
}: {
  qiblaBearingFromNorth: number | null;
  heading: number | null;
  size?: number;
}) {
  // If we have device heading, rotate the dial so "N" matches real-world north.
  // Needle then points to Qibla relative to real-world orientation.
  // dialRotation = -heading
  const dialRotation = typeof heading === "number" ? -heading : 0;

  // Needle should point to qiblaBearingFromNorth relative to north.
  // But if dial is rotated by -heading, needle stays at qiblaBearingFromNorth (relative to north marker).
  const needleRotation = qiblaBearingFromNorth ?? 0;

  const canShowNeedle = typeof qiblaBearingFromNorth === "number";

  return (
    <div className="w-full flex justify-center">
      <div
        className="relative"
        style={{
          width: size,
          height: size
        }}
      >
        {/* Outer card */}
        <div className="absolute inset-0 rounded-3xl border border-slate-200 bg-white soft-shadow" />

        {/* Dial */}
        <div className="absolute inset-0 p-5">
          <div className="relative w-full h-full">
            {/* Dial face */}
            <div
              className="absolute inset-0 rounded-full border border-slate-200 bg-white"
              style={{
                boxShadow: "inset 0 0 0 10px rgba(2,6,23,0.02)"
              }}
            />

            {/* Tick ring + labels rotate with dial (if heading available) */}
            <div
              className="absolute inset-0"
              style={{
                transform: `rotate(${dialRotation}deg)`,
                transition: "transform 300ms ease-out"
              }}
            >
              {/* Ticks */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                {/* outer ring */}
                <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(15,23,42,0.08)" strokeWidth="1.2" />
                {/* inner dashed */}
                <circle
                  cx="50"
                  cy="50"
                  r="30"
                  fill="none"
                  stroke="rgba(15,23,42,0.10)"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />

                {/* ticks */}
                {Array.from({ length: 72 }).map((_, i) => {
                  const a = (i * 360) / 72;
                  const isMajor = i % 6 === 0; // every 30 deg
                  const r1 = isMajor ? 41 : 43.5;
                  const r2 = 46;
                  const x1 = 50 + r1 * Math.sin(toRad(a));
                  const y1 = 50 - r1 * Math.cos(toRad(a));
                  const x2 = 50 + r2 * Math.sin(toRad(a));
                  const y2 = 50 - r2 * Math.cos(toRad(a));
                  return (
                    <line
                      key={i}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={isMajor ? "rgba(15,23,42,0.35)" : "rgba(15,23,42,0.18)"}
                      strokeWidth={isMajor ? 0.8 : 0.5}
                      strokeLinecap="round"
                    />
                  );
                })}
              </svg>

              {/* Cardinal labels */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="absolute top-3 text-sm font-semibold text-slate-900">N</div>
                <div className="absolute right-3 text-sm font-semibold text-slate-900">E</div>
                <div className="absolute bottom-3 text-sm font-semibold text-slate-900">S</div>
                <div className="absolute left-3 text-sm font-semibold text-slate-900">W</div>
              </div>
            </div>

            {/* Needle (does NOT rotate with dial; points to qibla bearing) */}
            {canShowNeedle ? (
              <div
                className="absolute inset-0"
                style={{
                  transform: `rotate(${needleRotation}deg)`,
                  transition: "transform 400ms ease-out"
                }}
              >
                {/* Needle shaft */}
                <div className="absolute left-1/2 top-[14%] -translate-x-1/2 w-[6px] h-[54%] rounded-full bg-emerald-800 shadow-sm" />

                {/* Kaaba head */}
                <div
                  className="absolute left-1/2 top-[10%] -translate-x-1/2 h-10 w-10 rounded-2xl bg-emerald-900 shadow-lg flex items-center justify-center"
                  title="Qibla"
                >
                  <div className="h-5 w-5 rounded-md bg-slate-900 border border-emerald-200/40" />
                </div>

                {/* Center hub */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-slate-900 ring-4 ring-emerald-100" />

                {/* Tail dot */}
                <div className="absolute left-1/2 bottom-[12%] -translate-x-1/2 h-3 w-3 rounded-full bg-emerald-200 ring-4 ring-white shadow" />
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-500">
                Set location to see Qibla
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Main ----------
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

    return {
      title: "Salah",
      subtitle: "Map and Qibla tools",
      center: { lat: 21.4225, lng: 39.8262 },
      zoom: 4,
      markers: [{ id: "kaaba", title: "Kaaba", description: "Qibla direction reference", lat: 21.4225, lng: 39.8262 }] as MapMarker[]
    };
  }, [active]);

  // ---------- Qibla state ----------
  const [loc, setLoc] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [locError, setLocError] = useState<string | null>(null);
  const [lastFixTs, setLastFixTs] = useState<number | null>(null);

  const [heading, setHeading] = useState<number | null>(null);
  const [compassEnabled, setCompassEnabled] = useState<boolean>(false);
  const headingRef = useRef<number | null>(null);

  const qiblaBearing = useMemo(() => {
    if (!loc) return null;
    return bearingGreatCircle({ lat: loc.lat, lng: loc.lng }, KAABA);
  }, [loc]);

  const distanceKm = useMemo(() => {
    if (!loc) return null;
    return haversineKm({ lat: loc.lat, lng: loc.lng }, KAABA);
  }, [loc]);

  // ---------- location action ----------
  async function locateMe() {
    setLocError(null);

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocError("Geolocation is not supported on this device/browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setLoc({ lat: latitude, lng: longitude, accuracy });
        setLastFixTs(Date.now());
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          // iOS + PWA: users expect it under Location Services, but it's usually under Safari website settings
          if (isIOS()) {
            setLocError(
              "Location blocked. On iPhone: open this site in Safari → tap aA → Website Settings → Location → Allow. Then reopen the app."
            );
          } else {
            setLocError("Location permission denied. Please enable location access in your browser settings.");
          }
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setLocError("Position unavailable. Try moving to an open area or turning on GPS.");
        } else if (err.code === err.TIMEOUT) {
          setLocError("Location request timed out. Try again.");
        } else {
          setLocError("Unable to get location. Please try again.");
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }

  // ---------- compass permission (iOS requires user gesture) ----------
  async function enableCompass() {
    setLocError(null);

    try {
      const w = typeof window !== "undefined" ? (window as any) : null;
      const DeviceOrientationEventAny = w?.DeviceOrientationEvent;

      if (DeviceOrientationEventAny?.requestPermission) {
        // iOS Safari
        const res = await DeviceOrientationEventAny.requestPermission();
        if (res !== "granted") {
          setLocError("Compass permission not granted. You can still use Qibla without compass sensors.");
          setCompassEnabled(false);
          return;
        }
      }

      setCompassEnabled(true);
    } catch {
      setLocError("Compass permission request failed. You can still use Qibla without compass sensors.");
      setCompassEnabled(false);
    }
  }

  // Listen to deviceorientation only when enabled
  useEffect(() => {
    if (!compassEnabled) return;
    if (typeof window === "undefined") return;

    const handler = (e: DeviceOrientationEvent) => {
      // iOS often uses webkitCompassHeading; others may use alpha
      const anyE = e as any;
      let h: number | null = null;

      if (typeof anyE.webkitCompassHeading === "number") {
        h = anyE.webkitCompassHeading; // already degrees from North
      } else if (typeof e.alpha === "number") {
        // alpha is 0..360 but interpretation varies; still useful as heading-ish
        h = e.alpha;
      }

      if (typeof h === "number" && Number.isFinite(h)) {
        const nh = normalizeDeg(h);
        headingRef.current = nh;
        setHeading(nh);
      }
    };

    window.addEventListener("deviceorientation", handler, true);
    return () => window.removeEventListener("deviceorientation", handler, true);
  }, [compassEnabled]);

  // ---------- UI ----------
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
          <div className="space-y-4">
            {/* Top info card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 soft-shadow">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Qibla Direction</div>
                  <div className="mt-1 text-sm text-slate-600">
                    {typeof qiblaBearing === "number" ? (
                      <>
                        <span className="font-semibold text-slate-900">{Math.round(qiblaBearing)}°</span>{" "}
                        <span className="text-slate-600">from North</span>
                      </>
                    ) : (
                      "—"
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={locateMe}
                    className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 transition"
                  >
                    Locate me
                  </button>

                  <button
                    type="button"
                    onClick={enableCompass}
                    className="rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-900 transition"
                    title="Enable compass sensors"
                  >
                    Enable compass
                  </button>
                </div>
              </div>

              {/* Pills */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={[
                    "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
                    loc ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-slate-200 bg-white text-slate-700"
                  ].join(" ")}
                >
                  {loc ? `Location acquired · ${formatAccuracy(loc.accuracy)}` : "Location not set"}
                </span>

                <span
                  className={[
                    "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
                    typeof heading === "number"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                      : "border-slate-200 bg-white text-slate-700"
                  ].join(" ")}
                >
                  {typeof heading === "number" ? `Heading · ${Math.round(heading)}°` : "No compass sensor"}
                </span>

                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                  {distanceKm ? `${formatKm(distanceKm)} to Kaaba` : "—"}
                </span>
              </div>

              {locError ? <div className="mt-3 text-xs text-rose-700">{locError}</div> : null}
            </div>

            {/* Dial card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 soft-shadow">
              <QiblaDial qiblaBearingFromNorth={qiblaBearing} heading={heading} size={320} />

              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <div className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-slate-300" />
                  <span>Works without compass sensors</span>
                </div>

                <div className="tabular-nums">
                  {loc ? `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}` : "—"}
                </div>
              </div>

              {lastFixTs ? (
                <div className="mt-2 text-[11px] text-slate-400">
                  Last location fix: {new Date(lastFixTs).toLocaleString()}
                </div>
              ) : null}
            </div>

            {/* Quick iOS hint */}
            {isIOS() ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
                <div className="font-semibold text-slate-800">iPhone tip</div>
                <div className="mt-1">
                  If you tapped “Don’t Allow” earlier, iOS stores that per website. Open the site in Safari → tap{" "}
                  <b>aA</b> → <b>Website Settings</b> → <b>Location</b> → <b>Allow</b>, then reopen this app.
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          // Maps view (Salah + Hajj)
          <LeafletMapClient
            center={config.center}
            zoom={config.zoom}
            markers={config.markers}
            height={260}
          />
        )}
      </MapsShell>
    </div>
  );
}
