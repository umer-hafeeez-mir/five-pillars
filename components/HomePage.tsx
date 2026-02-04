"use client";

import Link from "next/link";
import React from "react";
import { PILLARS, PILLARS_ORDER, type PillarKey } from "@/lib/pillars";

type HomePageProps = {
  onExplore: () => void;
  onSelectPillar: (k: PillarKey) => void;
};

/**
 * Inline “mosque skyline” background (SVG data URI).
 * This gives you the exact hero feel from the screenshot without needing an image file.
 */
const MOSQUE_BG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="420" viewBox="0 0 1400 420">
  <defs>
    <linearGradient id="fade" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="0.55" stop-color="#ffffff" stop-opacity="0.25"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="1"/>
    </linearGradient>
    <linearGradient id="mist" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#DCE7E1" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#DCE7E1" stop-opacity="0"/>
    </linearGradient>
    <filter id="blur" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4"/>
    </filter>
  </defs>

  <!-- soft mist -->
  <rect width="1400" height="420" fill="url(#mist)"/>

  <!-- skyline silhouettes (very light) -->
  <g opacity="0.25" filter="url(#blur)" fill="#879B90">
    <path d="M140 320c30-26 40-58 44-92 4-36 28-62 56-62s52 26 56 62c4 34 14 66 44 92v34H140v-34z"/>
    <path d="M390 355V312c0-40 32-72 72-72s72 32 72 72v43H390z"/>
    <path d="M620 355V300c0-46 38-84 84-84s84 38 84 84v55H620z"/>
    <path d="M930 355V312c0-40 32-72 72-72s72 32 72 72v43H930z"/>
    <path d="M1130 320c30-26 40-58 44-92 4-36 28-62 56-62s52 26 56 62c4 34 14 66 44 92v34h-200v-34z"/>

    <!-- minarets -->
    <path d="M250 355V210l18-18 18 18v145h-36z"/>
    <path d="M251 205l17-16 17 16h-34z"/>
    <path d="M1120 355V210l18-18 18 18v145h-36z"/>
    <path d="M1121 205l17-16 17 16h-34z"/>
  </g>

  <!-- fade -->
  <rect y="0" width="1400" height="420" fill="url(#fade)"/>
</svg>
`)}`;

/**
 * Illustration-style icons.
 * These are intentionally simple/soft to match the screenshot.
 * If you share real assets later, we’ll swap these out.
 */
