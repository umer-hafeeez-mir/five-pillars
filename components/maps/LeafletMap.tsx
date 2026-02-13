"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";

const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Simple red dot for "my location"
const UserDotIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width: 14px;
      height: 14px;
      border-radius: 999px;
      background: #ef4444;
      border: 2px solid #ffffff;
      box-shadow: 0 8px 20px rgba(2,6,23,0.25);
    "></div>
  `,
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

type MapMarker = {
  id: string;
  title: string;
  description?: string;
  lat: number;
  lng: number;
};

type SearchResult = {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
};

type LangKey = "en" | "ar" | "ur" | "fr";

const LANGS: { key: LangKey; label: string }[] = [
  { key: "en", label: "EN" },
  { key: "ar", label: "AR" },
  { key: "ur", label: "UR" },
  { key: "fr", label: "FR" }
];

/**
 * Tile strategy:
 * - Wikimedia maps are free and reasonably good for early access.
 * - Language-specific label tiles are not consistently supported across all free providers.
 * - We try language variants; if a variant isn't supported, it will still render (server returns default).
 */
function tileUrlForLang(lang: LangKey) {
  // Wikimedia base tiles:
  // https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png
  // Some deployments accept ?lang=xx (not guaranteed everywhere but harmless).
  return `https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png?lang=${lang}`;
}

function tileAttribution() {
  return `&copy; OpenStreetMap contributors, &copy; Wikimedia`;
}

function FlyTo({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom ?? map.getZoom(), { duration: 0.8 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center[0], center[1], zoom]);
  return null;
}

export default function LeafletMap({
  center,
  zoom = 12,
  markers = [],
  height = 240
}: {
  center: { lat: number; lng: number };
  zoom?: number;
  markers?: MapMarker[];
  height?: number;
}) {
  const mapCenter = useMemo(() => [center.lat, center.lng] as [number, number], [center.lat, center.lng]);

  // --- Expand/collapse ---
  const [isExpanded, setIsExpanded] = useState(false);

  // --- Search (compact button -> bottom sheet) ---
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState<[number, number] | null>(null);
  const debounceRef = useRef<number | null>(null);

  // --- Language switcher ---
  const [langIdx, setLangIdx] = useState(0);
  const lang = LANGS[langIdx]?.key ?? "en";

  // --- Locate me ---
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [locateError, setLocateError] = useState<string | null>(null);

  const runSearch = async (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 3) {
      setResults([]);
      return;
    }

    try {
      setSearching(true);

      // Free search: Nominatim (OSM)
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        trimmed
      )}&limit=8`;

      const res = await fetch(url, {
        headers: {
          // Request results in selected language where possible
          "Accept-Language": lang
        }
      });

      const json = (await res.json()) as SearchResult[];
      setResults(Array.isArray(json) ? json : []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Debounce search
  useEffect(() => {
    if (!searchOpen) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => runSearch(query), 350);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, searchOpen, lang]);

  const pickResult = (r: SearchResult) => {
    const lat = Number(r.lat);
    const lng = Number(r.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    setSelectedCenter([lat, lng]);
    setSearchOpen(false);
  };

  const requestLocation = () => {
    setLocateError(null);

    // Guards (SSR-safe even though this is client component)
    if (typeof window === "undefined" || typeof navigator === "undefined" || !navigator.geolocation) {
      setLocateError("Location is not available on this device/browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = pos.coords.accuracy || 0;

        setUserLoc({ lat, lng, accuracy });
        setSelectedCenter([lat, lng]); // fly to user
      },
      (err) => {
        setLocateError(err?.message || "Unable to access location.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 15000
      }
    );
  };

  const MapUI = ({ mapHeight }: { mapHeight: number | string }) => (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white soft-shadow">
      {/* Floating controls (right side) */}
      <div className="absolute right-3 top-3 z-[500] flex flex-col gap-2">
        {/* Search */}
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="h-10 w-10 rounded-xl border border-slate-200 bg-white/95 backdrop-blur shadow-sm flex items-center justify-center hover:bg-white transition"
          aria-label="Search places"
          title="Search places"
        >
          <span className="text-lg">🔍</span>
        </button>

        {/* Language */}
        <button
          type="button"
          onClick={() => setLangIdx((i) => (i + 1) % LANGS.length)}
          className="h-10 w-10 rounded-xl border border-slate-200 bg-white/95 backdrop-blur shadow-sm flex items-center justify-center hover:bg-white transition"
          aria-label="Map language"
          title={`Map language: ${LANGS[langIdx]?.label ?? "EN"}`}
        >
          <span className="text-[12px] font-bold text-slate-800">🌐</span>
        </button>

        {/* Locate me */}
        <button
          type="button"
          onClick={requestLocation}
          className="h-10 w-10 rounded-xl border border-slate-200 bg-white/95 backdrop-blur shadow-sm flex items-center justify-center hover:bg-white transition"
          aria-label="Locate me"
          title="Locate me"
        >
          <span className="text-lg">📍</span>
        </button>

        {/* Expand */}
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="h-10 w-10 rounded-xl border border-slate-200 bg-white/95 backdrop-blur shadow-sm flex items-center justify-center hover:bg-white transition"
          aria-label="Expand map"
          title="Expand map"
        >
          <span className="text-lg">⛶</span>
        </button>
      </div>

      <div style={{ height: mapHeight }}>
        <MapContainer center={mapCenter} zoom={zoom} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
          <TileLayer key={lang} url={tileUrlForLang(lang)} attribution={tileAttribution()} />

          {/* Fly to selected center (search or locate) */}
          {selectedCenter ? <FlyTo center={selectedCenter} zoom={14} /> : null}

          {/* Default markers */}
          {markers.map((m) => (
            <Marker key={m.id} position={[m.lat, m.lng]} icon={DefaultIcon}>
              <Popup>
                <div className="text-sm font-semibold">{m.title}</div>
                {m.description ? <div className="text-xs text-slate-600 mt-1">{m.description}</div> : null}
              </Popup>
            </Marker>
          ))}

          {/* User location (red dot like Google Maps) */}
          {userLoc ? (
            <>
              <Marker position={[userLoc.lat, userLoc.lng]} icon={UserDotIcon}>
                <Popup>
                  <div className="text-sm font-semibold">Your location</div>
                  <div className="text-xs text-slate-600 mt-1">
                    Accuracy: {Math.round(userLoc.accuracy)}m
                  </div>
                </Popup>
              </Marker>
              {userLoc.accuracy > 0 ? (
                <Circle
                  center={[userLoc.lat, userLoc.lng]}
                  radius={userLoc.accuracy}
                  pathOptions={{
                    color: "#ef4444",
                    fillColor: "#ef4444",
                    fillOpacity: 0.10
                  }}
                />
              ) : null}
            </>
          ) : null}
        </MapContainer>
      </div>

      {/* Tiny error toast for location */}
      {locateError ? (
        <div className="absolute left-3 bottom-3 z-[650] rounded-xl border border-slate-200 bg-white/95 backdrop-blur px-3 py-2 text-xs text-slate-700 shadow-sm">
          {locateError}
        </div>
      ) : null}

      {/* Bottom sheet search */}
      {searchOpen ? (
        <div className="absolute inset-0 z-[600]">
          <button
            type="button"
            className="absolute inset-0 bg-black/20"
            aria-label="Close search"
            onClick={() => setSearchOpen(false)}
          />
          <div className="absolute left-0 right-0 bottom-0 bg-white rounded-t-2xl border-t border-slate-200 shadow-[0_-20px_60px_rgba(2,6,23,0.25)]">
            <div className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-slate-900">Search places</div>
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="text-slate-600 hover:text-slate-900 text-sm font-semibold"
                >
                  Close
                </button>
              </div>

              <div className="mt-3">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search e.g., Masjid, Mina, Arafat…"
                  className="w-full rounded-xl border border-slate-200 px-3 py-3 text-slate-900 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                  autoFocus
                />
                <div className="mt-2 text-xs text-slate-500">
                  {query.trim().length < 3 ? "Type at least 3 characters." : searching ? "Searching…" : " "}
                </div>
              </div>

              {results.length > 0 ? (
                <div className="mt-3 max-h-56 overflow-auto rounded-xl border border-slate-200">
                  {results.map((r) => (
                    <button
                      key={r.place_id}
                      type="button"
                      onClick={() => pickResult(r)}
                      className="w-full text-left px-3 py-3 hover:bg-slate-50 border-b border-slate-200 last:border-b-0"
                    >
                      <div className="text-sm font-semibold text-slate-900 line-clamp-1">{r.display_name}</div>
                      <div className="text-xs text-slate-500 mt-1">Tap to view on map</div>
                    </button>
                  ))}
                </div>
              ) : query.trim().length >= 3 && !searching ? (
                <div className="mt-3 text-sm text-slate-600">No results found.</div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );

  return (
    <>
      {/* Normal */}
      {MapUI({ mapHeight: height })}

      {/* Fullscreen modal */}
      {isExpanded ? (
        <div className="fixed inset-0 z-[9999] bg-black/40">
          <div className="absolute inset-0 p-3 sm:p-6">
            <div className="relative h-full w-full rounded-2xl bg-white overflow-hidden border border-slate-200 shadow-[0_20px_70px_rgba(2,6,23,0.35)]">
              <div className="absolute left-0 right-0 top-0 z-[700] flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white/95 backdrop-blur">
                <div className="text-sm font-semibold text-slate-900">Map</div>
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Collapse
                </button>
              </div>

              <div className="pt-14 h-full">
                {MapUI({ mapHeight: "calc(100vh - 56px - 24px)" })}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
