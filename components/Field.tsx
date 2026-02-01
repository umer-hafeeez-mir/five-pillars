"use client";

import React from "react";

export default function Field({
  label,
  hint,
  prefix,
  suffix,
  value,
  onChange,
  inputRef
}: {
  label: string;
  hint?: string;
  prefix?: string;
  suffix?: string;
  value: number | "";
  onChange: (v: number | "") => void;
  inputRef?: React.Ref<HTMLInputElement>;
}) {
  return (
    <div>
      <div className="text-sm font-medium text-slate-800">{label}</div>

      <div className="mt-2 relative">
        {prefix && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {prefix}
          </div>
        )}

        <input
          ref={inputRef}
          inputMode="decimal"
          className={[
            "w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-slate-900 outline-none",
            "focus:border-brand-300 focus:ring-2 focus:ring-brand-100",
            prefix ? "pl-9" : "",
            suffix ? "pr-10" : ""
          ].join(" ")}
          value={value === "" ? "" : String(value)}
          onChange={(e) => {
            const raw = e.target.value;

            // Allow empty
            if (raw.trim() === "") {
              onChange("");
              return;
            }

            // Allow decimals; ignore invalid
            const num = Number(raw);
            if (Number.isFinite(num)) onChange(num);
          }}
        />

        {suffix && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            {suffix}
          </div>
        )}
      </div>

      {hint && <div className="mt-2 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}
