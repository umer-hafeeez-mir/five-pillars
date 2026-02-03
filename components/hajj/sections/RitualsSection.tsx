"use client";

import { useState } from "react";
import Card from "@/components/Card";
import Accordion from "@/components/Accordion";
import { RITUALS_DAYS, RITUALS_COMING_NEXT, RitualDay } from "@/components/hajj/data/rituals";

function DayChip({
  day,
  active,
  onClick
}: {
  day: RitualDay;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "shrink-0 rounded-xl border px-3 py-2 text-sm text-left transition",
        active ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
      ].join(" ")}
    >
      <div className="font-semibold">{day.short}</div>
      <div className="text-xs text-slate-500">{day.title.replace(/^[^–]+–\s*/, "")}</div>
    </button>
  );
}

export default function RitualsSection() {
  const [activeId, setActiveId] = useState<number>(8);

  const day = RITUALS_DAYS.find((d) => d.id === activeId) ?? RITUALS_DAYS[0];

  return (
    <Card title="DAY-BY-DAY (8–13 DHUL HIJJAH)">
      <div className="space-y-4">
        {/* horizontal selector */}
        <div className="overflow-x-auto">
          <div className="flex gap-2 pb-2">
            {RITUALS_DAYS.map((d) => (
              <DayChip key={d.id} day={d} active={d.id === activeId} onClick={() => setActiveId(d.id)} />
            ))}
          </div>
        </div>

        {/* day details */}
        <div className="rounded-xl border border-slate-100 bg-white p-4 text-sm text-slate-700">
          <div className="mb-2">
            <div className="text-xs tracking-widest text-slate-500 font-semibold"> {day.title} </div>
            {day.subtitle && <div className="text-xs text-slate-500 mt-1">{day.subtitle}</div>}
          </div>

          <div className="text-sm text-slate-600 leading-relaxed mb-3">{day.summary}</div>

          <div className="grid gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">What to do today</div>
              <ol className="list-decimal pl-5 mt-2 space-y-1 text-sm text-slate-600">
                {day.todo.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ol>
            </div>

            <div>
              <div className="text-sm font-semibold text-slate-900">Focus for today</div>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-slate-600">
                {day.focus.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>

            {day.reminders && day.reminders.length > 0 && (
              <div>
                <div className="text-sm font-semibold text-slate-900">Helpful reminders</div>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-slate-600">
                  {day.reminders.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            {day.night && (
              <Accordion title={day.night.title}>
                <div className="text-sm text-slate-600 space-y-2">
                  {day.night.summary && <div>{day.night.summary}</div>}
                  {day.night.todo && (
                    <div>
                      <div className="font-semibold text-sm text-slate-900 mt-1">What to do</div>
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        {day.night.todo.map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {day.night.reminder && <div className="text-xs text-slate-500 mt-2">{day.night.reminder}</div>}
                </div>
              </Accordion>
            )}

            {day.next && (
              <div className="mt-2 text-sm text-slate-700">
                <div className="font-medium">What’s coming next →</div>
                <div className="text-sm text-slate-600 mt-1">{day.next}</div>
              </div>
            )}
          </div>
        </div>

        {/* small extras */}
        <Accordion title="Plan & quick checklist">
          <div className="text-sm text-slate-600">
            <ul className="list-disc pl-5">
              <li>Keep copies of travel documents in your tent and with your group leader</li>
              <li>Carry water, a small first-aid kit, and sun protection</li>
              <li>Follow official crowd-control instructions and your group leader</li>
            </ul>
          </div>
        </Accordion>
      </div>
    </Card>
  );
}
