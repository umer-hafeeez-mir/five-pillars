"use client";

import { useMemo, useState } from "react";
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

type HajjDay = {
  day: string; // "8", "9"...
  title: string;
  subtitle?: string;
  steps: string[];
};

const DAYS: HajjDay[] = [
  {
    day: "8",
    title: "8 Dhul Hijjah — Mina (Day of Tarwiyah)",
    subtitle: "Enter Ihram (if Tamattu’) + move to Mina",
    steps: [
      "Make intention for Hajj (if doing Tamattu’).",
      "Enter Ihram and recite Talbiyah.",
      "Go to Mina and pray Dhuhr, Asr, Maghrib, Isha, Fajr (qasr where applicable).",
      "Rest and prepare for Arafat."
    ]
  },
  {
    day: "9",
    title: "9 Dhul Hijjah — Arafat + Muzdalifah",
    subtitle: "The core day of Hajj",
    steps: [
      "After sunrise, go to Arafat.",
      "Pray Dhuhr & Asr (combined) and spend time in dua.",
      "Stay in Arafat until sunset (important).",
      "After Maghrib, go to Muzdalifah.",
      "Pray Maghrib & Isha (combined) and rest; collect pebbles."
    ]
  },
  {
    day: "10",
    title: "10 Dhul Hijjah — Rami + Sacrifice + Hair + Tawaf Ifadah",
    subtitle: "Eid day (major actions)",
    steps: [
      "Go to Mina and stone Jamrat al-Aqabah (big Jamarah).",
      "Offer sacrifice (or ensure it is done via your group).",
      "Shave/trim hair (Halq/Qasr).",
      "Proceed to Haram for Tawaf al-Ifadah (and Sa’i if required).",
      "Return to Mina for the night."
    ]
  },
  {
    day: "11–13",
    title: "Days of Tashreeq — Mina + Rami + Tawaf Wida",
    subtitle: "Complete remaining stoning and farewell",
    steps: [
      "Stone all three Jamarat each day after zawal (time varies by guidance).",
      "Maintain safety and follow group timings.",
      "Before leaving Makkah, perform Tawaf al-Wida (farewell Tawaf)."
    ]
  }
];

type NowLocation = "Mina" | "Arafat" | "Muzdalifah" | "Haram";

const NOW_ACTIONS: Record<NowLocation, { title: string; actions: string[]; reminder?: string }> = {
  Mina: {
    title: "You are in Mina",
    actions: [
      "Confirm your camp location + landmark reference.",
      "Pray on time and rest; conserve energy.",
      "Keep essentials in a small bag (water, ID, charger, meds).",
      "If it’s 8th: prepare for Arafat transfer."
    ],
    reminder: "Tip: Take a photo of your camp number + nearest signboard."
  },
  Arafat: {
    title: "You are in Arafat",
    actions: [
      "Focus on dua — this is the most important day.",
      "Avoid distractions; stay hydrated.",
      "Be mindful of time: do not leave before sunset.",
      "Follow group instructions for combined prayers."
    ],
    reminder: "Keep it simple: lots of sincere dua + dhikr."
  },
  Muzdalifah: {
    title: "You are in Muzdalifah",
    actions: [
      "Pray Maghrib + Isha (combined) as guided.",
      "Rest (even a short sleep helps).",
      "Collect pebbles (as required) safely.",
      "Prepare for Mina and Rami."
    ],
    reminder: "Stay with your group; visibility can be low at night."
  },
  Haram: {
    title: "You are in Haram",
    actions: [
      "If you are doing Tawaf: stay calm, keep your group close.",
      "If you are doing Sa’i: pace yourself and hydrate.",
      "After completion: confirm what comes next (return to Mina / rest).",
      "Avoid overcrowded gates; use calmer access routes where possible."
    ],
    reminder: "If crowded, prioritize safety over pushing to get closer."
  }
};

type DuaItem = {
  id: string;
  title: string;
  arabic: string;
  transliteration: string;
  translation: string;
};

const DUAS: DuaItem[] = [
  {
    id: "talbiyah",
    title: "Talbiyah (Ihram)",
    arabic: "لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ",
    transliteration: "Labbaik Allahumma labbaik, labbaik laa shareeka laka labbaik…",
    translation: "Here I am, O Allah, here I am. Here I am, You have no partner, here I am…"
  },
  {
    id: "arafat",
    title: "Arafat — Dua focus",
    arabic: "لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ",
    transliteration: "Laa ilaaha illallaahu wahdahu laa shareeka lah…",
    translation: "There is no god but Allah alone, without partner…"
  }
];

type PlaceItem = {
  name: string;
  area?: string;
  note: string;
};

const ZIYARAH: PlaceItem[] = [
  { name: "Jabal al-Noor (Cave of Hira)", area: "Makkah", note: "Historical site; optional visit (not part of Hajj)." },
  { name: "Masjid Aisha (Tan’eem)", area: "Makkah", note: "Common miqat point for Umrah; optional." },
  { name: "Masjid Quba", area: "Madinah", note: "Virtuous mosque; optional ziyarah." }
];

