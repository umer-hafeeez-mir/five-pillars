// components/hajj/map/HajjMapCard.tsx
"use client";

import Card from "@/components/Card";
import MapPlaceholder from "@/components/hajj/map/MapPlaceholder";
import ManualLocationPicker from "@/components/hajj/map/ManualLocationPicker";
import MapLegend from "@/components/hajj/map/MapLegend";

export default function HajjMapCard() {
  return (
    <Card title="MAP">
      <div className="space-y-3">
        {/* 45% height target later when real map; placeholder is compact */}
        <MapPlaceholder />
        <MapLegend />
        <ManualLocationPicker />
      </div>
    </Card>
  );
}

