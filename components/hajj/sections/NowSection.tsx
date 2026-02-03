"use client";

import Card from "@/components/Card";
import { NOW_LOCATIONS } from "@/components/hajj/data/now";

export default function NowSection() {
  return (
    <Card title="I’M HERE NOW — WHAT SHOULD I DO?">
      <div className="text-sm text-slate-600 leading-relaxed space-y-3">
        <p>
          This will become “Now Mode” (super useful during Hajj).
          You’ll click where you are (Mina/Arafat/Muzdalifah/Haram), and it shows the next actions.
        </p>

        <div className="grid grid-cols-2 gap-2">
          {NOW_LOCATIONS.map((x) => (
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
  );
}
