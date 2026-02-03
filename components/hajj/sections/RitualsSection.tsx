"use client";

import Accordion from "@/components/Accordion";
import Card from "@/components/Card";
import { RITUALS_COMING_NEXT, RITUALS_INTRO } from "@/components/hajj/data/rituals";

export default function RitualsSection() {
  return (
    <Card title="DAY-BY-DAY (8–13 DHUL HIJJAH)">
      <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
        <p>{RITUALS_INTRO}</p>

        <Accordion title="What’s coming next">
          <ul className="list-disc pl-5 space-y-2">
            {RITUALS_COMING_NEXT.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </Accordion>
      </div>
    </Card>
  );
}

