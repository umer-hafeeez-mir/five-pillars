"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import type { Map as LeafletMapType } from "leaflet";
import L from "leaflet";

/* ---------------- Marker Icons ---------------- */

// Default marker
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// 🔴 User location red dot (Google-style)
const UserLocationIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width:14px;
      height:14px;
      background:#e11d48;
      border-radius:50%;
      border:2px solid white;
      box-shadow:0 0 0 4px rgba(225,29,72,0.25);
    "></div>
  `,
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

/* ---------------- Types ---------------- */

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
};

/* ---------------- Component ---------------- */

export default function LeafletMap({
  center,
  zoom = 12,
  markers = [],
  height = 260
}: Props) {
  const mapRef = useRef<LeafletMapType | null>(null);

  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
  } | null>(null);

  const mapCenter = useMemo(
    () => [center.lat, center.lng] as [number, number],
    [center.lat, center.lng]
  );

  /* ---------------- Auto-detect user location ---------------- */

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        };

        setUserLocation(coords);

        // Smooth fly to user
        if (mapRef.current) {
          mapRef.current.flyTo([coords.lat, coords.lng], 14, {
            duration: 1.2
          });
        }
      },
      () => {
        // Silently fail (permission denied etc.)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );
  }, []);

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white soft-shadow">
      <div style={{ height }}>
        <MapContainer
          center={mapCenter}
          zoom={zoom}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
          whenCreated={(map) => {
            mapRef.current = map;
          }}
        >
          {/* Free OpenStreetMap tiles */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />

          {/* Default markers */}
          {markers.map((m) => (
            <Marker key={m.id} position={[m.lat, m.lng]} icon={DefaultIcon}>
              <Popup>
                <div className="text-sm font-semibold">{m.title}</div>
                {m.description ? (
                  <div className="text-xs text-slate-600 mt-1">{m.description}</div>
                ) : null}
              </Popup>
            </Marker>
          ))}

          {/* 🔴 User location marker */}
          {userLocation && (
            <>
              <Marker
                position={[userLocation.lat, userLocation.lng]}
                icon={UserLocationIcon}
              >
                <Popup>
                  <div className="text-sm font-semibold">Your location</div>
                </Popup>
              </Marker>

              {/* Accuracy circle */}
              <Circle
                center={[userLocation.lat, userLocation.lng]}
                radius={userLocation.accuracy}
                pathOptions={{
                  color: "#e11d48",
                  fillColor: "#e11d48",
                  fillOpacity: 0.15
                }}
              />
            </>
          )}
        </MapContainer>
      </div>
    </div>
  );
}
