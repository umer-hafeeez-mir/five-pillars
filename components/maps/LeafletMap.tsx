"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polyline,
  useMap
} from "react-leaflet";
import L, { Map as LeafletMapType } from "leaflet";
import "leaflet/dist/leaflet.css";

/* -------------------------------------------------- */
/* Constants */
/* -------------------------------------------------- */

const KAABA = { lat: 21.422487, lng: 39.826206 }; // Masjid al-Haram

type Lang = "en" | "ar" | "ur";

const I18N: Record<Lang, Record<string, string>> = {
  en: {
    locateMe: "Locate me",
    searchPlaceholder: "Search place (e.g., Mumbai, Masjid al-Haram)…",
    searching: "Searching…",
    noResults: "No results",
    yourLocation: "Your location",
    heading: "Heading",
    qibla: "Qibla",
    qiblaBearing: "Qibla bearing",
    degrees: "°",
    showRoute: "Show line to Kaaba"
  },
  ar: {
    locateMe: "حدِّد موقعي",
    searchPlaceholder: "ابحث عن مكان…",
    searching: "جارٍ البحث…",
    noResults: "لا توجد نتائج",
    yourLocation: "موقعك",
    heading: "الاتجاه",
    qibla: "القبلة",
    qiblaBearing: "زاوية القبلة",
    degrees: "°",
    showRoute: "إظهار الخط إلى الكعبة"
  },
  ur: {
    locateMe: "میرا مقام",
    searchPlaceholder: "جگہ تلاش کریں…",
    searching: "تلاش جاری ہے…",
    noResults: "کوئی نتیجہ نہیں",
    yourLocation: "آپ کا مقام",
    heading: "سمت",
    qibla: "قبلہ",
    qiblaBearing: "قبلہ زاویہ",
    degrees: "°",
    showRoute: "کعبہ تک لائن دکھائیں"
  }
};

/* -------------------------------------------------- */
/* Default Marker Fix */
/* -------------------------------------------------- */

const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

/* -------------------------------------------------- */
/* User Location Red Dot (Pulsing) */
/* -------------------------------------------------- */

