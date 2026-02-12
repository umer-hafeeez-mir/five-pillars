"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap
} from "react-leaflet";
import L, { Map as LeafletMapType } from "leaflet";
import "leaflet/dist/leaflet.css";

/* -------------------------------------------------- */
/* Default Marker Fix (Next.js + Leaflet issue) */
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
      <span class="absolute inline-flex h-6 w-6 rounded-full bg-red-500 opacity-75 animate-ping"></span>
      <span class="relative inline-flex h-3 w-3 rounded-full bg-red-600"></span>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

/* -------------------------------------------------- */
/* Heading Arrow */
/* -------------------------------------------------- */

function headingArrowIcon(deg: number) {
  return L.divIcon({
    className: "",
    html: `
      <div style="transform: rotate(${deg}deg);">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="red">
          <path d="M12 2L19 21H12L5 21Z" />
        </svg>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
}

/* -------------------------------------------------- */
/* Capture Leaflet Map Instance Safely */
/* -------------------------------------------------- */

function CaptureMapInstance({
  onMap
}: {
  onMap: (map: LeafletMapType) => void;
}) {
  const map = useMap();

  useEffect(() => {
    onMap(map);
  }, [map, onMap]);

  return null;
}

/* -------------------------------------------------- */
/* Types */
/* -------------------------------------------------- */

type MapMarker = {
  id: string;
  title: string;
  description?: string;
  lat: number;
  lng: number;
};

/* -------------------------------------------------- */
/* Main Component */
/* -------------------------------------------------- */

export default function LeafletMap({
  center,
  zoom = 12,
  markers = [],
  height = 260
}: {
  center: { lat: number; lng: number };
  zoom?: number;
  markers?: MapMarker[];
  height?: number;
}) {
  const mapRef = useRef<LeafletMapType | null>(null);

  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
  } | null>(null);

  const [heading, setHeading] = useState<number | null>(null);

  const mapCenter = useMemo(
    () => [center.lat, center.lng] as [number, number],
    [center.lat, center.lng]
  );

  /* -------------------------------------------------- */
  /* Geolocation Logic */
  /* -------------------------------------------------- */

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
          mapRef.current.flyTo([latitude, longitude], 16, {
            duration: 1.2
          });
        }
      },
      (err) => {
        alert("Unable to retrieve location.");
        console.error(err);
      },
      { enableHighAccuracy: true }
    );
  };

  /* -------------------------------------------------- */
  /* Compass / Device Orientation */
  /* -------------------------------------------------- */

  useEffect(() => {
    const handler = (event: DeviceOrientationEvent) => {
      if (event.alpha != null) {
        setHeading(event.alpha);
      }
    };

    window.addEventListener("deviceorientationabsolute", handler, true);
    window.addEventListener("deviceorientation", handler, true);

    return () => {
      window.removeEventListener("deviceorientationabsolute", handler);
      window.removeEventListener("deviceorientation", handler);
    };
  }, []);

  /* -------------------------------------------------- */
  /* Render */
/* -------------------------------------------------- */

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
          {markers.map((m) => (
            <Marker
              key={m.id}
              position={[m.lat, m.lng]}
              icon={DefaultIcon}
            >
              <Popup>
                <div className="text-sm font-semibold">{m.title}</div>
                {m.description ? (
                  <div className="text-xs text-slate-600 mt-1">
                    {m.description}
                  </div>
                ) : null}
              </Popup>
            </Marker>
          ))}

          {/* User location */}
          {userLocation && (
            <>
              <Marker
                position={[userLocation.lat, userLocation.lng]}
                icon={UserLocationDotIcon}
              >
                <Popup>
                  <div className="text-sm font-semibold">
                    Your location
                  </div>
                  {heading != null && (
                    <div className="text-xs text-slate-600 mt-1">
                      Heading: {Math.round(heading)}°
                    </div>
                  )}
                </Popup>
              </Marker>

              {heading != null && (
                <Marker
                  position={[userLocation.lat, userLocation.lng]}
                  icon={headingArrowIcon(heading)}
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
            </>
          )}
        </MapContainer>
      </div>

      {/* Locate Me Floating Button */}
      <button
        onClick={locateUser}
        className="absolute bottom-4 right-4 z-[1000] rounded-full bg-white border border-slate-200 shadow-md px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition"
      >
        Locate me
      </button>
    </div>
  );
}
