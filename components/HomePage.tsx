"use client";

import React from "react";
import { PILLARS, PILLARS_ORDER, PillarKey } from "@/lib/pillars";
import {
  HeartIcon,
  ClockIcon,
  MoonIcon,
  CrescentIcon,
  PinIcon
} from "@/components/Icons";

function PillarIcon({ name }: { name: string }) {
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

function PillarCard({
  k,
  onOpen,
  showAvailable = true
}: {
  k: PillarKey;
  onOpen: (k: PillarKey) => void;
  showAvailable?: boolean;
}) {
  const p = PILLARS[k];

  // You can later replace this with real feature flags
  const isAvailable = true;

  return (
    <button
      onClick={() => onOpen(k)}
      className={[
        "group relative text-left rounded-2xl border bg-white p-6",
        "border-slate-200 soft-shadow",
        "transition-all duration-200",
        "hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(2,6,23,0.14)]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
      ].join(" ")}
    >
      {showAvailable && isAvailable && (
        <div className="absolute right-4 top-4">
          <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-brand-50 border border-brand-100 text-brand-900">
            Available
          </span>
        </div>
      )}

      <div className="w-12 h-12 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-800">
        <PillarIcon name={p.icon} />
      </div>

      <div className="mt-4">
        <div className="text-lg font-semibold text-slate-900">{p.tab}</div>
        <div className="text-sm text-slate-500">{p.tabHint}</div>

        <div className="mt-3 text-sm text-slate-600 leading-relaxed">
          {p.subtitle}
        </div>
      </div>

      <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-900">
        Open
        <span className="transition-transform group-hover:translate-x-0.5">→</span>
      </div>
    </button>
  );
}

export default function HomePage({
  onExplore,
  onSelectPillar
}: {
  onExplore: () => void;
  onSelectPillar: (k: PillarKey) => void;
}) {
  return (
    <section className="relative">
      {/* subtle background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-50/60 via-white to-white" />

      <div className="max-w-5xl mx-auto px-4 pt-10 pb-6">
        <div className="text-center mt-6">
          <h1 className="text-3xl sm:text-4xl font-semibold">
            The Five Pillars of Islam
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-500">
            Simple, trustworthy tools to help you practice with clarity and intention.
          </p>

          <div className="mt-7 flex items-center justify-center gap-3">
            <button
              onClick={onExplore}
              className="rounded-xl bg-brand-800 text-white px-6 py-3 font-semibold shadow-sm hover:bg-brand-900 transition"
            >
              Explore the Five Pillars
            </button>

            <button
              onClick={() => onSelectPillar("zakat")}
              className="rounded-xl border border-brand-200 bg-white px-6 py-3 font-semibold text-brand-900 hover:bg-brand-50 transition"
            >
              Calculate Zakat
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {PILLARS_ORDER.map((k) => (
            <PillarCard key={k} k={k} onOpen={onSelectPillar} />
          ))}
        </div>

        {/* Start here */}
        <div className="mt-10 max-w-3xl mx-auto rounded-2xl border border-slate-200 bg-white soft-shadow p-6">
          <div className="text-center">
            <div className="text-xl font-semibold">Not sure where to begin?</div>
            <div className="mt-1 text-sm text-slate-500">
              Most people start with Zakat or Prayer.
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => onSelectPillar("zakat")}
              className="rounded-xl bg-brand-800 text-white px-6 py-3 font-semibold hover:bg-brand-900 transition"
            >
              Calculate my Zakat
            </button>
            <button
              onClick={() => onSelectPillar("salah")}
              className="rounded-xl border border-brand-200 bg-white px-6 py-3 font-semibold text-brand-900 hover:bg-brand-50 transition"
            >
              Learn about Salah
            </button>
          </div>

          <ul className="mt-6 space-y-2 text-sm text-slate-600">
            <li className="flex gap-2">
              <span className="text-brand-900 font-semibold">•</span>
              Based on widely accepted Islamic principl

