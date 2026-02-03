"use client";

import Card from "@/components/Card";
import { FOOD_CATEGORIES } from "@/components/hajj/data/food";

export default function FoodSection() {
  return (
    <Card title="FOOD & ESSENTIALS">
      <div className="text-sm text-slate-600 leading-relaxed space-y-3">
        <p>
          We’ll add utilitarian listings: restaurants, groceries, pharmacies, SIM shops, and “open late” tags.
        </p>

        <div className="grid grid-cols-2 gap-2">
          {FOOD_CATEGORIES.map((x) => (
            <div key={x} className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="text-sm font-semibold text-slate-900">{x}</div>
              <div className="text-xs text-slate-500 mt-1">Coming soon</div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

