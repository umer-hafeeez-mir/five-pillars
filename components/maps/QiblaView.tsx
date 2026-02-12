"use client";

import React from "react";

function CompassIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 21a9 9 0 1 0-9-9 9 9 0 0 0 9 9Z" />
      <path d="M16 8l-2 6-6 2 2-6 6-2Z" />
    </svg>
  );
}

export default function QiblaView() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700">
          <CompassIcon />
        </div>

        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900">Qibla (in progress)</div>
          <div className="mt-1 text-sm text-slate-600 leading-relaxed">
            This will show your Qibla direction using your location + device orientation (on supported phones).
          </div>

          <div className="mt-4 grid place-items-center">
            <div className="relative h-40 w-40 rounded-full border border-slate-200 bg-white">
              <div className="absolute inset-0 grid place-items-center text-slate-400 text-xs">
                Compass UI
              </div>
              <div className="absolute inset-0 grid place-items-center">
                <div className="h-16 w-16 rounded-full border border-slate-200 bg-slate-50" />
              </div>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[80%]">
                <div className="h-12 w-12 rotate-45 rounded-md border border-emerald-200 bg-emerald-50" />
              </div>
            </div>

            <div className="mt-3 text-xs text-slate-500 text-center max-w-xs">
              Tip: When enabled, you may need to allow <b>Location</b> and <b>Motion/Compass</b> permissions.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

