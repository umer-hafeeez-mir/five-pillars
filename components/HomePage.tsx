"use client";

import Link from "next/link";
import React from "react";
import { PILLARS, PILLARS_ORDER, type PillarKey } from "@/lib/pillars";

type HomePageProps = {
  onExplore: () => void;
  onSelectPillar: (k: PillarKey) => void;
};

/**
 * Illustration-style icons.
 */
function Illustration({ k }: { k: PillarKey }) {
  const common = "w-6 h-6";
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
      className="group relative flex w-full items-center gap-4 rounded-2xl bg-white border border-slate-200 p-4 text-left shadow-sm hover:shadow-lg hover:border-teal-300 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
      aria-label={`${p.tab} - ${p.tabHint}`}
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-teal-50/0 via-teal-50/50 to-cyan-50/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-100 to-cyan-100 group-hover:from-teal-200 group-hover:to-cyan-200 transition-all duration-300">
        <Illustration k={k} />
      </div>

      <div className="relative flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-base font-semibold text-slate-900">{p.tab}</span>
          {badge ? (
            <span className="rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-[10px] font-semibold px-2.5 py-0.5 shadow-sm">
              {badge}
            </span>
          ) : null}
        </div>
        <span className="text-sm text-slate-600 mt-0.5 block">{p.tabHint}</span>
      </div>

      <svg 
        className="relative w-5 h-5 text-slate-400 shrink-0 group-hover:text-teal-500 transition-colors duration-300" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

export default function HomePage(props: HomePageProps) {
  const { onExplore, onSelectPillar } = props;

  const badgeFor = (k: PillarKey) => (k === "zakat" ? "Available" : null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-teal-50/20 relative overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(20,184,166,0.15),transparent_50%)] animate-pulse" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(14,165,233,0.12),transparent_50%)] animate-pulse" style={{ animationDelay: '1s', animationDuration: '3s' }} />
      </div>

      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(20,184,166,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(20,184,166,0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Header */}
      <header className="relative bg-gradient-to-r from-teal-50/90 via-cyan-50/80 to-teal-50/90 backdrop-blur-sm border-b border-teal-200/60">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-teal-500 animate-pulse"></div>
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-600">
                Early Access
              </span>
              <span className="hidden sm:inline text-xs text-teal-700/80 ml-2">
                A calm companion for the Five Pillars
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-xs text-teal-700/80">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-teal-500"></span>
                Private, offline-first
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-teal-500"></span>
                No login. No ads.
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-4xl mx-auto px-4 py-6 sm:py-8">
        {/* Hero Section */}
        <div className="mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-slate-900 mb-4 leading-tight">
            Experience the{" "}
            <span className="relative inline-block">
              Five Pillars
              <span className="absolute -inset-x-1 -bottom-1 h-2 rounded-full bg-gradient-to-r from-teal-400/60 to-cyan-400/60 blur-sm opacity-70" />
            </span>{" "}
            with clarity and calm.
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
            A modern companion that brings Shahada, Salah, Zakat, Sawm, and Hajj into one focused place — so you can
            understand, track, and act with confidence, without distractions.
          </p>
        </div>

        {/* Primary CTA with decorative background */}
        <div className="mb-8 sm:mb-10 relative">
          {/* Decorative elements around CTA */}
          <div className="absolute -inset-4 bg-gradient-to-r from-teal-100/40 via-cyan-100/40 to-teal-100/40 rounded-2xl blur-xl opacity-50 animate-pulse" />
          <div className="relative">
            <button
              onClick={() => onSelectPillar("zakat")}
              className="w-full sm:w-auto min-h-[56px] px-8 py-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold text-base rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 transform hover:scale-[1.02]"
            >
              Calculate my Zakat
              <span className="ml-2 inline-flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-xs">
                •
              </span>
            </button>
          </div>
        </div>

        {/* Five Pillars Navigation */}
        <div className="mb-8 sm:mb-10">
          <div className="flex items-center justify-between mb-5 sm:mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-slate-900">The Five Pillars</h2>
              <p className="text-sm text-slate-500 mt-1 hidden sm:block">Tap a pillar to jump straight in.</p>
            </div>
            <button
              onClick={onExplore}
              className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors shrink-0"
            >
              Explore all
            </button>
          </div>

          {/* Decorative background for pillars section */}
          <div className="relative">
            <div className="absolute -inset-2 bg-gradient-to-br from-white/60 via-teal-50/40 to-cyan-50/40 rounded-3xl blur-2xl opacity-60" />
            <nav
              aria-label="Five pillars navigation"
              className="relative space-y-3 sm:space-y-4"
            >
              {PILLARS_ORDER.map((k) => (
                <PillarCard key={k} k={k} onOpen={onSelectPillar} badge={badgeFor(k)} />
              ))}
            </nav>
          </div>
        </div>

          {/* Right: “not sure where to begin” card */}

        {/* Social proof / reassurance */}
        <div className="mb-8 sm:mb-10">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-slate-600 mb-4">
            <div className="inline-flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-teal-100 to-cyan-100 ring-1 ring-teal-200 text-sm font-semibold text-teal-700">
                5×
              </span>
              <span>
                Built around the{" "}
                <span className="font-semibold text-slate-900">Five Pillars</span> – not generic to‑do lists.
              </span>
            </div>
            <div className="inline-flex items-center gap-2">
              <span className="h-1 w-8 rounded-full bg-gradient-to-r from-teal-400 to-cyan-400" />
              <span>No accounts, no feeds, just practice.</span>
            </div>
          </div>
          
          {/* Additional bullet points */}
          <div className="bg-gradient-to-br from-teal-50/60 to-cyan-50/60 border border-teal-200/60 rounded-2xl p-4 sm:p-5">
            <ul className="space-y-2.5 text-sm text-teal-900">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 shrink-0" />
                <span>Based on widely accepted Islamic principles</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 shrink-0" />
                <span>Transparent calculations and explanations</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 shrink-0" />
                <span>Educational Companion, not religious verdict</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Info Card */}
        <div className="mb-8 sm:mb-10 relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-teal-100/50 to-cyan-100/50 rounded-2xl blur opacity-50" />
          <div className="relative bg-gradient-to-br from-teal-50/80 to-cyan-50/70 border border-teal-200/60 rounded-2xl p-4 sm:p-5">
            <div className="flex gap-3 sm:gap-4">
              <div className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-100 to-cyan-100 text-teal-700 text-sm font-semibold ring-1 ring-teal-200">
                i
              </div>
              <p className="text-sm sm:text-base text-teal-900 leading-relaxed">
                This app is an <span className="font-semibold">educational companion</span> — not a religious
                verdict. Always confirm details with trusted scholars.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <footer className="pt-6 sm:pt-8 border-t border-teal-200/60">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 text-sm text-teal-700/80">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-teal-400 to-cyan-400" />
                Simple · Private · Offline‑friendly
              </span>
              <span className="hidden sm:inline-block h-1 w-6 rounded-full bg-teal-300/60" />
              <span className="inline-flex items-center gap-1">
                Sources curated from well‑known Islamic references
              </span>
            </div>
            <nav className="flex flex-wrap items-center gap-3 sm:gap-4" aria-label="Footer navigation">
              <Link href="/help#getting-started" className="hover:text-teal-900 transition-colors">
                Getting started
              </Link>
              <Link href="/help#zakat" className="hover:text-teal-900 transition-colors">
                Zakat
              </Link>
              <Link href="/help#sources" className="hover:text-teal-900 transition-colors">
                Sources
              </Link>
              <Link href="/help#privacy" className="hover:text-teal-900 transition-colors">
                Privacy
              </Link>
              <Link href="/help#feedback" className="hover:text-teal-900 transition-colors">
                Feedback
              </Link>
            </nav>
          </div>
        </footer>
      </main>
    </div>
  );
}
