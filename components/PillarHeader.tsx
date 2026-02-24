// components/PillarHeader.tsx
import React from "react";
import {
  HeartIcon,
  ClockIcon,
  MoonIcon,
  CrescentIcon,
  PinIcon
} from "@/components/Icons";

function Icon({ name }: { name: string }) {
  const cls = "w-6 h-6";
  switch (name) {
    case "heart":
      return <HeartIcon className={cls} />;
    case "clock":
      return <ClockIcon className={cls} />;
    case "moon":
      return <MoonIcon className={cls} />;
    case "crescent":
      return <CrescentIcon className={cls} />;
    case "pin":
      return <PinIcon className={cls} />;
    default:
      return <span className="text-lg">•</span>;
  }
}

export default function PillarHeader({
  icon,
  title,
  subtitle,
  hideIcon = false
}: {
  icon: string;
  title: React.ReactNode; // ✅ changed from string
  subtitle: string;
  hideIcon?: boolean;
}) {
  return (
    <div className="text-center mt-8">
      {/* Icon block renders ONLY when hideIcon === false */}
      {!hideIcon && (
        <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 flex items-center justify-center text-teal-700">
          <Icon name={icon} />
        </div>
      )}

      <h2 className={hideIcon ? "text-2xl font-semibold text-slate-900" : "mt-4 text-2xl font-semibold text-slate-900"}>
        {title}
      </h2>

      <p className="mt-1 text-sm text-teal-700/80">{subtitle}</p>
    </div>
  );
}
