"use client";

import React from "react";

type Mode = { key: string; label: string };

export default function MapsShell({
  title,
  subtitle,
  modes,
  activeMode,
  onModeChange,
  children
}: {
  title: string;
  subtitle?: string;
  modes?: Mode[];
  activeMode?: string;
  onModeChange?: (key: string) => void;
  children: React.ReactNode;
}) {
  const hasModes = Array.isArray(modes) && modes.length > 0 && !!activeMode && !!onModeChange;

  return (
    <div className="mt-6 max-w-5xl mx-auto px-4">
      <div className="rounded-2xl border border-slate-200 bg-white soft-shadow overflow-hidden">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-base sm:text-lg font-semibold text-slate-900">{title}</div>
              {subtitle ? <div className="mt-1 text-sm text-slate-500">{subtitle}</div> : null}
            </div>

            {/* Optional segmented control */}
            {hasModes ? (
              <div className="shrink-0">
                <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                  {modes!.map((m) => {
                    const isActive = m.key === activeMode;
                    return (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => onModeChange!(m.key)}
                        className={[
                          "px-3 sm:px-4 py-2 text-sm font-semibold rounded-lg transition",
                          isActive
                            ? "bg-white text-emerald-900 border border-emerald-200 shadow-sm"
                            : "text-slate-700 hover:bg-white"
                        ].join(" ")}
                        aria-pressed={isActive}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Body */}
        <div className="px-4 sm:px-6 py-4">{children}</div>
      </div>
    </div>
  );
}

