"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

function addIndianCommas(intPart: string) {
  // Remove leading zeros but keep at least one zero if empty
  const raw = intPart.replace(/^0+(?=\d)/, "");

  // Indian grouping: last 3, then groups of 2
  const n = raw.length;
  if (n <= 3) return raw || "0";

  const last3 = raw.slice(n - 3);
  const rest = raw.slice(0, n - 3);

  const restWithCommas = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${restWithCommas},${last3}`;
}

function stripNonNumericChars(s: string) {
  // allow digits and one dot only
  let out = "";
  let dotSeen = false;
  for (const ch of s) {
    if (ch >= "0" && ch <= "9") out += ch;
    else if (ch === "." && !dotSeen) {
      out += ".";
      dotSeen = true;
    }
  }
  return out;
}

function formatWithCommasPreserveDecimals(raw: string) {
  // raw assumed to be sanitized like "1234.50" or "1234." or ".5"
  if (raw === "") return "";

  const hasDot = raw.includes(".");
  const [leftRaw, rightRaw = ""] = raw.split(".");

  // Handle cases like ".5"
  const left = leftRaw === "" ? "0" : leftRaw;

  const leftFormatted = addIndianCommas(left);

  if (!hasDot) return leftFormatted;

  // Preserve exactly what user typed after dot, even empty string (for "12.")
  return `${leftFormatted}.${rightRaw}`;
}

function parseToNumberOrEmpty(rawSanitized: string): number | "" {
  if (rawSanitized === "") return "";
  // "." or "0." should not become NaN — treat "." as 0 but keep display logic separate
  if (rawSanitized === ".") return 0;
  const num = Number(rawSanitized);
  return Number.isFinite(num) ? num : "";
}

export default function Field({
  label,
  hint,
  prefix,
  suffix,
  value,
  onChange,
  inputRef,
  maxDecimals
}: {
  label: string;
  hint?: string;
  prefix?: string;
  suffix?: string;
  value: number | "";
  onChange: (v: number | "") => void;
  inputRef?: React.Ref<HTMLInputElement>;
  /**
   * Optional: cap decimals (ex: 2 for money, 3 for grams)
   * If omitted, allows any reasonable decimals.
   */
  maxDecimals?: number;
}) {
  const localRef = useRef<HTMLInputElement | null>(null);
  const mergedRef = (node: HTMLInputElement | null) => {
    localRef.current = node;
    if (typeof inputRef === "function") inputRef(node);
    else if (inputRef && "current" in (inputRef as any)) (inputRef as any).current = node;
  };

  // Keep a raw text state so we can preserve "12." and trailing zeros
  const [text, setText] = useState<string>("");

  const formattedFromValue = useMemo(() => {
    if (value === "") return "";
    // Use plain string for the number (not locale) then format ourselves
    // But note: numeric value loses trailing zeros — that's okay only when we sync from external state.
    const s = String(value);
    const sanitized = stripNonNumericChars(s);
    return formatWithCommasPreserveDecimals(sanitized);
  }, [value]);

  // Sync external value -> internal text when value changes from outside (reset, autofill, etc.)
  useEffect(() => {
    setText(formattedFromValue);
  }, [formattedFromValue]);

  const applyMaxDecimals = (rawSanitized: string) => {
    if (!maxDecimals && maxDecimals !== 0) return rawSanitized;
    if (!rawSanitized.includes(".")) return rawSanitized;

    const [l, r] = rawSanitized.split(".");
    return `${l}.${(r ?? "").slice(0, maxDecimals)}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const prev = text;
    const nextTyped = input.value;

    // Cursor position BEFORE we reformat
    const caret = input.selectionStart ?? nextTyped.length;

    // Sanitize (remove commas, spaces, extra dots, etc.)
    const withoutCommas = nextTyped.replace(/,/g, "");
    let rawSanitized = stripNonNumericChars(withoutCommas);

    // Allow starting with "." -> "0."
    if (rawSanitized.startsWith(".")) rawSanitized = "0" + rawSanitized;

    // Enforce max decimals if provided
    rawSanitized = applyMaxDecimals(rawSanitized);

    // Build formatted display (commas only on integer part)
    const nextFormatted = formatWithCommasPreserveDecimals(rawSanitized);

    // Update local text immediately for smooth typing
    setText(nextFormatted);

    // Send numeric value upstream (number or "")
    const parsed = parseToNumberOrEmpty(rawSanitized);
    onChange(parsed);

    // Restore caret position smartly (account for commas added/removed)
    requestAnimationFrame(() => {
      const el = localRef.current;
      if (!el) return;

      // Rough caret adjustment: compare comma counts before caret
      const countCommas = (s: string) => (s.match(/,/g) || []).length;

      const prevBefore = prev.slice(0, caret);
      const nextBefore = nextFormatted.slice(0, caret);

      const commaDelta = countCommas(nextBefore) - countCommas(prevBefore);
      const newPos = Math.max(0, Math.min(nextFormatted.length, caret + commaDelta));

      try {
        el.setSelectionRange(newPos, newPos);
      } catch {}
    });
  };

  return (
    <div>
      <div className="text-sm font-medium text-slate-800">{label}</div>

      <div className="mt-2 relative">
        {prefix && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{prefix}</div>
        )}

        <input
          ref={mergedRef}
          inputMode="decimal"
          className={[
            "w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-slate-900 outline-none",
            "focus:border-brand-300 focus:ring-2 focus:ring-brand-100",
            prefix ? "pl-9" : "",
            suffix ? "pr-10" : ""
          ].join(" ")}
          value={text}
          onChange={handleChange}
        />

        {suffix && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{suffix}</div>
        )}
      </div>

      {hint && <div className="mt-2 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}
