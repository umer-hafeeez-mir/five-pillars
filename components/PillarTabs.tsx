"use client";

import { PillarKey, PILLARS_ORDER, PILLARS } from "@/lib/pillars";

export default function PillarTabs({
  active,
  onChange
}: {
  active: PillarKey;
  onChange: (k: PillarKey) => void;
}) {
  return (
    <nav className="mt-2">
      <ul className="flex flex-wrap justify-center gap-2 sm:gap-3">
        {PILLARS_ORDER.map((k) => {
          const isActive = k === active;
          const p = PILLARS[k];

          return (
            <li key={k}>
              <button
                onClick={() => onChange(k)}
                className={[
                  "px-4 py-2 rounded-full text-sm font-medium transition-all",
                  "border",
                  isActive
                    ? "bg-brand-800 border-brand-800 text-white shadow-sm"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                ].join(" ")}
              >
                <span className="block leading-tight">{p.tab}</span>
                <span className="block text-[11px] opacity-80">
                  {p.tabHint}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
