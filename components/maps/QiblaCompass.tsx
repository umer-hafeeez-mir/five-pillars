// components/maps/QiblaCompass.tsx
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

// Smooth animation helper (small RAF loop)
function useSmoothedAngle(target: number | null, smoothing = 0.18) {
  const [value, setValue] = useState<number>(target ?? 0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (target == null) return;
    const tick = () => {
      setValue((prev) => {
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

function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && (navigator as any).maxTouchPoints > 1);
}

type Props = {
  initialLocation?: { lat: number; lng: number; accuracy?: number } | null;
};

export default function QiblaCompass({ initialLocation = null }: Props) {
  // location
  const [loc, setLoc] = useState<{ lat: number; lng: number; accuracy?: number } | null>(initialLocation);
  const [status, setStatus] = useState<"idle" | "locating" | "ready" | "error">("idle");
  const [err, setErr] = useState<string>("");

  // compass / device heading
  const [hasCompass, setHasCompass] = useState<boolean>(false);
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);

  // computed qibla
  const qiblaBearing = useMemo(() => (loc ? bearingGC({ lat: loc.lat, lng: loc.lng }, KAABA) : null), [loc]);
  const kmToKaaba = useMemo(() => (loc ? distanceKm({ lat: loc.lat, lng: loc.lng }, KAABA) : null), [loc]);

  // smoothing
  const smoothedQibla = useSmoothedAngle(qiblaBearing, 0.18);
  const smoothedHeading = useSmoothedAngle(deviceHeading, 0.20);

  // refs for watchPosition
  const watchIdRef = useRef<number | null>(null);

  // try to obtain a location
  const locate = async () => {
    setErr("");
    setStatus("locating");

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("error");
      setErr("Geolocation not supported in this browser.");
      return;
    }

    // helper to set on success
    const onSuccess = (p: GeolocationPosition) => {
      setLoc({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy });
      setStatus("ready");
    };

    const onError = (e: GeolocationPositionError) => {
      setStatus("error");

      if (e.code === e.PERMISSION_DENIED) {
        // iOS-specific guidance
        if (isIOS()) {
          setErr("Location blocked. Allow it in Safari → aA → Website Settings → Location.");
        } else {
          setErr("Location permission denied. Enable location access in your browser settings.");
        }
      } else if (e.code === e.POSITION_UNAVAILABLE) {
        setErr("Position unavailable. Try moving to a more open area.");
      } else if (e.code === e.TIMEOUT) {
        setErr("Location request timed out. Try again.");
      } else {
        setErr(e.message || "Unable to get location.");
      }
    };

    // First try getCurrentPosition
    try {
      navigator.geolocation.getCurrentPosition(onSuccess, (e) => {
        // fallback to watchPosition for some iOS cases
        onError(e);
        // watch as fallback (sometimes works after permissions change)
        try {
          if (watchIdRef.current == null) {
            const id = navigator.geolocation.watchPosition(
              (p) => {
                onSuccess(p);
                if (watchIdRef.current != null) {
                  navigator.geolocation.clearWatch(watchIdRef.current);
                  watchIdRef.current = null;
                }
              },
              (err2) => {
                // keep the original error if present
                // store the last message
                if (!err) onError(err2);
              },
              { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
            );
            watchIdRef.current = id;
          }
        } catch {}
      }, { enableHighAccuracy: true, maximumAge: 0, timeout: 12000 });
    } catch (e: any) {
      setStatus("error");
      setErr(e?.message || "Unable to get location.");
    }
  };

  // device orientation / compass: request permission on iOS when needed
  const enableCompass = async () => {
    setErr("");
    try {
      const w: any = typeof window !== "undefined" ? window : null;
      const D: any = w?.DeviceOrientationEvent;

      if (D && typeof D.requestPermission === "function") {
        // iOS 13+ flow requires user gesture
        const res = await D.requestPermission();
        if (res !== "granted") {
          setErr("Compass permission not granted. You can still use Qibla without sensors.");
          return;
        }
      }
      // if permission succeeded or not required, flag enabled (listener will pick up)
      setHasCompass(true);
    } catch (e: any) {
      setErr("Compass permission request failed.");
    }
  };

  // listen for device orientation when hasCompass true (best-effort)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (e: DeviceOrientationEvent) => {
      const anyE: any = e;
      const raw = typeof anyE.webkitCompassHeading === "number" ? anyE.webkitCompassHeading : e.alpha;
      if (typeof raw === "number" && Number.isFinite(raw)) {
        // normalize -> degrees from north
        const heading = (raw + 360) % 360;
        setDeviceHeading(heading);
        setHasCompass(true);
      }
    };

    if (hasCompass) {
      // try two events; some browsers emit different ones
      window.addEventListener("deviceorientationabsolute", handler as EventListener, true);
      window.addEventListener("deviceorientation", handler as EventListener, true);
    }

    return () => {
      window.removeEventListener("deviceorientationabsolute", handler as EventListener, true);
      window.removeEventListener("deviceorientation", handler as EventListener, true);
    };
  }, [hasCompass]);

  // cleanup watch on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current != null && typeof navigator !== "undefined" && navigator.geolocation) {
        try {
          navigator.geolocation.clearWatch(watchIdRef.current);
        } catch {}
        watchIdRef.current = null;
      }
    };
  }, []);

  // UI labels
  const bearingText = qiblaBearing == null ? "—" : `${Math.round(qiblaBearing)}° from North`;
  const distanceText = kmToKaaba == null ? "—" : `${kmToKaaba.toFixed(0)} km to Kaaba`;
  const accuracyText = loc?.accuracy != null ? `Accuracy ~${Math.round(loc.accuracy)}m` : "Accuracy —";

  return (
    <div className="space-y-4">
      {/* Header card (responsive) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 soft-shadow">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900">Qibla Direction</div>
            <div className="mt-1 text-sm text-slate-600 min-w-0 truncate">{bearingText}</div>
            <div className="mt-2 flex flex-wrap gap-2 items-center">
              <span
                className={[
                  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                  loc ? "border border-emerald-200 bg-emerald-50 text-emerald-900" : "border border-slate-200 bg-white text-slate-700"
                ].join(" ")}
              >
                {status === "ready" ? `Location acquired · ${accuracyText}` : status === "locating" ? "Locating…" : "Location not set"}
              </span>

              <span
                className={[
                  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                  hasCompass ? "border border-emerald-200 bg-emerald-50 text-emerald-900" : "border border-slate-200 bg-white text-slate-700"
                ].join(" ")}
              >
                {hasCompass ? (deviceHeading != null ? `Heading · ${Math.round(deviceHeading)}°` : "Compass enabled") : "No compass sensor"}
              </span>

              <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                {distanceText}
              </span>
            </div>
          </div>

          {/* controls (wrap on mobile) */}
          <div className="ml-0 flex gap-2 items-center mt-3 sm:mt-0">
            <button
              type="button"
              onClick={locate}
              className="rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white px-3 py-1.5 text-xs font-semibold transition"
            >
              Locate me
            </button>

            <button
              type="button"
              onClick={enableCompass}
              className="rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-900 transition"
            >
              Enable compass
            </button>
          </div>
        </div>

        {err ? <div className="mt-3 text-xs text-rose-700">{err}</div> : null}
      </div>

      {/* Dial card (single frame only) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 soft-shadow">
        <div className="flex items-center justify-center">
          {/* container -> aspect square, responsive */}
          <div className="relative w-[320px] max-w-full aspect-square">
            {/* single subtle outer ring */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                border: "1px solid rgba(15,23,42,0.06)",
                background: "white"
              }}
            />

            {/* rotating compass face according to device heading (if available) */}
            <div
              className="absolute inset-0"
              style={{
                transform: `rotate(${deviceHeading != null ? -smoothedHeading : 0}deg)`,
                transformOrigin: "50% 50%",
                transition: "transform 120ms linear"
              }}
            >
              <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
                {/* outer circle */}
                <circle cx="100" cy="100" r="90" fill="none" stroke="#eef2f7" strokeWidth="2" />

                {/* ticks */}
                {Array.from({ length: 72 }).map((_, i) => {
                  const angle = (i * 5 * Math.PI) / 180;
                  const isMajor = i % 6 === 0; // every 30°
                  const r1 = isMajor ? 82 : 86;
                  const r2 = 90;
                  const x1 = 100 + r1 * Math.sin(angle);
                  const y1 = 100 - r1 * Math.cos(angle);
                  const x2 = 100 + r2 * Math.sin(angle);
                  const y2 = 100 - r2 * Math.cos(angle);
                  return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={isMajor ? "#cbd5e1" : "#e6edf3"} strokeWidth={isMajor ? 1.6 : 1} />;
                })}

                {/* cardinal letters */}
                <text x="100" y="24" textAnchor="middle" fontSize="12" fill="#0f172a" fontWeight="700">
                  N
                </text>
                <text x="176" y="104" textAnchor="middle" fontSize="12" fill="#0f172a" fontWeight="700">
                  E
                </text>
                <text x="100" y="186" textAnchor="middle" fontSize="12" fill="#0f172a" fontWeight="700">
                  S
                </text>
                <text x="24" y="104" textAnchor="middle" fontSize="12" fill="#0f172a" fontWeight="700">
                  W
                </text>

                {/* inner dashed */}
                <circle cx="100" cy="100" r="60" fill="none" stroke="#e6edf3" strokeDasharray="3 4" />
              </svg>
            </div>

            {/* Qibla pointer (green) - doesn't rotate with the face; it points to qibla bearing */}
            {qiblaBearing != null ? (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  transform: `rotate(${smoothedQibla}deg)`,
                  transformOrigin: "50% 50%",
                  transition: "transform 140ms ease-out"
                }}
                aria-hidden
              >
                <div className="relative h-[66%] w-[10px]">
                  {/* shaft */}
                  <div className="absolute left-1/2 -translate-x-1/2 top-0 h-full w-[6px] rounded-full bg-emerald-700 shadow" />
                  {/* tip */}
                  <div className="absolute left-1/2 -translate-x-1/2 -top-1 h-6 w-6 rounded-lg bg-emerald-700 shadow-sm flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-amber-300" />
                  </div>
                  {/* tail */}
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-0 h-3 w-3 rounded-full bg-emerald-200 border border-emerald-300" />
                </div>
              </div>
            ) : null}

            {/* Device heading indicator: always show when we have a heading (thin grey needle) */}
            {deviceHeading != null ? (
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                style={{
                  transform: `rotate(${smoothedHeading}deg)`,
                  transformOrigin: "50% 50%",
                  transition: "transform 120ms linear"
                }}
                aria-hidden
              >
                <div className="relative h-[58%] w-[6px]">
                  <div className="absolute left-1/2 -translate-x-1/2 top-0 h-full w-[2px] rounded bg-slate-400/70" />
                  <div className="absolute left-1/2 -translate-x-1/2 -top-1 h-4 w-4 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-xs text-slate-700">
                    {/* small N marker at the tip of heading needle */}
                    <div className="text-[10px] font-semibold">N</div>
                  </div>
                </div>
              </div>
            ) : null}

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
            {loc ? `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)} · ${accuracyText}` : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}
