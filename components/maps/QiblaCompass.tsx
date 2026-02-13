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

// Try to get compass heading (degrees from North)
function getCompassHeadingFromEvent(e: DeviceOrientationEvent): number | null {
  // iOS Safari sometimes exposes webkitCompassHeading
  // @ts-ignore
  const ios = typeof e.webkitCompassHeading === "number" ? e.webkitCompassHeading : null;
  if (typeof ios === "number" && isFinite(ios)) return clampDeg(ios);

  // Some browsers expose alpha where 0 = North, but it depends on screen orientation
  // We keep it simple; if alpha exists, use it as a fallback (may be imperfect on some devices)
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

  // Smooth animation state
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

  // Smoothly animate heading changes (prevents jumpy compass)
  useEffect(() => {
    if (heading == null) return;

    let prev = smoothHeading ?? heading;

    const tick = () => {
      // shortest rotation direction
      const target = heading;
      let delta = target - prev;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;

      prev = clampDeg(prev + delta * 0.12); // smoothing factor
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

  // Compass sensor hookup
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

  // If we do not have compass heading, compass still works as “bearing from North”
  const displayHeading = hasCompass ? smoothHeading : 0; // rotate dial only if compass exists
  const needleRotation = useMemo(() => {
    if (qiblaBearing == null) return 0;
    // if we have compass, needle should rotate relative to device heading
    // else, just point to bearing from North
    const h = hasCompass && smoothHeading != null ? smoothHeading : 0;
    return clampDeg(qiblaBearing - h);
  }, [qiblaBearing, hasCompass, smoothHeading]);

  const topLine = useMemo(() => {
    if (!qiblaBearing) return "—";
    const deg = Math.round(qiblaBearing);
    return `${deg}° from North`;
  }, [qiblaBearing]);

  return (
    <div className="space-y-4">
      {/* Header card (compact) */}
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
                {hasCompass ? "Compass sensor" : "No compass sensor"}
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

      {/* Compass */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 soft-shadow">
        <div className="mx-auto max-w-[360px]">
          <div className="relative aspect-square w-full">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border border-slate-200 bg-white shadow-sm" />

            {/* Ticks + labels rotate with heading (so “N” stays at top visually when compass is available) */}
            <div
              className="absolute inset-0"
              style={{
                transform: `rotate(${-clampDeg(displayHeading ?? 0)}deg)`,
                transition: hasCompass ? "transform 80ms linear" : undefined
              }}
            >
              {/* ticks */}
              <div className="absolute inset-0 rounded-full">
                {Array.from({ length: 60 }).map((_, i) => {
                  const isMajor = i % 5 === 0;
                  const isCardinal = i % 15 === 0;
                  const len = isCardinal ? 14 : isMajor ? 10 : 6;
                  return (
                    <div
                      key={i}
                      className="absolute left-1/2 top-1/2"
                      style={{
                        transform: `rotate(${i * 6}deg) translateY(-48%)`,
                        transformOrigin: "center"
                      }}
                    >
                      <div
                        className="rounded-full bg-slate-300"
                        style={{
                          width: isCardinal ? 2 : 1,
                          height: len,
                          transform: "translateX(-50%)"
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Cardinal letters */}
              {[
                { t: "N", deg: 0 },
                { t: "E", deg: 90 },
                { t: "S", deg: 180 },
                { t: "W", deg: 270 }
              ].map((c) => (
                <div
                  key={c.t}
                  className="absolute left-1/2 top-1/2"
                  style={{ transform: `rotate(${c.deg}deg) translateY(-46%)` }}
                >
                  <div
                    className="text-xs font-semibold text-slate-700"
                    style={{ transform: "translateX(-50%) rotate(-" + c.deg + "deg)" }}
                  >
                    {c.t}
                  </div>
                </div>
              ))}
            </div>

            {/* Center hub */}
            <div className="absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-300 bg-white shadow" />

            {/* Subtle north reference needle */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative h-[2px] w-[68%] bg-slate-200 rounded-full">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-slate-300" />
              </div>
            </div>

            {/* Qibla needle */}
            <div
              className="absolute inset-0"
              style={{
                transform: `rotate(${needleRotation}deg)`,
                transition: "transform 90ms linear"
              }}
            >
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                {/* Needle shaft */}
                <div className="relative">
                  <div className="h-[4px] w-[240px] rounded-full bg-emerald-700 shadow-sm" />
                  {/* Kaaba tip */}
                  <div className="absolute right-[-2px] top-1/2 -translate-y-1/2">
                    <div className="h-8 w-8 rounded-xl bg-emerald-700 shadow-md flex items-center justify-center">
                      <span className="text-white text-[10px] font-extrabold">🕋</span>
                    </div>
                  </div>
                  {/* Tail dot */}
                  <div className="absolute left-[-3px] top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-emerald-200 border border-emerald-300" />
                </div>
              </div>
            </div>

            {/* Inner circle */}
            <div className="absolute inset-[14%] rounded-full border border-dashed border-slate-200" />
          </div>

          {/* Footer hint */}
          <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className={["inline-block h-2 w-2 rounded-full", hasCompass ? "bg-emerald-500" : "bg-slate-300"].join(" ")} />
              {hasCompass ? "Compass active (smooth)" : "Works without compass sensors"}
            </div>
            <div className="tabular-nums">
              {geo ? `${geo.lat.toFixed(5)}, ${geo.lng.toFixed(5)}` : "—"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
