"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import HomePage from "@/components/HomePage";
import PillarTabs from "@/components/PillarTabs";
import PillarHeader from "@/components/PillarHeader";
import Card from "@/components/Card";
import Accordion from "@/components/Accordion";
import usePersistedState from "@/lib/usePersistedState";
import { PILLARS, PillarKey } from "@/lib/pillars";
import { calculateZakat, ZakatForm, GoldHoldings } from "@/lib/zakat";
import GuidedZakatV1 from "@/components/GuidedZakatV1";

function formatINR(n: number) {
  try {
    return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
  } catch {
    return String(Math.round(n));
  }
}

function n(v: any) {
  if (v === "" || v === null || v === undefined) return 0;
  const num = Number(v);
  return Number.isFinite(num) ? num : 0;
}

/* ---------- Help FAB (single global) ---------- */
function HelpFab() {
  return (
    <Link
      href="/help"
      aria-label="Help"
      title="Help"
      className={[
        "fixed right-6 top-10 z-50",
        "inline-flex h-10 w-10 items-center justify-center rounded-full",
        "border border-slate-200 bg-white/90 backdrop-blur",
        "text-slate-700 hover:text-emerald-900 hover:bg-white",
        "shadow-[0_10px_25px_rgba(2,6,23,0.12)]",
        "transition",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
      ].join(" ")}
    >
      <span className="text-sm font-bold leading-none">?</span>
    </Link>
  );
}

/* ---------- Default gold holdings helper ---------- */
function defaultGoldHoldings(): GoldHoldings {
  return {
    "24k": { grams: "", rate: "" },
    "22k": { grams: "", rate: "" },
    "18k": { grams: "", rate: "" },
    custom: { grams: "", rate: "", purityPct: "" }
  };
}

type AppView = "home" | "pillars";

