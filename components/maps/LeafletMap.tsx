"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import type { Map as LeafletMapType } from "leaflet";
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

type MapMarker = {
  id: string;
  title: string;
  description?: string;
  lat: number;
  lng: number;
};

type Props = {
  center: { lat: number; lng: number };
  zoom?: number;
  markers?: MapMarker[];
  height?: number;
  language?: "en" | "ar" | "ur" | "hi"; // UI language (for our controls/text)
};

export default function LeafletMap({
  center,
  zoom = 12,
  markers = [],
  height = 240,
  language = "en"
}: Props) {
  const mapCenter = useMemo(() => [center.lat, center.lng] as [number, number], [center.lat, center.lng]);

  const mapRef = useRef<LeafletMapType | null>(null);

  const [loc, setLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [locStatus, setLocStatus] = useState<"idle" | "loading" | "denied" | "error">("idle");

  const t = useMemo(() => {
    const dict = {
      en: { useMyLocation: "Use my location", locating: "Locating…", denied: "Location permission denied." },
      ar: { useMyLocation: "استخدم موقعي", locating: "جارٍ تحديد الموقع…", denied: "تم رفض إذن الموقع." },
      ur: { useMyLocation: "میرا مقام استعمال کریں", locating: "مقام معلوم کیا جا رہا ہے…", denied: "لوکیشن کی اجازت نہیں ملی۔" },
      hi: { useMyLocation: "मेरी लोकेशन उपयोग करें", locating: "लोकेशन ढूँढ रहे हैं…", denied: "लोकेशन अनुमति अस्वीकृत।" }
    } as const;
    return dict[language] ?? dict.en;
  }, [language]);

  const flyTo = (lat: number, lng: number, z?: number) => {
    const m = mapRef.current;
    if (!m) return;
    m.flyTo([lat, lng], z ?? Math.max(m.getZoom(), 13), { duration: 0.8 });
  };

  const requestLocation = () => {
    if (typeof window === "undefined") return;
    if (!navigator.geolocation) {
      setLocStatus("error");
      return;
    }

    setLocStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLoc(next);
        setLocStatus("idle");
        flyTo(next.lat, next.lng, 14);
      },
      (err) => {
        if (err.code === 1) setLocStatus("denied");
        else setLocStatus("error");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  // optional: if you want to auto-ask once on mount (I suggest NO; keep it user-triggered)
  useEffect(() => {
    // noop
  }, []);

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white soft-shadow">
      {/* Controls */}
      <div className="px-4 py-3 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={requestLocation}
            className={[
              "inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold transition",
              "border border-slate-200 bg-white hover:bg-slate-50",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            ].join(" ")}
          >
            {locStatus === "loading" ? t.locating : t.useMyLocation}
          </button>

          {locStatus === "denied" ? <div className="text-xs text-amber-700">{t.denied}</div> : null}
        </div>
      </div>

      {/* Map */}
      <div style={{ height }}>
        <MapContainer
          center={mapCenter}
          zoom={zoom}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
          ref={(instance) => {
            // react-leaflet passes the map instance here
            // @ts-ignore
            mapRef.current = instance ?? null;
          }}
        >
          {/* Free tiles (OSM). Great for early access. */}
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />

          {markers.map((m) => (
            <Marker key={m.id} position={[m.lat, m.lng]} icon={DefaultIcon}>
              <Popup>
                <div className="text-sm font-semibold">{m.title}</div>
                {m.description ? <div className="text-xs text-slate-600 mt-1">{m.description}</div> : null}
              </Popup>
            </Marker>
          ))}

          {loc ? (
            <Marker position={[loc.lat, loc.lng]} icon={DefaultIcon}>
              <Popup>
                <div className="text-sm font-semibold">You</div>
                <div className="text-xs text-slate-600 mt-1">
                  {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}
                </div>
              </Popup>
            </Marker>
          ) : null}
        </MapContainer>
      </div>
    </div>
  );
}
