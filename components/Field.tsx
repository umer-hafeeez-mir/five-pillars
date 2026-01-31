
"use client";

export default function Field({
  label,
  hint,
  prefix,
  suffix,
  value,
  onChange
}: {
  label: string;
  hint?: string;
  prefix?: string;
  suffix?: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="text-sm font-medium text-slate-800">{label}</div>

      <div className="mt-2 relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
            {prefix}
          </span>
        )}

        <input
          inputMode="decimal"
          type="number"
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(Number(e.target.value || 0))}
          className={[
            "w-full rounded-xl border border-slate-200 bg-white py-3 text-sm",
            "focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-300",
            prefix ? "pl-8 pr-10" : "pl-3 pr-10"
          ].join(" ")}
        />

        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
            {suffix}
          </span>
        )}
      </div>

      {hint && <div className="mt-2 text-xs text-slate-400">{hint}</div>}
    </div>
  );
}