export default function Page() {
  const VIEW_KEY = "fp_view_v1";
  const [view, setView] = usePersistedState<AppView>(VIEW_KEY, "home");

  // Ensure first-ever open lands on Home (if no key present)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_KEY);
      if (saved === null) {
        setView("home"); // persist "home" default for future loads
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // active pillar persisted separately
  const [active, setActive] = usePersistedState<PillarKey>("fp_active_tab_v1", "zakat");

  const [z, setZ] = usePersistedState<ZakatForm>("fp_zakat_form_v3", {
    cash: "",
    bank: "",

    goldHoldings: defaultGoldHoldings(),
    goldKarat: "24k",

    // legacy fields optional – kept for backward compat (safe)
    goldGrams: "",
    goldRate: "",
    goldCustomPurity: "",

    silverGrams: "",
    silverRate: "",

    investments: "",
    businessAssets: "",
    moneyLent: "",

    debts: "",

    nisabBasis: "silver"
  });

  const [lastFetchedAt, setLastFetchedAt] = usePersistedState<number | null>(
    "fp_rates_last_fetched_v1",
    null
  );

  const [resultOpen, setResultOpen] = usePersistedState<boolean>("fp_result_open_v1", false);

  const prevEligibleRef = useRef<boolean>(false);
  const prevActiveRef = useRef<PillarKey>(active);

  const pillar = PILLARS[active];
  const zakatResult = active === "zakat" ? calculateZakat(z) : null;

  // Auto-expand result tray when zakat becomes due (false -> true)
  useEffect(() => {
    if (active !== "zakat") {
      prevActiveRef.current = active;
      return;
    }

    const switchedToZakat = prevActiveRef.current !== "zakat" && active === "zakat";
    prevActiveRef.current = active;

    const eligibleNow = Boolean(zakatResult?.eligible);
    const eligibleBefore = prevEligibleRef.current;

    if (!switchedToZakat && !eligibleBefore && eligibleNow) {
      setResultOpen(true);
    }

    prevEligibleRef.current = eligibleNow;
  }, [active, zakatResult?.eligible, setResultOpen]);

  const TRAY_SPACER_HEIGHT = 360;

  const resetForm = () => {
    setZ({
      cash: "",
      bank: "",

      goldHoldings: defaultGoldHoldings(),
      goldKarat: "24k",

      goldGrams: "",
      goldRate: "",
      goldCustomPurity: "",

      silverGrams: "",
      silverRate: "",

      investments: "",
      businessAssets: "",
      moneyLent: "",

      debts: "",

      nisabBasis: "silver"
    });
    setLastFetchedAt(null);
    setResultOpen(false);
  };

  const handleDownloadPDF = () => {
    if (!zakatResult) return;

    const lines = [
      `Zakat calculation (offline)`,
      `Status: ${zakatResult.eligible ? "Due" : "Not due"}`,
      `Zakat: ₹ ${formatINR(zakatResult.eligible ? zakatResult.zakat : 0)}`,
      `Net: ₹ ${formatINR(zakatResult.net)}`,
      `Nisab (${zakatResult.basis}): ₹ ${formatINR(zakatResult.nisab)}`
    ].join("\n");

    const blob = new Blob([lines], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "zakat-calculation.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (!zakatResult) return;

    const text = [
      `Zakat: ₹ ${formatINR(zakatResult.eligible ? zakatResult.zakat : 0)}`,
      `Net: ₹ ${formatINR(zakatResult.net)}`,
      `Nisab (${zakatResult.basis}): ₹ ${formatINR(zakatResult.nisab)}`,
      `Status: ${zakatResult.eligible ? "Due" : "Not due"}`
    ].join(" · ");

    try {
      // @ts-ignore
      if (navigator.share) {
        // @ts-ignore
        await navigator.share({ title: "Zakat calculation", text });
        return;
      }
    } catch {}

    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard.");
    } catch {
      window.prompt("Copy the result:", text);
    }
  };

  const basis = z.nisabBasis;
  const trayHeading = zakatResult?.breakdown?.nisabRateMissing
    ? `Add a ${zakatResult?.basis ?? basis} rate to check Nisab`
    : zakatResult?.eligible
    ? "Zakat is due"
    : "Zakat is not due";

  /* When selecting from homepage, switch view + set active */
  const goToPillar = (k: PillarKey) => {
    setActive(k);
    setView("pillars");
  };

  /* ---------- HOME VIEW (first open lands here) ---------- */
  if (view === "home") {
    return (
      <main className="min-h-screen">
        <HelpFab />
        <HomePage onExplore={() => setView("pillars")} onSelectPillar={(k) => goToPillar(k)} />
      </main>
    );
  }

  /* ---------- PILLARS VIEW ---------- */
  return (
    <main className="min-h-screen">
      <HelpFab />

      {/* Fixed home icon (left) so it aligns with HelpFab */}
      <button
        type="button"
        onClick={() => setView("home")}
        aria-label="Go to home"
        title="Home"
        className={[
          "fixed left-6 top-10 z-50 inline-flex h-9 w-9 items-center justify-center rounded-full",
          "border border-slate-200 bg-white text-slate-600",
          "hover:bg-slate-50 hover:text-emerald-800",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
          "transition"
        ].join(" ")}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M3 10.5L12 3l9 7.5" />
          <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
        </svg>
      </button>

      <header className="container-page pt-10 pb-4 text-center">
        <div className="flex items-center justify-center max-w-5xl mx-auto px-4">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Five Pillars of Islam</h1>
        </div>

        <div className="mt-6">
          <PillarTabs active={active} onChange={setActive} />
        </div>
      </header>

      <section className="container-page pb-16">
        <PillarHeader
          title={active === "zakat" ? "Calculate Zakat" : pillar.title}
          subtitle={pillar.subtitle}
          icon={pillar.icon}
          hideIcon={active === "zakat"}
        />

        {active !== "zakat" ? (
          <div className="mt-6 space-y-5">
            {pillar.blocks.map((b, idx) => (
              <Card key={idx} title={b.title}>
                {b.content}
              </Card>
            ))}
          </div>
        ) : (
          <>
            {/* ✅ Conversational / guided Zakat flow */}
            <GuidedZakatV1 z={z} setZ={setZ} traySpacerHeight={TRAY_SPACER_HEIGHT} />

            {/* Keep this (optional) explainer */}
            <div className="mt-4">
              <Accordion title="How Zakat is calculated">
                <div className="text-sm text-slate-600 leading-relaxed space-y-2">
                  <p>
                    Zakat is estimated at <b>2.5%</b> of your <b>net zakatable wealth</b>.
                  </p>
                  <p className="text-sm">
                    <b>Net</b> = (Cash + Bank + Gold value + Silver value + Investments + Business assets + Money lent) −
                    Debts
                  </p>
                  <p>
                    Zakat is <b>due</b> if Net is ≥ the <b>Nisab</b> threshold (based on your selected gold/silver rate).
                  </p>
                </div>
              </Accordion>
            </div>

            {/* Result tray pinned bottom (unchanged) */}
            <div className="fixed inset-x-0 bottom-0 z-50 pointer-events-none">
              <div
                className="container-page pb-4"
                style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
              >
                <div className="max-w-md mx-auto pointer-events-auto">
                  <div className="rounded-2xl border border-slate-200 bg-white p-3 soft-shadow">
                    {zakatResult && (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4">
                        <button
                          type="button"
                          onClick={() => setResultOpen((v) => !v)}
                          className="w-full text-left"
                          aria-expanded={resultOpen}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-[11px] tracking-widest text-emerald-800/70 font-semibold">
                                RESULT
                              </div>
                              <div className="mt-2 text-base font-semibold text-slate-900">{trayHeading}</div>
                              <div className="mt-1 text-xs text-slate-500">
                                {resultOpen ? "Tap to collapse" : "Tap to expand"}
                              </div>
                            </div>

                            <span
                              className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700"
                              aria-hidden="true"
                            >
                              {resultOpen ? "–" : "+"}
                            </span>
                          </div>
                        </button>

                        {resultOpen && (
                          <div className="mt-4">
                            {zakatResult.breakdown.nisabRateMissing ? (
                              <div className="text-sm text-slate-600">
                                You can enter your assets without metal rates, but we need a valid{" "}
                                <b>{zakatResult.basis}</b> rate to calculate Nisab and confirm whether Zakat is due.
                              </div>
                            ) : (
                              <div className="flex items-center justify-between gap-4">
                                <div>
                                  <div className="text-sm text-slate-600">
                                    {zakatResult.eligible ? "Zakat to pay" : "Below Nisab"}
                                  </div>
                                  <div className="mt-1 text-3xl font-semibold text-emerald-900">
                                    ₹ {formatINR(zakatResult.eligible ? zakatResult.zakat : 0)}
                                  </div>
                                  <div className="mt-2 text-xs text-slate-600">
                                    Net: ₹ {formatINR(zakatResult.net)} · Nisab: ₹ {formatINR(zakatResult.nisab)} (
                                    {zakatResult.basis})
                                  </div>
                                </div>

                                <span
                                  className={[
                                    "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold",
                                    zakatResult.eligible
                                      ? "border-emerald-200 bg-emerald-100 text-emerald-900"
                                      : "border-slate-200 bg-slate-100 text-slate-700"
                                  ].join(" ")}
                                >
                                  {zakatResult.eligible ? "Due" : "Not due"}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={handleDownloadPDF}
                        className="w-full rounded-xl bg-brand-800 hover:bg-brand-900 text-white py-3 font-semibold soft-shadow transition"
                      >
                        Download PDF
                      </button>

                      <button
                        type="button"
                        onClick={handleShare}
                        className="w-full rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 py-3 font-semibold transition"
                      >
                        Share
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={resetForm}
                      className="mt-3 w-full rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 py-3 text-sm font-semibold transition"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
