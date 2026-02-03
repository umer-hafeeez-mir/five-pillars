"use client";

import { useState } from "react";

import RitualsSection from "@/components/hajj/sections/RitualsSection";
import NowSection from "@/components/hajj/sections/NowSection";
import DuasSection from "@/components/hajj/sections/DuasSection";
import PracticalSection from "@/components/hajj/sections/PracticalSection";
import ZiyarahSection from "@/components/hajj/sections/ZiyarahSection";
import FoodSection from "@/components/hajj/sections/FoodSection";

type HajjSection = "rituals" | "now" | "duas" | "practical" | "ziyarah" | "food";

const SECTIONS: { key: HajjSection; label: string; hint: string }[] = [
  { key: "rituals", label: "Rituals", hint: "Day-by-day guide" },
  { key: "now", label: "Now", hint: "What to do right now" },
  { key: "duas", label: "Duas", hint: "Arabic + translation" },
  { key: "practical", label: "Practical", hint: "Packing + health" },
  { key: "ziyarah", label: "Ziyarah", hint: "Places & history" },
  { key: "food", label: "Food", hint: "Restaurants & essentials" }
];

export default function HajjHome() {
  const [active, setActive] = useState<HajjSection>("rituals");

  return (
    <div className="space-y-4">
      {/* Sub tabs */}
      <div className="overflow-x-auto">
        <div className="flex gap-2 pb-2">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setActive(s.key)}
              className={[
                "shrink-0 rounded-xl border px-3 py-2 text-sm font-semibold transition",
                active === s.key
                  ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                  : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
              ].join(" ")}
            >
              <div className="leading-tight">{s.label}</div>
              <div className="text-[10px] font-medium text-slate-500">{s.hint}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {active === "rituals" && <RitualsSection />}
      {active === "now" && <NowSection />}
      {active === "duas" && <DuasSection />}
      {active === "practical" && <PracticalSection />}
      {active === "ziyarah" && <ZiyarahSection />}
      {active === "food" && <FoodSection />}
    </div>
  );
}
