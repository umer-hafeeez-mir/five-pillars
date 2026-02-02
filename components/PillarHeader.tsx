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
  title: string;
  subtitle: string;
  hideIcon?: boolean;
}) {
  return (
    <div className="text-center mt-8">
      {/* Icon block renders ONLY when hideIcon === false */}
      {!hideIcon && (
        <div className="mx-auto w-12 h-12 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-800">
          <Icon name={icon} />
        </div>
      )}

      <h2 className={hideIcon ? "text-2xl font-semibold" : "mt-4 text-2xl font-semibold"}>
        {title}
      </h2>

      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}
