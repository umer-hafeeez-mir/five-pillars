"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type Geo = { lat: number; lng: number; accuracy?: number };

const KAABA = { lat: 21.4225, lng: 39.8262 };

function clampDeg(d: number) {
  const x = d % 360;
  return x < 0 ? x + 360 : x;
}
function toRad(d: number) {
  return (d * Math.PI) / 180;
}
function toDeg(r: number) {
  return (r * 180) / Math.PI;
}

// Great-circle initial bearing from point A to point B
function bearingDeg(from: Geo, to: Geo) {
  const φ1 = toRad(from.lat);
  const φ2 = toRad(to.lat);
  const Δλ = toRad(to.lng - from.lng);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  return clampDeg(toDeg(Math.atan2(y, x)));
}

// Haversine distance (km)
function distanceKm(from: Geo, to: Geo) {
  const R = 6371;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Compass heading (degrees from North)
function getCompassHeadingFromEvent(e: DeviceOrientationEvent): number | null {
  // @ts-ignore (iOS Safari)
  const ios = typeof e.webkitCompassHeading === "number" ? e.webkitCompassHeading : null;
  if (typeof ios === "number" && isFinite(ios)) return clampDeg(ios);

  // Fallback: alpha exists but may vary across devices
  if (typeof e.alpha === "number" && isFinite(e.alpha)) {
    return clampDeg(360 - e.alpha);
  }

  return null;
}

function formatKm(km: number) {
  if (!isFinite(km)) return "—";
  if (km >= 1000) return `${(km / 1000).toFixed(2)}k km`;
  return `${km.toFixed(1)} km`;
}

function Chip({
  children,
  tone = "neutral"
}: {
  children: React.ReactNode;
  tone?: "neutral" | "good" | "warn";
}) {
  const cls =
    tone === "good"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : tone === "warn"
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : "border-slate-200 bg-slate-50 text-slate-700";
  return (
    <span className={["inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold", cls].join(" ")}>
      {children}
    </span>
  );
}

export default function QiblaCompass() {
  const [geo, setGeo] = useState<Geo | null>(null);
  const [status, setStatus] = useState<
    "idle" | "requesting" | "ready" | "denied" | "unavailable" | "error"
  >("idle");

  const [hasCompass, setHasCompass] = useState(false);
  const [heading, setHeading] = useState<number | null>(null);

  // Smoothed heading
  const animRef = useRef<number | null>(null);
  const [smoothHeading, setSmoothHeading] = useState<number | null>(null);

  const qiblaBearing = useMemo(() => {
    if (!geo) return null;
    return bearingDeg(geo, KAABA);
  }, [geo]);

  const kmToKaaba = useMemo(() => {
    if (!geo) return null;
    return distanceKm(geo, KAABA);
  }, [geo]);

  useEffect(() => {
    if (heading == null) return;

    let prev = smoothHeading ?? heading;

    const tick = () => {
      const target = heading;

      // shortest arc
      let delta = target - prev;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;

      prev = clampDeg(prev + delta * 0.12);
      setSmoothHeading(prev);

      animRef.current = window.requestAnimationFrame(tick);
    };

    animRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (animRef.current) window.cancelAnimationFrame(animRef.current);
      animRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heading]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = (e: DeviceOrientationEvent) => {
      const h = getCompassHeadingFromEvent(e);
      if (h == null) return;
      setHasCompass(true);
      setHeading(h);
    };

    window.addEventListener("deviceorientation", handler, true);
    return () => window.removeEventListener("deviceorientation", handler as any, true);
  }, []);

  const locate = async () => {
    try {
      if (typeof window === "undefined") return;

      if (!navigator.geolocation) {
        setStatus("unavailable");
        return;
      }

      setStatus("requesting");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGeo({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy
          });
          setStatus("ready");
        },
        (err) => {
          if (err.code === err.PERMISSION_DENIED) setStatus("denied");
          else setStatus("error");
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 1000 }
      );
    } catch {
      setStatus("error");
    }
  };

  const displayHeading = hasCompass ? smoothHeading : 0;

  // Needle points to Qibla relative to heading (if compass present)
  const needleRotation = useMemo(() => {
    if (qiblaBearing == null) return 0;
    const h = hasCompass && smoothHeading != null ? smoothHeading : 0;
    return clampDeg(qiblaBearing - h);
  }, [qiblaBearing, hasCompass, smoothHeading]);

  const topLine = useMemo(() => {
    if (!qiblaBearing) return "—";
    return `${Math.round(qiblaBearing)}° from North`;
  }, [qiblaBearing]);

  return (
    <div className="space-y-4">
      {/* Header strip */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 soft-shadow">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">Qibla Direction</div>
            <div className="mt-1 text-xs text-slate-600">{topLine}</div>

            <div className="mt-2 flex flex-wrap gap-2">
              <Chip tone={status === "ready" ? "good" : status === "denied" ? "warn" : "neutral"}>
                {status === "ready"
                  ? `Location acquired${geo?.accuracy ? ` · ±${Math.round(geo.accuracy)}m` : ""}`
                  : status === "requesting"
                  ? "Getting location…"
                  : status === "denied"
                  ? "Location permission denied"
                  : status === "unavailable"
                  ? "Geolocation unavailable"
                  : status === "error"
                  ? "Could not get location"
                  : "Tap Locate me"}
              </Chip>

              <Chip tone={hasCompass ? "good" : "neutral"}>
                {hasCompass ? "Compass active" : "No compass sensor"}
              </Chip>

              {kmToKaaba != null ? <Chip>{formatKm(kmToKaaba)} to Kaaba</Chip> : null}
            </div>
          </div>

          <button
            type="button"
            onClick={locate}
            className={[
              "shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2",
              "text-xs font-semibold text-slate-800 hover:bg-slate-50 transition",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            ].join(" ")}
          >
            Locate me
          </button>
        </div>
      </div>

      {/* Compass card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 soft-shadow">
        {/* ✅ FIX: make dial fill the card nicely */}
        <div className="mx-auto w-full max-w-[520px]">
          <div className="relative aspect-square w-full">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border border-slate-200 bg-white shadow-sm" />
            {/* Soft gradient to make it feel less empty */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white via-slate-50 to-white" />

            {/* Ticks + letters rotate WITH heading so the dial behaves like a compass */}
            <div
              className="absolute inset-0"
              style={{
                transform: `rotate(${-clampDeg(displayHeading ?? 0)}deg)`,
                transition: hasCompass ? "transform 80ms linear" : undefined
              }}
            >
              {/* ticks */}
              {Array.from({ length: 60 }).map((_, i) => {
                const isMajor = i % 5 === 0;
                const isCardinal = i % 15 === 0;

                return (
                  <div
                    key={i}
                    className="absolute left-1/2 top-1/2"
                    style={{
                      transform: `rotate(${i * 6}deg) translateY(-46%)`,
                      transformOrigin: "center"
                    }}
                  >
                    <div
                      className={["rounded-full", isCardinal ? "bg-slate-500" : "bg-slate-300"].join(" ")}
                      style={{
                        width: isCardinal ? 2 : 1,
                        height: isCardinal ? 16 : isMajor ? 11 : 7,
                        transform: "translateX(-50%)"
                      }}
                    />
                  </div>
                );
              })}

              {/* cardinal letters */}
              {[
                { t: "N", deg: 0 },
                { t: "E", deg: 90 },
                { t: "S", deg: 180 },
                { t: "W", deg: 270 }
              ].map((c) => (
                <div
                  key={c.t}
                  className="absolute left-1/2 top-1/2"
                  style={{
                    transform: `rotate(${c.deg}deg) translateY(-40%)`,
                    transformOrigin: "center"
                  }}
                >
                  <div
                    className="text-sm font-bold text-slate-800"
                    style={{
                      transform: `translateX(-50%) rotate(-${c.deg}deg)`
                    }}
                  >
                    {c.t}
                  </div>
                </div>
              ))}
            </div>

            {/* Inner rings */}
            <div className="absolute inset-[10%] rounded-full border border-slate-200/70" />
            <div className="absolute inset-[22%] rounded-full border border-dashed border-slate-200" />

            {/* Center hub */}
            <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-300 bg-white shadow" />
            <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-300" />

            {/* Qibla needle (responsive length!) */}
            <div
              className="absolute inset-0"
              style={{
                transform: `rotate(${needleRotation}deg)`,
                transition: "transform 90ms linear"
              }}
            >
              {/* shaft */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[72%]">
                <div className="relative h-[5px] w-full rounded-full bg-emerald-700 shadow-sm">
                  {/* tail dot */}
                  <div className="absolute left-[-6px] top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-emerald-100 border border-emerald-300" />

                  {/* kaaba tip */}
                  <div className="absolute right-[-10px] top-1/2 -translate-y-1/2">
                    <div className="h-10 w-10 rounded-2xl bg-emerald-700 shadow-md flex items-center justify-center">
                      <span className="text-white text-[12px] font-extrabold">🕋</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Subtle “north reference” line */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="h-[2px] w-[78%] rounded-full bg-slate-200/80" />
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span
                className={[
                  "inline-block h-2 w-2 rounded-full",
                  hasCompass ? "bg-emerald-500" : "bg-slate-300"
                ].join(" ")}
              />
              {hasCompass ? "Compass active (smooth)" : "Works without compass sensors"}
            </div>
            <div className="tabular-nums">{geo ? `${geo.lat.toFixed(5)}, ${geo.lng.toFixed(5)}` : "—"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