function Illustration({ k }: { k: PillarKey }) {
  const common = "w-14 h-14";
  switch (k) {
    case "shahada":
      return (
        <svg className={common} viewBox="0 0 64 64" fill="none">
          <path
            d="M40 12c-9 0-16 7-16 16 0 12 10 22 22 22 2 0 4 0 6-1-9 7-23 6-32-3-9-9-10-23-3-32 5-6 14-9 23-7z"
            fill="#D9C07C"
          />
          <path
            d="M46 12l1.8 5.6H54l-5 3.6 1.9 5.7-4.9-3.6-5 3.6 1.9-5.7-5-3.6h6.2L46 12z"
            fill="#D9C07C"
            opacity="0.9"
          />
        </svg>
      );
    case "salah":
      return (
        <svg className={common} viewBox="0 0 64 64" fill="none">
          <path
            d="M18 14h28c2 0 4 2 4 4v28c0 2-2 4-4 4H18c-2 0-4-2-4-4V18c0-2 2-4 4-4z"
            fill="#B9D2C3"
          />
          <path
            d="M22 18h20c2 0 4 2 4 4v20c0 2-2 4-4 4H22c-2 0-4-2-4-4V22c0-2 2-4 4-4z"
            fill="#EAF3EE"
          />
          <path
            d="M32 22l10 10-10 10-10-10 10-10z"
            fill="#86A996"
            opacity="0.9"
          />
          <path
            d="M26 32h12"
            stroke="#2E5E45"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.8"
          />
        </svg>
      );
    case "zakat":
      return (
        <svg className={common} viewBox="0 0 64 64" fill="none">
          <path d="M18 28c0-6 6-10 14-10s14 4 14 10" stroke="#2E5E45" strokeWidth="3" strokeLinecap="round"/>
          <path d="M20 28h24l4 24H16l4-24z" fill="#B9D2C3"/>
          <path d="M28 26c0-2 2-4 4-4s4 2 4 4" fill="#2E5E45" opacity="0.9"/>
          <circle cx="14" cy="46" r="5" fill="#D9C07C"/>
          <circle cx="22" cy="50" r="4" fill="#D9C07C" opacity="0.9"/>
          <circle cx="50" cy="46" r="5" fill="#D9C07C" opacity="0.85"/>
        </svg>
      );
    case "sawm":
      return (
        <svg className={common} viewBox="0 0 64 64" fill="none">
          <path
            d="M42 12c-9 0-16 7-16 16 0 12 10 22 22 22 2 0 4 0 6-1-9 7-23 6-32-3-9-9-10-23-3-32 5-6 14-9 23-7z"
            fill="#D9C07C"
            opacity="0.9"
          />
          <circle cx="44" cy="18" r="2" fill="#D9C07C"/>
          <circle cx="49" cy="22" r="1.5" fill="#D9C07C" opacity="0.9"/>
        </svg>
      );
    case "hajj":
      return (
        <svg className={common} viewBox="0 0 64 64" fill="none">
          <path d="M20 24h24v24H20V24z" fill="#86A996"/>
          <path d="M20 24h24v6H20v-6z" fill="#2E5E45" opacity="0.95"/>
          <path d="M24 34h16v10H24V34z" fill="#EAF3EE"/>
          <path d="M24 34h16v2H24v-2z" fill="#D9C07C" opacity="0.9"/>
          <path d="M30 20h4v4h-4v-4z" fill="#D9C07C" opacity="0.9"/>
        </svg>
      );
    default:
      return <div className={common} />;
  }
}

function PillarCard({
  k,
  onOpen,
  badge
}: {
  k: PillarKey;
  onOpen: (k: PillarKey) => void;
  badge?: string | null;
}) {
  const p = PILLARS[k];

  return (
    <button
      onClick={() => onOpen(k)}
      className={[
        "relative w-full text-center rounded-xl bg-white",
        "border border-slate-200",
        "shadow-[0_10px_25px_rgba(2,6,23,0.06)]",
        "hover:shadow-[0_14px_34px_rgba(2,6,23,0.10)] hover:-translate-y-[1px]",
        "transition-all duration-200",
        "px-4 pt-4 pb-5"
      ].join(" ")}
    >
      {badge ? (
        <span className="absolute right-3 top-3 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-semibold px-2 py-1">
          {badge}
        </span>
      ) : null}

      <div className="mx-auto flex items-center justify-center">
        <Illustration k={k} />
      </div>

      <div className="mt-2 text-[13px] font-semibold text-slate-900">{p.tab}</div>
      <div className="text-[11px] text-slate-500">{p.tabHint}</div>

      <div className="mt-2 text-[11px] leading-snug text-slate-500">
        {k === "zakat"
          ? "Calculate and\nunderstand Zakat"
          : k === "salah"
          ? "Daily prayers & guidance"
          : k === "hajj"
          ? "Preparation & requirements"
          : k === "sawm"
          ? "Ramadan & voluntary fasts"
          : "Declaration of belief"}
      </div>
    </button>
  );
}

