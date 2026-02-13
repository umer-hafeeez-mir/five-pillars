"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

const KAABA = { lat: 21.4225, lng: 39.8262 };

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}
function toDeg(rad: number) {
  return (rad * 180) / Math.PI;
}

// Great-circle initial bearing from point A to B (0..360 from North)
function bearingGC(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
  const φ1 = toRad(from.lat);
  const φ2 = toRad(to.lat);
  const Δλ = toRad(to.lng - from.lng);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);
  return (toDeg(θ) + 360) % 360;
}

// Haversine distance km
function distanceKm(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
  const R = 6371;
  const φ1 = toRad(from.lat);
  const φ2 = toRad(to.lat);
  const Δφ = toRad(to.lat - from.lat);
  const Δλ = toRad(to.lng - from.lng);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Smooth animation helper
function useSmoothedAngle(target: number | null, smoothing = 0.18) {
  const [value, setValue] = useState<number>(target ?? 0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (target == null) return;

    const tick = () => {
      setValue((prev) => {
        // shortest-path interpolation around 360
        const delta = ((target - prev + 540) % 360) - 180;
        return (prev + delta * smoothing + 360) % 360;
      });
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [target, smoothing]);

  return value;
}

type Props = {
  // Optional: pass in already-known location; otherwise user clicks Locate
  initialLocation?: { lat: number; lng: number; accuracy?: number } | null;
};

export default function QiblaCompass({ initialLocation = null }: Props) {
  const [loc, setLoc] = useState<{ lat: number; lng: number; accuracy?: number } | null>(initialLocation);
  const [status, setStatus] = useState<"idle" | "locating" | "ready" | "error">("idle");
  const [err, setErr] = useState<string>("");

  // Optional compass sensor (mobile)
  const [hasCompass, setHasCompass] = useState<boolean>(false);
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);

  // Compute qibla bearing + distance from current location
  const qiblaBearing = useMemo(() => {
    if (!loc) return null;
    return bearingGC({ lat: loc.lat, lng: loc.lng }, KAABA);
  }, [loc]);

  const kmToKaaba = useMemo(() => {
    if (!loc) return null;
    return distanceKm({ lat: loc.lat, lng: loc.lng }, KAABA);
  }, [loc]);

  // Smooth pointer rotation
  const smoothedPointer = useSmoothedAngle(qiblaBearing, 0.18);

  // If we have device heading, rotate dial to act like a compass (North anchored)
  // Dial rotation: -heading (so N stays top as the phone rotates)
  const smoothedDial = useSmoothedAngle(deviceHeading != null ? (360 - deviceHeading) % 360 : 0, 0.22);

  const locate = () => {
    setErr("");
    setStatus("locating");

    if (typeof window === "undefined" || !navigator.geolocation) {
      setStatus("error");
      setErr("Geolocation not supported in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLoc({
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          accuracy: p.coords.accuracy
        });
        setStatus("ready");
      },
      (e) => {
        setStatus("error");
        setErr(e.message || "Unable to fetch location.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Compass sensor (best-effort)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const anyWindow = window as any;

    // iOS permission
    async function maybeRequestIOSPermission() {
      try {
        const D = anyWindow.DeviceOrientationEvent;
        if (D && typeof D.requestPermission === "function") {
          // We only request permission after user interaction in many browsers.
          // We'll not auto-call it here.
          return;
        }
      } catch {}
    }

    maybeRequestIOSPermission();

    const handler = (e: DeviceOrientationEvent) => {
      // alpha is rotation around z-axis (0..360). On many devices this maps to compass heading.
      const alpha = (e as any).webkitCompassHeading ?? e.alpha;

      if (typeof alpha === "number") {
        setHasCompass(true);
        // Normalize
        setDeviceHeading((alpha + 360) % 360);
      }
    };

    window.addEventListener("deviceorientationabsolute", handler as any, true);
    window.addEventListener("deviceorientation", handler as any, true);

    return () => {
      window.removeEventListener("deviceorientationabsolute", handler as any, true);
      window.removeEventListener("deviceorientation", handler as any, true);
    };
  }, []);

  // UI numbers
  const bearingText = qiblaBearing == null ? "—" : `${Math.round(qiblaBearing)}° from North`;
  const distanceText = kmToKaaba == null ? "—" : `${kmToKaaba.toFixed(0)} km to Kaaba`;
  const accuracyText =
    loc?.accuracy != null ? `Accuracy ~${Math.round(loc.accuracy)}m` : "Accuracy —";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 soft-shadow">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">Qibla Direction</div>
          <div className="mt-1 text-sm text-slate-600">{bearingText}</div>
        </div>

        <button
          type="button"
          onClick={locate}
          className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-800 transition"
        >
          Locate me
        </button>
      </div>

      {/* Chips */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900">
          {status === "ready" ? `Location acquired · ${accuracyText}` : status === "locating" ? "Locating…" : "Location not set"}
        </span>

        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
          {hasCompass ? "Compass sensor available" : "No compass sensor"}
        </span>

        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
          {distanceText}
        </span>
      </div>

      {status === "error" ? (
        <div className="mt-2 text-xs text-rose-700">{err}</div>
      ) : null}

      {/* Dial */}
      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-center">
          <div className="relative w-[320px] max-w-full aspect-square">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border border-slate-200 bg-white" />

            {/* Rotating compass face */}
            <div
              className="absolute inset-0"
              style={{
                transform: `rotate(${smoothedDial}deg)`,
                transformOrigin: "50% 50%",
                transition: "transform 120ms linear"
              }}
            >
              {/* ticks + letters */}
              <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
                {/* ticks */}
                {Array.from({ length: 72 }).map((_, i) => {
                  const angle = (i * 5 * Math.PI) / 180;
                  const isMajor = i % 6 === 0; // every 30°
                  const r1 = isMajor ? 92 : 96;
                  const r2 = 100;
                  const x1 = 100 + r1 * Math.sin(angle);
                  const y1 = 100 - r1 * Math.cos(angle);
                  const x2 = 100 + r2 * Math.sin(angle);
                  const y2 = 100 - r2 * Math.cos(angle);
                  return (
                    <line
                      key={i}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={isMajor ? "#cbd5e1" : "#e2e8f0"}
                      strokeWidth={isMajor ? 2 : 1}
                    />
                  );
                })}

                {/* cardinal letters */}
                <text x="100" y="22" textAnchor="middle" fontSize="14" fill="#0f172a" fontWeight="700">
                  N
                </text>
                <text x="180" y="105" textAnchor="middle" fontSize="14" fill="#0f172a" fontWeight="700">
                  E
                </text>
                <text x="100" y="190" textAnchor="middle" fontSize="14" fill="#0f172a" fontWeight="700">
                  S
                </text>
                <text x="20" y="105" textAnchor="middle" fontSize="14" fill="#0f172a" fontWeight="700">
                  W
                </text>

                {/* inner dotted circle */}
                <circle cx="100" cy="100" r="62" fill="none" stroke="#e2e8f0" strokeDasharray="3 4" />
              </svg>
            </div>

            {/* Qibla pointer (does NOT rotate with compass face) */}
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                transform: `rotate(${smoothedPointer}deg)`,
                transformOrigin: "50% 50%",
                transition: "transform 140ms ease-out"
              }}
            >
              <div className="relative h-[70%] w-[10px]">
                {/* needle */}
                <div className="absolute left-1/2 -translate-x-1/2 top-0 h-full w-[6px] rounded-full bg-emerald-700 shadow" />
                {/* tip */}
                <div className="absolute left-1/2 -translate-x-1/2 -top-1 h-5 w-5 rounded-xl bg-emerald-700 shadow-sm flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-amber-300" />
                </div>
                {/* tail */}
                <div className="absolute left-1/2 -translate-x-1/2 bottom-0 h-3 w-3 rounded-full bg-emerald-200 border border-emerald-300" />
              </div>
            </div>

            {/* center dot */}
            <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-900" />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-slate-300" />
            <span>{hasCompass ? "Compass enabled" : "Works without compass sensors"}</span>
          </div>

          <div className="tabular-nums">
            {loc ? `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}` : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}