const UserLocationDotIcon = L.divIcon({
  className: "",
  html: `
    <div class="relative flex items-center justify-center">
      <span class="absolute inline-flex h-7 w-7 rounded-full bg-red-500 opacity-60 animate-ping"></span>
      <span class="relative inline-flex h-3.5 w-3.5 rounded-full bg-red-600 shadow-[0_0_0_2px_rgba(255,255,255,0.9)]"></span>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

/* -------------------------------------------------- */
/* Heading / Qibla Arrow Icons */
/* -------------------------------------------------- */

function headingArrowIcon(deg: number, color = "#e11d48") {
  return L.divIcon({
    className: "",
    html: `
      <div style="transform: rotate(${deg}deg); transform-origin: center;">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="${color}">
          <path d="M12 2L19 21H12L5 21Z" />
        </svg>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
}

/* -------------------------------------------------- */
/* Helpers: Great-circle bearing (Qibla) */
/* -------------------------------------------------- */

function toRad(d: number) {
  return (d * Math.PI) / 180;
}

function toDeg(r: number) {
  return (r * 180) / Math.PI;
}

// Initial bearing from point A to B (0° = North, clockwise)
function bearingDegrees(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
  const φ1 = toRad(from.lat);
  const φ2 = toRad(to.lat);
  const Δλ = toRad(to.lng - from.lng);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  let θ = toDeg(Math.atan2(y, x));
  θ = (θ + 360) % 360;
  return θ;
}

/* -------------------------------------------------- */
/* Capture Leaflet Map instance */
/* -------------------------------------------------- */

function CaptureMapInstance({ onMap }: { onMap: (map: LeafletMapType) => void }) {
  const map = useMap();
  useEffect(() => onMap(map), [map, onMap]);
  return null;
}

/* -------------------------------------------------- */
/* Types */
/* -------------------------------------------------- */

type MapMarker = {
  id: string;
  lat: number;
  lng: number;

  // Backward compatible
  title?: string;
  description?: string;

  // Optional localized labels
  labels?: Partial<Record<Lang, { title?: string; description?: string }>>;
};

type SearchResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

/* -------------------------------------------------- */
/* Smooth Compass UI */
/* -------------------------------------------------- */

function CompassOverlay({
  heading,
  qiblaBearing,
  lang
}: {
  heading: number | null;
  qiblaBearing: number | null;
  lang: Lang;
}) {
  const t = I18N[lang];

  // Dial rotates opposite to heading (so N stays visually correct)
  const dialRotate = heading == null ? 0 : -heading;

  // Arrow should point to qibla relative to heading (if heading available)
  const arrowRotate =
    heading == null || qiblaBearing == null ? 0 : qiblaBearing - heading;

  return (
    <div className="absolute top-3 left-3 z-[1000]">
      <div className="rounded-2xl border border-slate-200 bg-white/90 backdrop-blur px-3 py-3 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs font-semibold text-slate-700">
            {t.qibla}
          </div>
          <div className="text-[11px] text-slate-500 tabular-nums">
            {qiblaBearing == null ? "—" : `${Math.round(qiblaBearing)}${t.degrees}`}
          </div>
        </div>

        <div className="mt-2 relative h-28 w-28">
          {/* Outer circle */}
          <div className="absolute inset-0 rounded-full border border-slate-200 bg-white" />

          {/* Rotating dial */}
          <div
            className="absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-out"
            style={{ transform: `rotate(${dialRotate}deg)` }}
          >
            {/* N/E/S/W ticks */}
            <div className="absolute top-2 text-[10px] font-bold text-slate-800">N</div>
            <div className="absolute right-2 text-[10px] font-semibold text-slate-600">E</div>
            <div className="absolute bottom-2 text-[10px] font-semibold text-slate-600">S</div>
            <div className="absolute left-2 text-[10px] font-semibold text-slate-600">W</div>

            {/* Tiny tick marks */}
            <div className="absolute inset-0">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute left-1/2 top-1/2"
                  style={{
                    transform: `rotate(${i * 30}deg) translateY(-52px)`,
                    transformOrigin: "center"
                  }}
                >
                  <div className="h-2 w-[2px] bg-slate-300 rounded-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Qibla arrow (smooth) */}
          <div
            className="absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-out"
            style={{ transform: `rotate(${arrowRotate}deg)` }}
          >
            <svg width="38" height="38" viewBox="0 0 24 24" fill="#10b981">
              <path d="M12 2L19 21H12L5 21Z" />
            </svg>
          </div>

          {/* Center dot */}
          <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-800" />
        </div>

        <div className="mt-2 text-[11px] text-slate-500 tabular-nums">
          {heading == null ? "Heading: —" : `${t.heading}: ${Math.round(heading)}${t.degrees}`}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------- */
/* Main LeafletMap */
/* -------------------------------------------------- */

export default function LeafletMap({
  center,
  zoom = 12,
  markers = [],
  height = 260,
  enableSearch = true,
  enableLanguageSwitch = true,
  enableQibla = false
}: {
  center: { lat: number; lng: number };
  zoom?: number;
  markers?: MapMarker[];
  height?: number;

  enableSearch?: boolean;
  enableLanguageSwitch?: boolean;
  enableQibla?: boolean;
}) {
  const mapRef = useRef<LeafletMapType | null>(null);

  const [lang, setLang] = useState<Lang>("en");

  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
  } | null>(null);

  const [heading, setHeading] = useState<number | null>(null);

  const [showLineToKaaba, setShowLineToKaaba] = useState<boolean>(true);

  // Search
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchPin, setSearchPin] = useState<{ lat: number; lng: number; label: string } | null>(null);

  const t = I18N[lang];

  const mapCenter = useMemo(
    () => [center.lat, center.lng] as [number, number],
    [center.lat, center.lng]
  );

  const qiblaBearing = useMemo(() => {
    if (!userLocation) return null;
    return bearingDegrees({ lat: userLocation.lat, lng: userLocation.lng }, KAABA);
  }, [userLocation]);

  /* ---------------- Geolocation ---------------- */

  const locateUser = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;

        setUserLocation({
          lat: latitude,
          lng: longitude,
          accuracy
        });

        if (mapRef.current) {
          mapRef.current.flyTo([latitude, longitude], 16, { duration: 1.2 });
        }
      },
      (err) => {
        console.error(err);
        alert("Unable to retrieve location.");
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  /* ---------------- Device orientation (heading) ---------------- */

  useEffect(() => {
    // keep it safe in SSR: runs only client-side due to "use client"
    const handler = (event: DeviceOrientationEvent) => {
      // alpha: 0..360 (approx) relative to device orientation
      if (typeof event.alpha === "number") {
        setHeading(event.alpha);
      }
    };

    window.addEventListener("deviceorientationabsolute", handler, true);
    window.addEventListener("deviceorientation", handler, true);

    return () => {
      window.removeEventListener("deviceorientationabsolute", handler);
      window.removeEventListener("deviceorientation", handler, true);
    };
  }, []);

  /* ---------------- Search (Nominatim) ---------------- */

  useEffect(() => {
    if (!enableSearch) return;

    const q = query.trim();
    if (q.length < 3) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        setIsSearching(true);

        const url =
          `https://nominatim.openstreetmap.org/search?` +
          `format=json&limit=6&q=${encodeURIComponent(q)}`;

        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            // Hint language for display_name (best-effort)
            "Accept-Language": lang === "ar" ? "ar" : lang === "ur" ? "ur" : "en"
          },
          cache: "no-store"
        });

        const json = (await res.json()) as SearchResult[];
        setResults(Array.isArray(json) ? json : []);
      } catch (e) {
        // ignore aborts
      } finally {
        setIsSearching(false);
      }
    }, 450);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query, lang, enableSearch]);

  const pickResult = (r: SearchResult) => {
    const lat = Number(r.lat);
    const lng = Number(r.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    setSearchPin({ lat, lng, label: r.display_name });
    setResults([]);

    if (mapRef.current) {
      mapRef.current.flyTo([lat, lng], 14, { duration: 1.1 });
    }
  };

  /* ---------------- Marker label resolver ---------------- */

  const resolveLabel = (m: MapMarker) => {
    const localized = m.labels?.[lang];
    return {
      title: localized?.title ?? m.title ?? "",
      description: localized?.description ?? m.description ?? ""
    };
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white soft-shadow">
      <div style={{ height }}>
        <MapContainer
          center={mapCenter}
          zoom={zoom}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />

          <CaptureMapInstance
            onMap={(map) => {
              mapRef.current = map;
            }}
          />

          {/* Default markers */}
          {markers.map((m) => {
            const label = resolveLabel(m);
            return (
              <Marker key={m.id} position={[m.lat, m.lng]} icon={DefaultIcon}>
                <Popup>
                  <div className="text-sm font-semibold">{label.title}</div>
                  {label.description ? (
                    <div className="text-xs text-slate-600 mt-1">{label.description}</div>
                  ) : null}
                </Popup>
              </Marker>
            );
          })}

          {/* Search pin */}
          {searchPin && (
            <Marker position={[searchPin.lat, searchPin.lng]} icon={DefaultIcon}>
              <Popup>
                <div className="text-sm font-semibold">Result</div>
                <div className="text-xs text-slate-600 mt-1">{searchPin.label}</div>
              </Popup>
            </Marker>
          )}

          {/* User location + accuracy + heading arrow */}
          {userLocation && (
            <>
              <Marker position={[userLocation.lat, userLocation.lng]} icon={UserLocationDotIcon}>
                <Popup>
                  <div className="text-sm font-semibold">{t.yourLocation}</div>
                  {heading != null ? (
                    <div className="text-xs text-slate-600 mt-1">
                      {t.heading}: {Math.round(heading)}
                      {t.degrees}
                    </div>
                  ) : null}
                  {enableQibla && qiblaBearing != null ? (
                    <div className="text-xs text-slate-600 mt-1">
                      {t.qiblaBearing}: {Math.round(qiblaBearing)}
                      {t.degrees}
                    </div>
                  ) : null}
                </Popup>
              </Marker>

              {heading != null && (
                <Marker
                  position={[userLocation.lat, userLocation.lng]}
                  icon={headingArrowIcon(heading, "#e11d48")}
                />
              )}

              <Circle
                center={[userLocation.lat, userLocation.lng]}
                radius={userLocation.accuracy}
                pathOptions={{
                  color: "#e11d48",
                  fillColor: "#e11d48",
                  fillOpacity: 0.12
                }}
              />

              {/* Optional Qibla line to Kaaba */}
              {enableQibla && showLineToKaaba ? (
                <Polyline
                  positions={[
                    [userLocation.lat, userLocation.lng],
                    [KAABA.lat, KAABA.lng]
                  ]}
                  pathOptions={{ color: "#10b981", weight: 3, opacity: 0.8 }}
                />
              ) : null}
            </>
          )}
        </MapContainer>
      </div>

      {/* Smooth Compass UI (Qibla mode) */}
      {enableQibla ? (
        <CompassOverlay heading={heading} qiblaBearing={qiblaBearing} lang={lang} />
      ) : null}

      {/* Language switcher */}
      {enableLanguageSwitch ? (
        <div className="absolute top-3 right-3 z-[1000]">
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as Lang)}
            className="rounded-xl border border-slate-200 bg-white/90 backdrop-blur px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm"
            aria-label="Language"
          >
            <option value="en">English</option>
            <option value="ar">العربية</option>
            <option value="ur">اردو</option>
          </select>
        </div>
      ) : null}

      {/* Search box */}
      {enableSearch ? (
        <div className="absolute left-3 right-3 bottom-3 z-[1000]">
          <div className="rounded-2xl border border-slate-200 bg-white/90 backdrop-blur p-3 shadow-sm">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
            />

            <div className="mt-2 flex items-center justify-between gap-3">
              <button
                onClick={locateUser}
                className="rounded-xl bg-white border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition"
              >
                {t.locateMe}
              </button>

              {enableQibla && userLocation ? (
                <button
                  onClick={() => setShowLineToKaaba((s) => !s)}
                  className="rounded-xl bg-white border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition"
                >
                  {t.showRoute}
                </button>
              ) : (
                <span className="text-xs text-slate-500">
                  {isSearching ? t.searching : ""}
                </span>
              )}
            </div>

            {/* Results */}
            {results.length > 0 ? (
              <div className="mt-2 max-h-44 overflow-auto rounded-xl border border-slate-200 bg-white">
                {results.map((r) => (
                  <button
                    key={r.place_id}
                    type="button"
                    onClick={() => pickResult(r)}
                    className="w-full text-left px-3 py-2 text-sm text-slate-800 hover:bg-slate-50 transition border-b border-slate-100 last:border-b-0"
                  >
                    {r.display_name}
                  </button>
                ))}
              </div>
            ) : query.trim().length >= 3 && !isSearching ? (
              <div className="mt-2 text-xs text-slate-500">{t.noResults}</div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