const FOOD: Record<string, PlaceItem[]> = {
  Restaurants: [
    { name: "Budget meals near Haram", area: "Makkah", note: "Add curated picks (tags: quick takeaway, open late)." },
    { name: "Desi food cluster", area: "Aziziyah", note: "Useful for South Asian pilgrims." }
  ],
  Groceries: [
    { name: "Supermarkets", area: "Makkah", note: "Add commonly available items + best time to visit." },
    { name: "Pharmacies", area: "Mina/Arafat", note: "Emergency basics + blister care." }
  ]
};

export default function HajjHome() {
  const [active, setActive] = useState<HajjSection>("rituals");
  const [nowLocation, setNowLocation] = useState<NowLocation>("Mina");

  const nowModel = useMemo(() => NOW_ACTIONS[nowLocation], [nowLocation]);

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

      {/* Rituals */}
      {active === "rituals" && (
        <Card title="DAY-BY-DAY (8–13 DHUL HIJJAH)">
          <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
            <p>
              Use this as your simple chronological guide. We’ll keep it concise and offline-first.
            </p>

            <div className="space-y-2">
              {DAYS.map((d) => (
                <Accordion
                  key={d.day}
                  title={`${d.title}${d.subtitle ? " — " + d.subtitle : ""}`}
                >
                  <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600">
                    {d.steps.map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </Accordion>
              ))}
            </div>

            <Accordion title="What we’ll add next (without bloating this)">
              <ul className="list-disc pl-5 space-y-2">
                <li>Types of Hajj (Tamattu’, Qiran, Ifrad)</li>
                <li>Common mistakes to avoid</li>
                <li>Quick “Now mode” shortcuts from each day</li>
              </ul>
            </Accordion>
          </div>
        </Card>
      )}

      {/* Now */}
      {active === "now" && (
        <Card title="NOW MODE — WHAT SHOULD I DO?">
          <div className="text-sm text-slate-600 leading-relaxed space-y-3">
            <p>
              Pick where you are. We’ll keep the instructions short and actionable.
            </p>

            <div className="grid grid-cols-2 gap-2">
              {(["Mina", "Arafat", "Muzdalifah", "Haram"] as NowLocation[]).map((x) => (
                <button
                  key={x}
                  type="button"
                  onClick={() => setNowLocation(x)}
                  className={[
                    "rounded-xl border px-3 py-3 text-sm font-semibold transition text-left",
                    nowLocation === x
                      ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                      : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                  ].join(" ")}
                >
                  {x}
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">{nowModel.title}</div>
              <ul className="mt-2 list-disc pl-5 space-y-2">
                {nowModel.actions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>

              {nowModel.reminder && (
                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                  {nowModel.reminder}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Duas */}
      {active === "duas" && (
        <Card title="DUAS (OFFLINE)">
          <div className="text-sm text-slate-600 leading-relaxed space-y-3">
            <p>
              Short, reliable duas for key moments. Arabic + transliteration + translation.
            </p>

            <div className="space-y-2">
              {DUAS.map((d) => (
                <Accordion key={d.id} title={d.title}>
                  <div className="space-y-3">
                    <div className="text-lg leading-relaxed" dir="rtl">
                      {d.arabic}
                    </div>
                    <div className="text-xs text-slate-500">{d.transliteration}</div>
                    <div className="text-sm">{d.translation}</div>
                  </div>
                </Accordion>
              ))}
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              Later: add audio files in <code className="text-xs">/public/audio</code> and a play button per dua.
            </div>
          </div>
        </Card>
      )}

      {/* Practical */}
      {active === "practical" && (
        <Card title="PRACTICAL (SURVIVAL)">
          <div className="text-sm text-slate-600 leading-relaxed space-y-3">
            <p>
              Next we’ll add packing lists, health tips, bathroom/shower guidance,
              blister/heat advice, and “what to keep accessible in Mina”.
            </p>
            <Accordion title="Suggested first content">
              <ul className="list-disc pl-5 space-y-2">
                <li>Packing essentials</li>
                <li>Heat + hydration checklist</li>
                <li>Blister care</li>
                <li>Documents + emergency contacts</li>
              </ul>
            </Accordion>
          </div>
        </Card>
      )}

      {/* Ziyarah */}
      {active === "ziyarah" && (
        <Card title="ZIYARAH & HISTORY">
          <div className="text-sm text-slate-600 leading-relaxed space-y-3">
            <p>
              Optional places with short historical context (clearly not part of Hajj rituals).
            </p>

            <div className="space-y-2">
              {ZIYARAH.map((p) => (
                <div key={p.name} className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="text-sm font-semibold text-slate-900">{p.name}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {p.area ? `${p.area} · ` : ""}{p.note}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              UX rule: we can avoid surfacing ziyarah prompts during core Hajj days (8–13 Dhul Hijjah).
            </div>
          </div>
        </Card>
      )}

      {/* Food */}
      {active === "food" && (
        <Card title="FOOD & ESSENTIALS">
          <div className="text-sm text-slate-600 leading-relaxed space-y-3">
            <p>
              Curated, utilitarian listings (offline-first). Later we can add photos, tags, and distance.
            </p>

            {Object.entries(FOOD).map(([group, items]) => (
              <Accordion key={group} title={group}>
                <div className="space-y-2">
                  {items.map((p) => (
                    <div key={p.name} className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="text-sm font-semibold text-slate-900">{p.name}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {p.area ? `${p.area} · ` : ""}{p.note}
                      </div>
                    </div>
                  ))}
                </div>
              </Accordion>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
