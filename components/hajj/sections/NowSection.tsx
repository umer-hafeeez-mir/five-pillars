"use client";

import { useMemo, useState } from "react";
import Card from "@/components/Card";
import Accordion from "@/components/Accordion";
import { NOW_GUIDES, NOW_LOCATIONS, NowLocation } from "@/components/hajj/data/now";

export default function NowSection() {
  const [loc, setLoc] = useState<NowLocation>("Mina");

  const guide = useMemo(() => NOW_GUIDES[loc], [loc]);

  return (
    <div className="space-y-4">
      {/* Location selector */}
      <Card title="NOW MODE">
        <div className="text-sm text-slate-600 leading-relaxed space-y-3">
          <p>
            Select where you are right now and get a quick checklist. This stays offline and is designed for use during
            crowds.
          </p>

          <div className="grid grid-cols-2 gap-2">
            {NOW_LOCATIONS.map((x) => (
              <button
                key={x}
                type="button"
                onClick={() => setLoc(x)}
                className={[
                  "rounded-xl border px-3 py-3 text-sm font-semibold transition text-left",
                  loc === x
                    ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                    : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                ].join(" ")}
              >
                {x}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Guide */}
      <Card title={guide.title.toUpperCase()}>
        <div className="text-sm text-slate-600 leading-relaxed space-y-3">
          {guide.summary && <p>{guide.summary}</p>}

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs font-semibold tracking-wide text-slate-500">WHAT TO DO NOW</div>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              {guide.steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>

          <Accordion title="Focus for now">
            <ul className="list-disc pl-5 space-y-1">
              {guide.focus.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </Accordion>

          <Accordion title="Helpful reminders">
            <ul className="list-disc pl-5 space-y-1">
              {guide.reminders.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </Accordion>

          <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600">
            Tip: Keep this page open while moving. Use it as a quick checklist, not a long read.
          </div>
        </div>
      </Card>
    </div>
  );
}
