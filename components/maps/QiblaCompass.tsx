"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

const KAABA = { lat: 21.4225, lng: 39.8262 };

function toRad(d: number) {
  return (d * Math.PI) / 180;
}
function toDeg(r: number) {
  return (r * 180) / Math.PI;
}

function bearingGC(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
  const φ1 = toRad(from.lat);
  const φ2 = toRad(to.lat);
  const Δλ = toRad(to.lng - from.lng);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);
  return (toDeg(θ) + 360) % 360;
}

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const φ1 = toRad(a.lat);
  const φ2 = toRad(b.lat);
  const Δφ = toRad(b.lat - a.lat);
  const Δλ = toRad(b.lng - a.lng);

  const s =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

function useSmoothAngle(target: number | null, speed = 0.18) {
  const [angle, setAngle] = useState<number>(target ?? 0);
  const rafRef = useRef<number>();

  useEffect(() => {
    if (target == null) return;

    const animate = () => {
      setAngle(prev => {
        const delta = ((target - prev + 540) % 360) - 180;
        return (prev + delta * speed + 360) % 360;
      });
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, speed]);

  return angle;
}

export default function QiblaCompass() {
  const [loc, setLoc] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [hasCompass, setHasCompass] = useState(false);

  const qiblaBearing = useMemo(() => {
    if (!loc) return null;
    return bearingGC(loc, KAABA);
  }, [loc]);

  const distance = useMemo(() => {
    if (!loc) return null;
    return distanceKm(loc, KAABA);
  }, [loc]);

  const smoothNeedle = useSmoothAngle(qiblaBearing);
  const smoothDial = useSmoothAngle(
    heading != null ? (360 - heading) % 360 : 0,
    0.22
  );

  const locate = () => {
    setError(null);

    if (!navigator.geolocation) {
      setError("Geolocation not supported.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
        setLoc({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        });
      },
      err => {
        setError(
          err.code === 1
            ? "Location blocked. Allow it in Safari → aA → Website Settings → Location."
            : "Unable to get location."
        );
      },
      { enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = (e: DeviceOrientationEvent) => {
      const h = (e as any).webkitCompassHeading ?? e.alpha;
      if (typeof h === "number") {
        setHasCompass(true);
        setHeading((h + 360) % 360);
      }
    };

    window.addEventListener("deviceorientation", handler, true);
    return () => {
      window.removeEventListener("deviceorientation", handler, true);
    };
  }, []);

  return (
    <div className="rounded-2xl bg-white p-5 soft-shadow">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">
            Qibla Direction
          </div>
          <div className="text-sm text-slate-600">
            {qiblaBearing != null
              ? `${Math.round(qiblaBearing)}° from North`
              : "—"}
          </div>
        </div>

        <button
          onClick={locate}
          className="rounded-xl bg-emerald-800 text-white px-4 py-2 text-xs font-semibold"
        >
          Locate me
        </button>
      </div>

      {/* Status */}
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-slate-100 px-3 py-1">
          {loc ? "Location acquired" : "Location not set"}
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-1">
          {hasCompass ? "Compass active" : "No compass sensor"}
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-1">
          {distance ? `${distance.toFixed(0)} km to Kaaba` : "—"}
        </span>
      </div>

      {error && <div className="mt-2 text-xs text-rose-600">{error}</div>}

      {/* Compass */}
      <div className="mt-6 flex justify-center">
        <div className="relative w-[280px] aspect-square">
          {/* Dial */}
          <div
            className="absolute inset-0 rounded-full bg-white border border-slate-200"
            style={{
              transform: `rotate(${smoothDial}deg)`
            }}
          />

          {/* Cardinal letters */}
          <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-800 pointer-events-none">
            <div className="absolute top-4">N</div>
            <div className="absolute right-4">E</div>
            <div className="absolute bottom-4">S</div>
            <div className="absolute left-4">W</div>
          </div>

          {/* Needle */}
          {qiblaBearing != null && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                transform: `rotate(${smoothNeedle}deg)`
              }}
            >
              <div className="relative h-[55%] w-[6px] bg-emerald-700 rounded-full shadow-lg">
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 h-4 w-4 bg-emerald-700 rounded-full" />
              </div>
            </div>
          )}

          {/* Center dot */}
          <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 bg-slate-900 rounded-full" />
        </div>
      </div>
    </div>
  );
}
