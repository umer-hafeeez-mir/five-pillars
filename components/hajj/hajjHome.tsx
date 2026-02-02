
"use client";

import { useState } from "react";
import Accordion from "@/components/Accordion";
import Card from "@/components/Card";

type HajjSection =
  | "rituals"
  | "now"
  | "duas"
  | "practical"
  | "ziyarah"
  | "food";

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
      {active === "rituals" && (
        <Card title="DAY-BY-DAY (8–13 DHUL HIJJAH)">
          <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
            <p>
              This section will become your chronological Hajj guide. Next, we’ll add:
              Mina → Arafat → Muzdalifah → Rami → Tawaf Ifadah → Tashreeq days.
            </p>

            <Accordion title="What’s coming next">
              <ul className="list-disc pl-5 space-y-2">
                <li>Types of Hajj (Tamattu’, Qiran, Ifrad)</li>
                <li>What is Fard vs Wajib vs Sunnah (optional)</li>
                <li>Common mistakes to avoid</li>
                <li>“I’m here now — what should I do?” quick actions</li>
              </ul>
            </Accordion>
          </div>
        </Card>
      )}

      {active === "now" && (
        <Card title="I’M HERE NOW — WHAT SHOULD I DO?">
          <div className="text-sm text-slate-600 leading-relaxed space-y-3">
            <p>
              This will become “Now Mode” (super useful during Hajj).
              You’ll click where you are (Mina/Arafat/Muzdalifah/Haram), and it shows the next actions.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {["Mina", "Arafat", "Muzdalifah", "Haram"].map((x) => (
                <button
                  key={x}
                  type="button"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition"
                >
                  {x}
                </button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {active === "duas" && (
        <Card title="DUAS (OFFLINE)">
          <div className="text-sm text-slate-600 leading-relaxed space-y-3">
            <p>
              Next, we’ll add dua cards with Arabic + transliteration + translation.
              Audio can be added later via files in <code className="text-xs">/public</code>.
            </p>
            <Accordion title="Example dua item (placeholder)">
              <div className="space-y-3">
                <div className="text-lg leading-relaxed" dir="rtl">
                  لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ
                </div>
                <div className="text-xs text-slate-500">
                  Labbaik Allahumma labbaik…
                </div>
                <div className="text-sm">
                  “Here I am, O Allah, here I am…”
                </div>
              </div>
            </Accordion>
          </div>
        </Card>
      )}

      {active === "practical" && (
        <Card title="PRACTICAL (SURVIVAL)">
          <div className="text-sm text-slate-600 leading-relaxed space-y-3">
            <p>
              We’ll add packing lists, health tips, bathroom/shower guidance,
              blister/heat advice, and what to keep accessible in Mina.
            </p>
          </div>
        </Card>
      )}

      {active === "ziyarah" && (
        <Card title="ZIYARAH & HISTORY">
          <div className="text-sm text-slate-600 leading-relaxed space-y-3">
            <p>
              We’ll add places to visit with pictures + short historical context,
              clearly marked as optional (not part of Hajj rituals).
            </p>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              UX rule: we can disable prompts during core Hajj days (8–13 Dhul Hijjah).
            </div>
          </div>
        </Card>
      )}

      {active === "food" && (
        <Card title="FOOD & ESSENTIALS">
          <div className="text-sm text-slate-600 leading-relaxed space-y-3">
            <p>
              We’ll add utilitarian listings: restaurants, groceries, pharmacies,
              SIM shops, and “open late” tags.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {["Restaurants", "Groceries", "Pharmacies", "SIM / Shops"].map((x) => (
                <div key={x} className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="text-sm font-semibold text-slate-900">{x}</div>
                  <div className="text-xs text-slate-500 mt-1">Coming soon</div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
