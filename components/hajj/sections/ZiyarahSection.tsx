"use client";

import Card from "@/components/Card";
import { ZIYARAH_NOTE } from "@/components/hajj/data/ziyarah";

export default function ZiyarahSection() {
  return (
    <Card title="ZIYARAH & HISTORY">
      <div className="text-sm text-slate-600 leading-relaxed space-y-3">
        <p>
          We’ll add places to visit with pictures + short historical context, clearly marked as optional (not part of Hajj rituals).
        </p>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          {ZIYARAH_NOTE}
        </div>
      </div>
    </Card>
  );
}

