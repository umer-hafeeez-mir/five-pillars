"use client";

import Accordion from "@/components/Accordion";
import Card from "@/components/Card";
import { EXAMPLE_DUA } from "@/components/hajj/data/duas";

export default function DuasSection() {
  return (
    <Card title="DUAS (OFFLINE)">
      <div className="text-sm text-slate-600 leading-relaxed space-y-3">
        <p>
          Next, we’ll add dua cards with Arabic + transliteration + translation. Audio can be added later via files in{" "}
          <code className="text-xs">/public</code>.
        </p>

        <Accordion title="Example dua item (placeholder)">
          <div className="space-y-3">
            <div className="text-lg leading-relaxed" dir="rtl">
              {EXAMPLE_DUA.arabic}
            </div>
            <div className="text-xs text-slate-500">{EXAMPLE_DUA.transliteration}</div>
            <div className="text-sm">{EXAMPLE_DUA.translation}</div>
          </div>
        </Accordion>
      </div>
    </Card>
  );
}

