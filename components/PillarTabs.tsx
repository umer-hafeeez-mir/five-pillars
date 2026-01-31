
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
    <nav className="border-b border-slate-200">
      <ul className="flex justify-center gap-6 sm:gap-10">
        {PILLARS_ORDER.map((k) => {
          const isActive = k === active;
          const p = PILLARS[k];
          return (
            <li key={k} className="py-2">
              <button onClick={() => onChange(k)} className="group text-center">
                <div
                  className={[
                    "text-sm font-medium",
                    isActive ? "text-brand-800" : "text-slate-500 group-hover:text-slate-700"
                  ].join(" ")}
                >
                  {p.tab}
                </div>
                <div className="text-[11px] text-slate-400">{p.tabHint}</div>
                <div
                  className={[
                    "mt-2 h-[2px] rounded-full transition",
                    isActive ? "bg-brand-800 w-full" : "bg-transparent w-full"
                  ].join(" ")}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
