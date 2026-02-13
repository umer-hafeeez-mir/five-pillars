
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type LatLng = { lat: number; lng: number };

const KAABA: LatLng = { lat: 21.422487, lng: 39.826206 };

// ---------- Math helpers ----------
const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

function normalizeDeg(d: number) {
  return ((d % 360) + 360) % 360;
}

function shortestAngleDelta(from: number, to: number) {
  const a = normalizeDeg(from);
  const b = normalizeDeg(to);
  let d = b - a;
  if (d > 180) d -= 360;
  if (d <= -180) d += 360;
  return d;
}

/**
 * Great-circle initial bearing from `from` to `to`.
 * Returns degrees from North, clockwise. (0=N, 90=E)
 */
function bearingGreatCircle(from: LatLng, to: LatLng) {
  const φ1 = toRad(from.lat);
  const φ2 = toRad(to.lat);
  const Δλ = toRad(to.lng - from.lng);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return normalizeDeg(toDeg(Math.atan2(y, x)));
}

function hasWindow() {
  return typeof window !== "undefined";
}

export default function QiblaCompass() {
  const [loc, setLoc] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<string>("Getting your location…");

  // Device heading (0..360 where 0 is North)
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
  const [headingStatus, setHeadingStatus] = useState<string>("");

  // Smooth UI rotation angle for arrow
  const [uiAngle, setUiAngle] = useState<number>(0);
  const rafRef = useRef<number | null>(null);
  const targetRef = useRef<number>(0);

  const qiblaBearing = useMemo(() => {
    if (!loc) return null;
    return bearingGreatCircle({ lat: loc.lat, lng: loc.lng }, KAABA);
  }, [loc]);

  /**
   * If we have device heading:
   *   arrow shows "turn this way" (relative bearing)
   * Else:
   *   arrow points to absolute direction from North (still useful)
   */
  const arrowAngle = useMemo(() => {
    if (qiblaBearing == null) return null;
    if (deviceHeading == null) return qiblaBearing;
    return normalizeDeg(qiblaBearing - deviceHeading);
  }, [qiblaBearing, deviceHeading]);

  const requestLocation = () => {
    if (!hasWindow()) return;

    if (!navigator.geolocation) {
      setGeoStatus("Geolocation not supported on this device/browser.");
      return;
    }

    setGeoStatus("Fetching your location…");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoc({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        });
        setGeoStatus("Location acquired.");
      },
      (err) => {
        setGeoStatus(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Please allow location to use Qibla."
            : "Could not fetch location. Try again."
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 5000 }
    );
  };

  // Ask location once on mount
  useEffect(() => {
    requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Device orientation / heading (best effort, safe for SSR)
  useEffect(() => {
    if (!hasWindow()) return;

    if (!("DeviceOrientationEvent" in window)) {
      setHeadingStatus("Compass not available (device sensors unsupported).");
      return;
    }

    // iOS requires permission via requestPermission()
    // @ts-ignore
    if (typeof window.DeviceOrientationEvent?.requestPermission === "function") {
      setHeadingStatus("Tap “Enable compass” for live heading.");
      return;
    }

    setHeadingStatus("Compass enabled.");

    const handler = (e: DeviceOrientationEvent) => {
      // iOS Safari sometimes provides webkitCompassHeading
      // @ts-ignore
      const iosHeading = typeof e.webkitCompassHeading === "number" ? e.webkitCompassHeading : null;

      const alpha = typeof e.alpha === "number" ? e.alpha : null;

      let h: number | null = null;
      if (iosHeading != null) h = iosHeading;
      else if (alpha != null) h = normalizeDeg(360 - alpha);

      if (h != null && Number.isFinite(h)) setDeviceHeading(h);
    };

    window.addEventListener("deviceorientation", handler, true);
    return () => window.removeEventListener("deviceorientation", handler, true);
  }, []);

  const requestCompassPermission = async () => {
    if (!hasWindow()) return;

    try {
      // @ts-ignore
      const req = window.DeviceOrientationEvent?.requestPermission;
      if (typeof req !== "function") {
        setHeadingStatus("Compass already enabled (or not required).");
        return;
      }

      // @ts-ignore
      const res = await req();
      if (res !== "granted") {
        setHeadingStatus("Compass permission denied.");
        return;
      }

      setHeadingStatus("Compass enabled.");

      const handler = (e: DeviceOrientationEvent) => {
        // @ts-ignore
        const iosHeading = typeof e.webkitCompassHeading === "number" ? e.webkitCompassHeading : null;
        const alpha = typeof e.alpha === "number" ? e.alpha : null;

        let h: number | null = null;
        if (iosHeading != null) h = iosHeading;
        else if (alpha != null) h = normalizeDeg(360 - alpha);

        if (h != null && Number.isFinite(h)) setDeviceHeading(h);
      };

      window.addEventListener("deviceorientation", handler, true);
      return () => window.removeEventListener("deviceorientation", handler, true);
    } catch {
      setHeadingStatus("Unable to enable compass.");
    }
  };

  // Smoothly animate uiAngle -> arrowAngle
  useEffect(() => {
    if (!hasWindow()) return;
    if (arrowAngle == null) return;

    targetRef.current = arrowAngle;

    const tick = () => {
      setUiAngle((curr) => {
        const target = targetRef.current;
        const delta = shortestAngleDelta(curr, target);
        return normalizeDeg(curr + delta * 0.12); // smoothing
      });

      rafRef.current = window.requestAnimationFrame(tick);
    };

    if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    rafRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    };
  }, [arrowAngle]);

  const directionText = useMemo(() => {
    if (qiblaBearing == null) return "—";
    return `${Math.round(qiblaBearing)}° from North`;
  }, [qiblaBearing]);

  const relativeText = useMemo(() => {
    if (qiblaBearing == null || deviceHeading == null) return null;
    const rel = normalizeDeg(qiblaBearing - deviceHeading);
    return `Turn ${Math.round(rel)}°`;
  }, [qiblaBearing, deviceHeading]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 soft-shadow">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">Qibla Direction</div>
          <div className="mt-1 text-sm text-slate-600">
            {qiblaBearing == null ? "Calculating…" : directionText}
            {relativeText ? <span className="text-slate-500"> · {relativeText}</span> : null}
          </div>
        </div>

        <button
          type="button"
          onClick={requestLocation}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          title="Locate me"
        >
          Locate me
        </button>
      </div>

      <div className="mt-3 text-xs text-slate-500">
        {geoStatus}
        {loc?.accuracy ? ` · Accuracy ~${Math.round(loc.accuracy)}m` : ""}
      </div>

      <div className="mt-4 flex items-center justify-center">
        <div className="relative h-[220px] w-[220px]">
          {/* Ring */}
          <div className="absolute inset-0 rounded-full border border-slate-200 bg-slate-50" />

          {/* N/E/S/W */}
          {["N", "E", "S", "W"].map((d, i) => (
            <div
              key={d}
              className="absolute left-1/2 top-1/2 text-xs font-semibold text-slate-700"
              style={{
                transform: `translate(-50%, -50%) rotate(${i * 90}deg) translateY(-96px) rotate(${-i * 90}deg)`
              }}
            >
              {d}
            </div>
          ))}

          {/* Center dot */}
          <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-900" />

          {/* Qibla arrow */}
          <div
            className="absolute left-1/2 top-1/2 h-[90px] w-[6px] -translate-x-1/2 origin-bottom"
            style={{ transform: `translateX(-50%) translateY(-100%) rotate(${uiAngle}deg)` }}
            aria-label="Qibla arrow"
          >
            <div className="h-full w-full rounded-full bg-emerald-700" />
            <div className="absolute -top-2 left-1/2 h-0 w-0 -translate-x-1/2 border-l-[9px] border-r-[9px] border-b-[14px] border-l-transparent border-r-transparent border-b-emerald-700" />
          </div>

          <div className="absolute inset-x-0 -bottom-7 text-center text-xs text-slate-500">
            {deviceHeading == null ? "Works without compass sensors" : "Live compass active"}
          </div>
        </div>
      </div>

      {/* iOS permission CTA */}
      {headingStatus.includes("Enable compass") ? (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
          <div className="text-xs text-amber-900">Enable motion/compass permission for live heading.</div>
          <button
            type="button"
            onClick={requestCompassPermission}
            className="rounded-lg bg-amber-900 text-white px-3 py-1.5 text-xs font-semibold hover:bg-amber-950 transition"
          >
            Enable compass
          </button>
        </div>
      ) : headingStatus ? (
        <div className="mt-3 text-xs text-slate-500">{headingStatus}</div>
      ) : null}

      {loc ? (
        <div className="mt-3 text-xs text-slate-500">
          Your location: {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}
        </div>
      ) : null}
    </div>
  );
}
