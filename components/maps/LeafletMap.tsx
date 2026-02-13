"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

// Leaflet CSS must be included somewhere globally (usually in app/layout.tsx)
// import "leaflet/dist/leaflet.css";

const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
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

  const runSearch = async (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 3) {
      setResults([]);
      return;
    }

    try {
      setSearching(true);

      // Free search provider: Nominatim (OpenStreetMap)
      // NOTE: For production, add a small delay + user-agent policy compliance
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        trimmed
      )}&limit=8`;

      const res = await fetch(url, {
        headers: {
          // Nominatim asks for identifying UA/email in heavier use.
          // Keep minimal for now; if throttled, we can proxy via your /api route.
          "Accept-Language": "en"
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
  }, [query, searchOpen]);

  const pickResult = (r: SearchResult) => {
    const lat = Number(r.lat);
    const lng = Number(r.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    setSelectedCenter([lat, lng]);
    setSearchOpen(false); // ✅ collapse search so map is visible
  };

  // Shared map UI (used for normal and expanded)
  const MapUI = ({ mapHeight }: { mapHeight: number | string }) => (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white soft-shadow">
      {/* Floating controls */}
      <div className="absolute right-3 top-3 z-[500] flex flex-col gap-2">
        {/* Search button */}
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="h-10 w-10 rounded-xl border border-slate-200 bg-white/95 backdrop-blur shadow-sm flex items-center justify-center hover:bg-white transition"
          aria-label="Search places"
          title="Search places"
        >
          <span className="text-lg">🔍</span>
        </button>

        {/* Expand button */}
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
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />

          {/* Fly to selected search result */}
          {selectedCenter ? <FlyTo center={selectedCenter} zoom={14} /> : null}

          {/* Markers */}
          {markers.map((m) => (
            <Marker key={m.id} position={[m.lat, m.lng]} icon={DefaultIcon}>
              <Popup>
                <div className="text-sm font-semibold">{m.title}</div>
                {m.description ? <div className="text-xs text-slate-600 mt-1">{m.description}</div> : null}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Bottom sheet search */}
      {searchOpen ? (
        <div className="absolute inset-0 z-[600]">
          {/* backdrop */}
          <button
            type="button"
            className="absolute inset-0 bg-black/20"
            aria-label="Close search"
            onClick={() => setSearchOpen(false)}
          />
          {/* sheet */}
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
      {/* Normal size */}
      {MapUI({ mapHeight: height })}

      {/* Fullscreen modal */}
      {isExpanded ? (
        <div className="fixed inset-0 z-[9999] bg-black/40">
          <div className="absolute inset-0 p-3 sm:p-6">
            <div className="relative h-full w-full rounded-2xl bg-white overflow-hidden border border-slate-200 shadow-[0_20px_70px_rgba(2,6,23,0.35)]">
              {/* top bar */}
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
