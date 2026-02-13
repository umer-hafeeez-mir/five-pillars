"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Loc = { lat: number; lng: number; accuracy?: number };

const KAABA = { lat: 21.4225, lng: 39.8262 };

function toRad(d: number) {
  return (d * Math.PI) / 180;
}
function toDeg(r: number) {
  return (r * 180) / Math.PI;
}
function norm360(d: number) {
  const v = d % 360;
  return v < 0 ? v + 360 : v;
}

// Great-circle initial bearing (forward azimuth) from A -> B
function bearingGreatCircle(from: Loc, to: Loc) {
  const φ1 = toRad(from.lat);
  const φ2 = toRad(to.lat);
  const Δλ = toRad(to.lng - from.lng);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return norm360(toDeg(Math.atan2(y, x)));
}

function haversineKm(a: Loc, b: Loc) {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const la1 = toRad(a.lat);
  const la2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(h));
}

function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function formatKm(n: number) {
  if (!Number.isFinite(n)) return "—";
  if (n < 10) return `${n.toFixed(2)} km`;
  if (n < 100) return `${n.toFixed(1)} km`;
  return `${Math.round(n).toLocaleString()} km`;
}

export default function QiblaCompass() {
  const [loc, setLoc] = useState<Loc | null>(null);
  const [locStatus, setLocStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [locError, setLocError] = useState<string | null>(null);

  const [heading, setHeading] = useState<number | null>(null);
  const [compassStatus, setCompassStatus] = useState<"idle" | "enabled" | "denied" | "unsupported">("idle");
  const [compassError, setCompassError] = useState<string | null>(null);

  // Smooth heading (avoid jitter)
  const headingRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const qiblaBearing = useMemo(() => {
    if (!loc) return null;
    return bearingGreatCircle(loc, KAABA);
  }, [loc]);

  const distanceKm = useMemo(() => {
    if (!loc) return null;
    return haversineKm(loc, KAABA);
  }, [loc]);

  const relativeAngle = useMemo(() => {
    // Needle relative to top of phone/dial when heading available
    if (qiblaBearing == null) return null;
    if (heading == null) return qiblaBearing; // fallback: absolute from North (dial fixed)
    return norm360(qiblaBearing - heading);
  }, [qiblaBearing, heading]);

  const locateMe = useCallback(async () => {
    setLocError(null);
    setLocStatus("loading");

    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setLocStatus("error");
      setLocError("Geolocation not supported on this device/browser.");
      return;
    }

    // IMPORTANT for iOS Safari: must be called from user gesture (button click). This function is.
    const getPos = (opts: PositionOptions) =>
      new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, opts);
      });

    try {
      // Try high accuracy first
      const p = await getPos({ enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 });
      const next = { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy };
      setLoc(next);
      setLocStatus("ok");
      return;
    } catch (e1: any) {
      // Retry with lower accuracy, longer timeout (often helps iOS)
      try {
        const p = await getPos({ enableHighAccuracy: false, timeout: 25000, maximumAge: 0 });
        const next = { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy };
        setLoc(next);
        setLocStatus("ok");
        return;
      } catch (e2: any) {
        const msg =
          e2?.code === 1
            ? "Location permission denied. Please allow location for this site in Safari settings."
            : e2?.code === 2
            ? "Location unavailable. Try moving to an open area and try again."
            : e2?.code === 3
            ? "Location request timed out. Try again."
            : e2?.message || "Failed to get location.";

        setLocStatus("error");
        setLocError(msg);
      }
    }
  }, []);

  const enableCompass = useCallback(async () => {
    setCompassError(null);

    if (typeof window === "undefined") return;

    // If no sensor events exist
    const hasDeviceOrientation =
      "DeviceOrientationEvent" in window ||
      "ondeviceorientation" in window ||
      "ondeviceorientationabsolute" in window;

    if (!hasDeviceOrientation) {
      setCompassStatus("unsupported");
      setCompassError("Compass sensors not available.");
      return;
    }

    try {
      // iOS requires explicit permission request via user gesture
      const anyDO = DeviceOrientationEvent as any;
      if (isIOS() && typeof anyDO?.requestPermission === "function") {
        const res = await anyDO.requestPermission();
        if (res !== "granted") {
          setCompassStatus("denied");
          setCompassError("Compass permission denied.");
          return;
        }
      }

      setCompassStatus("enabled");
    } catch (err: any) {
      setCompassStatus("denied");
      setCompassError(err?.message || "Compass permission denied.");
    }
  }, []);

  // Listen for compass updates only when enabled
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (compassStatus !== "enabled") return;

    const onOrientation = (ev: any) => {
      let nextHeading: number | null = null;

      // iOS Safari provides webkitCompassHeading (0..360)
      if (typeof ev?.webkitCompassHeading === "number") {
        nextHeading = ev.webkitCompassHeading;
      } else if (typeof ev?.alpha === "number") {
        // Generic fallback: alpha is rotation around z-axis.
        // Some browsers define alpha as clockwise degrees from north; others differ.
        // We'll use 360 - alpha as a common mapping.
        nextHeading = norm360(360 - ev.alpha);
      }

      if (nextHeading == null || !Number.isFinite(nextHeading)) return;

      // Smoothing using rAF (lerp)
      headingRef.current = nextHeading;

      if (rafRef.current == null) {
        const tick = () => {
          rafRef.current = null;
          const target = headingRef.current;
          if (target == null) return;

          setHeading((prev) => {
            if (prev == null) return target;
            // shortest-path interpolation
            const diff = ((target - prev + 540) % 360) - 180;
            const smoothed = norm360(prev + diff * 0.2); // adjust smoothing factor here
            return smoothed;
          });
        };
        rafRef.current = window.requestAnimationFrame(tick);
      }
    };

    window.addEventListener("deviceorientationabsolute", onOrientation, true);
    window.addEventListener("deviceorientation", onOrientation, true);

    return () => {
      window.removeEventListener("deviceorientationabsolute", onOrientation, true);
      window.removeEventListener("deviceorientation", onOrientation, true);
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [compassStatus]);

  // UI values
  const bearingText = qiblaBearing == null ? "—" : `${Math.round(qiblaBearing)}° from North`;
  const headingText = heading == null ? "—" : `${Math.round(heading)}°`;

  return (
    <div className="space-y-4">
      {/* Top info bar — fewer borders, mobile friendly */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 soft-shadow">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900">Qibla Direction</div>
            <div className="mt-1 text-sm text-slate-600">{bearingText}</div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={[
                  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border",
                  locStatus === "ok"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : "border-slate-200 bg-slate-50 text-slate-700"
                ].join(" ")}
              >
                {locStatus === "ok"
                  ? `Location acquired${loc?.accuracy ? ` · ±${Math.round(loc.accuracy)}m` : ""}`
                  : locStatus === "loading"
                  ? "Getting location…"
                  : "Location not set"}
              </span>

              <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border border-slate-200 bg-slate-50 text-slate-700">
                Heading: {headingText}
              </span>

              <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border border-slate-200 bg-slate-50 text-slate-700">
                {distanceKm == null ? "—" : `${formatKm(distanceKm)} to Kaaba`}
              </span>
            </div>

            {locStatus === "error" && locError ? (
              <div className="mt-2 text-xs font-semibold text-rose-700">{locError}</div>
            ) : null}

            {compassError ? (
              <div className="mt-2 text-xs font-semibold text-amber-700">{compassError}</div>
            ) : null}
          </div>

          {/* Buttons: wrap nicely on mobile, never overflow */}
          <div className="shrink-0 flex flex-col gap-2">
            <button
              type="button"
              onClick={locateMe}
              className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 transition whitespace-nowrap"
            >
              Locate me
            </button>

            <button
              type="button"
              onClick={enableCompass}
              className={[
                "rounded-xl px-3 py-2 text-xs font-semibold transition whitespace-nowrap",
                compassStatus === "enabled"
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
              ].join(" ")}
            >
              {compassStatus === "enabled" ? "Compass enabled" : "Enable compass"}
            </button>
          </div>
        </div>
      </div>

      {/* Compass dial — single clean frame, needle always visible */}
      <div className="rounded-2xl border border-slate-200 bg-white soft-shadow p-4">
        <div className="mx-auto max-w-md">
          <CompassDial
            relativeNeedleAngle={relativeAngle}
            dialRotation={heading == null ? 0 : -heading}
            hasLocation={!!loc}
          />

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-slate-300" />
              Works without compass sensors
            </span>
            <span className="tabular-nums">
              {loc ? `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}` : "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CompassDial({
  relativeNeedleAngle,
  dialRotation,
  hasLocation
}: {
  relativeNeedleAngle: number | null;
  dialRotation: number;
  hasLocation: boolean;
}) {
  // If location not available, keep needle hidden but show dial
  const needleDeg = relativeNeedleAngle == null ? null : relativeNeedleAngle;

  return (
    <div className="relative aspect-square w-full rounded-2xl bg-slate-50 overflow-hidden">
      {/* Soft dial background */}
      <div className="absolute inset-0">
        {/* Outer ring */}
        <div className="absolute inset-4 rounded-full border border-slate-200 bg-white" />
        {/* Inner dotted ring */}
        <div className="absolute inset-[22%] rounded-full border border-dashed border-slate-200" />
      </div>

      {/* Rotate the dial with heading (if compass enabled) */}
      <div
        className="absolute inset-0"
        style={{
          transform: `rotate(${dialRotation}deg)`,
          transition: "transform 180ms ease-out"
        }}
      >
        {/* Cardinal labels */}
        <CardinalLabel pos="top" text="N" emphasis />
        <CardinalLabel pos="right" text="E" />
        <CardinalLabel pos="bottom" text="S" />
        <CardinalLabel pos="left" text="W" />

        {/* Tick marks */}
        <Ticks />
      </div>

      {/* Needle (always on top, not affected by dial rotation) */}
      {hasLocation && needleDeg != null ? (
        <div
          className="absolute inset-0"
          style={{
            transform: `rotate(${needleDeg}deg)`,
            transition: "transform 180ms ease-out"
          }}
        >
          <Needle />
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-xs font-semibold text-slate-500">Set your location to show needle</div>
        </div>
      )}

      {/* Center cap */}
      <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-900/90 ring-4 ring-white" />
    </div>
  );
}

function Needle() {
  // Clean arrow needle: shaft + arrowhead, no extra frames
  return (
    <div className="absolute inset-0">
      {/* shaft */}
      <div className="absolute left-1/2 top-[18%] h-[58%] w-1 -translate-x-1/2 rounded-full bg-emerald-800 shadow-sm" />

      {/* arrowhead */}
      <div className="absolute left-1/2 top-[14%] -translate-x-1/2">
        <div
          className="h-0 w-0"
          style={{
            borderLeft: "10px solid transparent",
            borderRight: "10px solid transparent",
            borderBottom: "18px solid rgb(6 95 70)" // emerald-800
          }}
        />
      </div>

      {/* tail dot */}
      <div className="absolute left-1/2 top-[78%] h-3 w-3 -translate-x-1/2 rounded-full bg-emerald-200 border border-emerald-300" />
    </div>
  );
}

function Ticks() {
  const ticks = Array.from({ length: 60 }).map((_, i) => i); // 6° increments
  return (
    <div className="absolute inset-0">
      {ticks.map((i) => {
        const big = i % 5 === 0; // every 30°
        return (
          <div
            key={i}
            className="absolute left-1/2 top-1/2"
            style={{ transform: `rotate(${i * 6}deg)` }}
          >
            <div
              className={[
                "absolute",
                "-translate-x-1/2",
                big ? "-translate-y-[130px] h-3 w-[2px] bg-slate-300" : "-translate-y-[128px] h-2 w-px bg-slate-200"
              ].join(" ")}
            />
          </div>
        );
      })}
    </div>
  );
}

function CardinalLabel({
  pos,
  text,
  emphasis
}: {
  pos: "top" | "right" | "bottom" | "left";
  text: string;
  emphasis?: boolean;
}) {
  const base =
    "absolute text-sm font-semibold text-slate-700 select-none";
  const emph = emphasis ? "text-slate-900" : "";

  const style =
    pos === "top"
      ? "left-1/2 top-6 -translate-x-1/2"
      : pos === "right"
      ? "right-6 top-1/2 -translate-y-1/2"
      : pos === "bottom"
      ? "left-1/2 bottom-6 -translate-x-1/2"
      : "left-6 top-1/2 -translate-y-1/2";

  return <div className={[base, style, emph].join(" ")}>{text}</div>;
}
