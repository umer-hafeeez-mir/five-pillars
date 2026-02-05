"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import HomePage from "@/components/HomePage";
import PillarTabs from "@/components/PillarTabs";
import PillarHeader from "@/components/PillarHeader";
import Card from "@/components/Card";
import Field from "@/components/Field";
import Accordion from "@/components/Accordion";
import usePersistedState from "@/lib/usePersistedState";
import { PILLARS, PillarKey } from "@/lib/pillars";
import { calculateZakat, ZakatForm, GoldKarat, GoldHoldings } from "@/lib/zakat";

/* ---------------- Helpers ---------------- */

function formatINR(n: number) {
  try {
    return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
  } catch {
    return String(Math.round(n));
  }
}

function formatDateTime(ts?: number | null) {
  if (!ts) return "—";
  try {
    const d = new Date(ts);
    return d.toLocaleString("en-IN");
  } catch {
    return "—";
  }
}

function n(v: any) {
  if (v === "" || v === null || v === undefined) return 0;
  const num = Number(v);
  return Number.isFinite(num) ? num : 0;
}

/* ---------------- Transitions ---------------- */

function StepTransition({
  stepKey,
  dir,
  children
}: {
  stepKey: number;
  dir: "next" | "back";
  children: React.ReactNode;
}) {
  const translate = dir === "next" ? "translate-x-2" : "-translate-x-2";

  return (
    <div
      key={stepKey}
      className={[
        "transition-all duration-200 ease-out",
        "opacity-0",
        translate,
        "animate-step",
        "motion-reduce:transition-none motion-reduce:transform-none motion-reduce:opacity-100"
      ].join(" ")}
    >
      {children}

      <style jsx>{`
        .animate-step {
          opacity: 1;
          transform: translateX(0);
        }
      `}</style>
    </div>
  );
}

/* ---------------- UI bits ---------------- */

function HelpFab() {
  return (
    <Link
      href="/help"
      aria-label="Help"
      title="Help"
      className="fixed right-6 top-10 z-50 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/90 backdrop-blur text-slate-700 hover:text-emerald-900 hover:bg-white shadow transition"
    >
      <span className="text-sm font-bold">?</span>
    </Link>
  );
}

function defaultGoldHoldings(): GoldHoldings {
  return {
    "24k": { grams: "", rate: "" },
    "22k": { grams: "", rate: "" },
    "18k": { grams: "", rate: "" },
    custom: { grams: "", rate: "", purityPct: "" }
  };
}

/* ---------------- Types ---------------- */

type ZakatSection = "nisab" | "cash" | "metals" | "other" | "deductions" | null;
type AppView = "home" | "pillars";
type ZakatMode = "guided" | "power";
type GuidedStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

/* =================== Page =================== */