export default function HomePage(props: HomePageProps) {
  const { onExplore, onSelectPillar } = props;

  // Match screenshot: only Zakat shows “Available”
  const badgeFor = (k: PillarKey) => (k === "zakat" ? "Available" : null);

  return (
    <section className="min-h-screen bg-[#F7F9F8]">
      {/* Top hairline */}
      <div className="h-px bg-slate-200/70" />

      <div className="px-4 py-10">
        {/* Narrow centered column like the screenshot */}
        <div className="mx-auto w-full max-w-[520px]">
          {/* Hero card (white, soft bg, skyline) */}
          <div className="relative rounded-[10px] bg-white border border-slate-200 shadow-[0_18px_40px_rgba(2,6,23,0.06)] overflow-hidden">

            {/* skyline */}
            <div
              className="absolute inset-x-0 top-0 h-36 opacity-70"
              style={{
                backgroundImage: `url("${MOSQUE_BG}")`,
                backgroundSize: "cover",
                backgroundPosition: "center"
              }}
            />
            {/* subtle fade */}
            <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-white/10 via-white/40 to-white" />

            <div className="relative px-6 pt-10 pb-6 text-center">
              <h1 className="text-[22px] sm:text-[24px] font-semibold text-slate-900">
                The Five Pillars of Islam
              </h1>

              <p className="mt-2 text-[12px] text-slate-500">
                Simple, trustworthy tools to help you practice with clarity and intention.
              </p>

              <div className="mt-4 flex items-center justify-center">
                <button
                  onClick={onExplore}
                  className="rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-[12px] font-semibold px-4 py-2 shadow-sm transition"
                >
                  Explore the Five Pillars
                </button>
              </div>

              {/* Cards grid */}
              <div className="mt-6 grid grid-cols-3 gap-3">
                {PILLARS_ORDER.map((k) => (
                  <PillarCard key={k} k={k} onOpen={onSelectPillar} badge={badgeFor(k)} />
                ))}
              </div>

              {/* Not sure where to begin panel */}
              <div className="mt-6 rounded-xl border border-slate-200 bg-emerald-50/30 shadow-[0_10px_25px_rgba(2,6,23,0.05)] overflow-hidden">
                <div className="px-6 pt-5 pb-4 text-center">
                  <div className="text-[13px] font-semibold text-slate-900">
                    Not sure where to begin?
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    Most people start with Zakat or Prayer.
                  </div>

                  <div className="mt-4 flex items-center justify-center gap-3">
                    <button
                      onClick={() => onSelectPillar("zakat")}
                      className="rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-[12px] font-semibold px-4 py-2 transition"
                    >
                      Calculate my Zakat
                    </button>
                    <button
                      onClick={() => onSelectPillar("salah")}
                      className="rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-[12px] font-semibold px-4 py-2 transition border border-emerald-200"
                    >
                      Learn about Salah
                    </button>
                  </div>

                  <div className="mt-5 flex justify-center">
                    <ul className="text-left text-[11px] text-slate-600 space-y-1.5">
                      <li className="flex gap-2">
                        <span className="mt-[2px]">•</span>
                        <span>Based on widely accepted Islamic principles</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="mt-[2px]">•</span>
                        <span>Transparent calculations and explanations</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="mt-[2px]">•</span>
                        <span>Educational support, not religious verdicts</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="mt-[2px]">•</span>
                        <span>No ads. No tracking. No pressure</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Quote */}
              <div className="mt-6 text-center">
                <div className="text-[11px] italic text-slate-600">
                  “Islam is built upon five pillars…”
                </div>
                <div className="mt-1 text-[10px] text-slate-500">
                  — Sahih al-Bukhari & Muslim
                </div>
              </div>

              {/* Footer */}
             <div className="mt-6 flex items-center justify-center gap-5 text-[10px] text-slate-500">
              <Link href="/help#getting-started" className="hover:text-slate-700 transition">
                Getting started
              </Link>
              <Link href="/help#zakat" className="hover:text-slate-700 transition">
                Zakat
              </Link>
              <Link href="/help#sources" className="hover:text-slate-700 transition">
                Sources
              </Link>
              <Link href="/help#privacy" className="hover:text-slate-700 transition">
                Privacy
              </Link>
              <Link href="/help#feedback" className="hover:text-slate-700 transition">
                Feedback
              </Link>
            </div>

            </div>
          </div>

          {/* bottom breathing space (matches screenshot composition) */}
          <div className="h-10" />
        </div>
      </div>
    </section>
  );
}
