
"use client";

import React from "react";

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s7-4.5 7-12a7 7 0 1 0-14 0c0 7.5 7 12 7 12Z" />
      <path d="M12 10.5a2.5 2.5 0 1 0 0.001 0Z" />
    </svg>
  );
}

export default function MapPlaceholder({
  hint
}: {
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700">
          <PinIcon />
        </div>

        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900">Map (coming soon)</div>
          <div className="mt-1 text-sm text-slate-600 leading-relaxed">
            This area will show a lightweight map for key locations and guidance.
            {hint ? <span className="ml-1">{hint}</span> : null}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              onClick={() => {
                // placeholder – later wire to manual selection
                alert("Manual location selection will be added here.");
              }}
            >
              Select location manually
            </button>

            <button
              type="button"
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 transition"
              onClick={() => {
                // placeholder – later wire to geolocation
                alert("Auto location will be added here.");
              }}
            >
              Use my location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