export default function Page() {
  const [view, setView] = usePersistedState<AppView>("fp_view_v1", "home");
  const [active, setActive] = usePersistedState<PillarKey>("fp_active_tab_v1", "zakat");

  const [zakatMode, setZakatMode] = usePersistedState<ZakatMode>("fp_zakat_mode_v1", "guided");
  const [guidedStep, setGuidedStep] = usePersistedState<GuidedStep>("fp_guided_step_v3", 0);
  const [stepDir, setStepDir] = usePersistedState<"next" | "back">("fp_guided_dir_v1", "next");
  const [ownsGold, setOwnsGold] = usePersistedState<boolean>("fp_guided_owns_gold_v1", true);
  const [showSummary, setShowSummary] = usePersistedState<boolean>("fp_zakat_summary_v1", false);

  const [z, setZ] = usePersistedState<ZakatForm>("fp_zakat_form_v3", {
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

  const zakatResult = calculateZakat(z);
  const basis = z.nisabBasis;
  const manualRateValue = basis === "gold" ? z.goldHoldings["24k"]?.rate : z.silverRate;
  const isRateValid = n(manualRateValue) > 0;

  const goStep = (next: GuidedStep, dir: "next" | "back") => {
    setStepDir(dir);
    setGuidedStep(next);
    requestAnimationFrame(() =>
      document.getElementById("guided-top")?.scrollIntoView({ behavior: "smooth", block: "start" })
    );
  };

  /* ---------------- HOME ---------------- */

  if (view === "home") {
    return (
      <main className="min-h-screen">
        <HelpFab />
        <HomePage onExplore={() => setView("pillars")} onSelectPillar={() => setView("pillars")} />
      </main>
    );
  }

  /* ---------------- PILLARS ---------------- */

  return (
    <main className="min-h-screen">
      <HelpFab />

      <header className="container-page pt-10 pb-4 text-center">
        <h1 className="text-2xl sm:text-3xl font-semibold">Five Pillars of Islam</h1>
        <div className="mt-6">
          <PillarTabs active={active} onChange={setActive} />
        </div>
      </header>

      <section className="container-page pb-24">
        <PillarHeader
          title="Let’s calculate your Zakat"
          subtitle="A calm step-by-step estimate"
          icon="crescent"
          hideIcon
        />

        <div id="guided-top" className="scroll-mt-24" />

        {/* ---------- GUIDED FLOW ---------- */}
        {zakatMode === "guided" && !showSummary && (
          <StepTransition stepKey={guidedStep} dir={stepDir}>
            {guidedStep === 0 && (
              <Card title="">
                <h2 className="text-xl font-semibold">Let’s calculate your Zakat together</h2>
                <p className="mt-2 text-sm text-slate-600">
                  We’ll ask a few simple questions. Your answers stay on your device.
                </p>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => goStep(1, "next")}
                    className="rounded-xl bg-emerald-800 px-5 py-2.5 text-white font-semibold"
                  >
                    Start
                  </button>
                </div>
              </Card>
            )}

            {guidedStep === 1 && (
              <Card title="">
                <h2 className="text-base font-semibold">How would you like to calculate Nisab?</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Most people choose silver, as it’s more inclusive.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setZ((s) => ({ ...s, nisabBasis: "silver" }))}
                    className="rounded-xl border px-4 py-3 font-semibold"
                  >
                    Use silver
                  </button>
                  <button
                    onClick={() => setZ((s) => ({ ...s, nisabBasis: "gold" }))}
                    className="rounded-xl border px-4 py-3 font-semibold"
                  >
                    Use gold
                  </button>
                </div>
                <div className="mt-5 flex justify-end">
                  <button
                    onClick={() => goStep(2, "next")}
                    className="rounded-xl bg-emerald-800 px-5 py-2.5 text-white font-semibold"
                  >
                    Continue
                  </button>
                </div>
              </Card>
            )}

            {guidedStep === 2 && (
              <Card title="">
                <h2 className="text-base font-semibold">
                  What’s today’s {basis === "gold" ? "gold" : "silver"} rate?
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  An estimate is perfectly fine.
                </p>
                <div className="mt-4">
                  <Field
                    label="Rate per gram"
                    prefix="₹"
                    value={manualRateValue}
                    onChange={(v) =>
                      basis === "gold"
                        ? setZ((s) => ({
                            ...s,
                            goldHoldings: {
                              ...s.goldHoldings,
                              "24k": { ...s.goldHoldings["24k"], rate: v }
                            }
                          }))
                        : setZ((s) => ({ ...s, silverRate: v }))
                    }
                  />
                </div>
                {!isRateValid && (
                  <p className="mt-2 text-xs text-amber-700">
                    Just add today’s rate to continue.
                  </p>
                )}
                <div className="mt-5 flex justify-between">
                  <button onClick={() => goStep(1, "back")} className="rounded-xl border px-5 py-2.5">
                    Back
                  </button>
                  <button
                    disabled={!isRateValid}
                    onClick={() => goStep(3, "next")}
                    className="rounded-xl bg-emerald-800 px-5 py-2.5 text-white font-semibold disabled:bg-slate-200"
                  >
                    Continue
                  </button>
                </div>
              </Card>
            )}
          </StepTransition>
        )}
      </section>
    </main>
  );
}
