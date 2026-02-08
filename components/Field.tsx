"use client";

import React from "react";

/* ---------------- Formatting helpers ---------------- */

function sanitizeNumeric(raw: string, maxDecimals: number) {
  // remove commas + keep only digits + one dot
  let s = raw.replace(/,/g, "");
  s = s.replace(/[^\d.]/g, "");

  const firstDot = s.indexOf(".");
  if (firstDot !== -1) {
    s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, "");
  }

  // limit decimals
  const [i, d] = s.split(".");
  if (d !== undefined) return `${i}.${d.slice(0, maxDecimals)}`;
  return i;
}

function formatIndianNumberString(raw: string) {
  // raw is digits + optional dot, no commas
  if (!raw) return "";

  const [intRaw, decRaw] = raw.split(".");
  const intPart = intRaw.replace(/^0+(?=\d)/, ""); // trim leading zeros (keep single 0)
  const intSafe = intPart === "" ? "0" : intPart;

  // Indian grouping: last 3 digits then groups of 2
  const last3 = intSafe.slice(-3);
  const rest = intSafe.slice(0, -3);
  const groupedRest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  const groupedInt = rest ? `${groupedRest},${last3}` : last3;

  if (raw.includes(".")) {
    // keep dot even if decimals are empty (so user can type "12.")
    return `${groupedInt}.${decRaw ?? ""}`;
  }

  return groupedInt;
}

// caret helpers (keeps typing smooth while inserting commas)
function countDigitsLeft(str: string, cursor: number) {
  let count = 0;
  for (let i = 0; i < Math.min(cursor, str.length); i++) {
    if (/\d/.test(str[i])) count++;
  }
  return count;
}

function cursorFromDigitsLeft(str: string, digitsLeft: number) {
  if (digitsLeft <= 0) return 0;
  let count = 0;
  for (let i = 0; i < str.length; i++) {
    if (/\d/.test(str[i])) count++;
    if (count >= digitsLeft) return i + 1;
  }
  return str.length;
}

function mergeRefs<T>(
  ...refs: Array<React.Ref<T> | undefined>
): React.RefCallback<T> {
  return (value) => {
    refs.forEach((ref) => {
      if (!ref) return;
      if (typeof ref === "function") ref(value);
      else {
        try {
          (ref as React.MutableRefObject<T | null>).current = value;
        } catch {
          // ignore
        }
      }
    });
  };
}

/* ---------------- Component ---------------- */

export default function Field({
  label,
  hint,
  prefix,
  suffix,
  value,
  onChange,
  inputRef,
  maxDecimals = 2
}: {
  label: string;
  hint?: string;
  prefix?: string;
  suffix?: string;
  value: number | "";
  onChange: (v: number | "") => void;
  inputRef?: React.Ref<HTMLInputElement>;
  maxDecimals?: number; // ✅ set 3 for grams, keep 2 for currency/rates
}) {
  const innerRef = React.useRef<HTMLInputElement | null>(null);

  // Draft string shown in the input (formatted with commas)
  const [draft, setDraft] = React.useState<string>("");

  // Sync draft whenever parent value changes externally (reset, autofill, etc.)
  React.useEffect(() => {
    if (value === "") {
      setDraft("");
      return;
    }

    // Convert number -> string, keep up to maxDecimals (but don’t force decimals)
    const asString = String(value);
    const sanitized = sanitizeNumeric(asString, maxDecimals);
    const formatted = formatIndianNumberString(sanitized);

    setDraft(formatted);
  }, [value, maxDecimals]);

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
          ref={mergeRefs(innerRef, inputRef)}
          inputMode="decimal"
          className={[
            "w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-slate-900 outline-none",
            "focus:border-brand-300 focus:ring-2 focus:ring-brand-100",
            prefix ? "pl-9" : "",
            suffix ? "pr-10" : ""
          ].join(" ")}
          value={draft}
          onChange={(e) => {
            const el = e.target;
            const raw = el.value;

            // Allow empty
            if (raw.trim() === "") {
              setDraft("");
              onChange("");
              return;
            }

            const prevCursor = el.selectionStart ?? raw.length;
            const digitsLeft = countDigitsLeft(raw, prevCursor);

            // Sanitize -> format
            const cleaned = sanitizeNumeric(raw, maxDecimals);

            // If user typed only "." or invalid partial state, keep draft but don't update number
            if (cleaned === "." || cleaned === "") {
              setDraft(raw);
              return;
            }

            const formatted = formatIndianNumberString(cleaned);
            setDraft(formatted);

            // Parse number safely
            const numeric = Number(cleaned.replace(/,/g, ""));
            if (Number.isFinite(numeric)) {
              onChange(numeric);
            }

            // Restore cursor after formatting
            requestAnimationFrame(() => {
              const node = innerRef.current;
              if (!node) return;
              const nextCursor = cursorFromDigitsLeft(formatted, digitsLeft);
              node.setSelectionRange(nextCursor, nextCursor);
            });
          }}
          onBlur={() => {
            // On blur: normalize any weird draft like "12." -> "12"
            const cleaned = sanitizeNumeric(draft, maxDecimals);
            if (cleaned === "" || cleaned === ".") {
              setDraft("");
              onChange("");
              return;
            }
            const formatted = formatIndianNumberString(cleaned);
            setDraft(formatted);

            const numeric = Number(cleaned.replace(/,/g, ""));
            if (Number.isFinite(numeric)) onChange(numeric);
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
