"use client";

import React, { useEffect, useMemo, useRef } from "react";
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
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy}, ${hh}:${mi}:${ss}`;
  } catch {
    return "—";
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

/* ---------- Collapsible card helper (Power users flow) ---------- */
function CollapsibleCard({
  title,
  subtitle,
  open,
  onToggle,
  children
}: {
  title: string;
  subtitle: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card title="">
      <button
        type="button"
        onClick={onToggle}
        className={[
          "group w-full text-left rounded-2xl transition",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        ].join(" ")}
        aria-expanded={open}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-lg font-semibold text-slate-900">{title}</div>
            <div className="mt-1 text-sm text-slate-500">{subtitle}</div>
          </div>

          <span
            className={[
              "inline-flex h-10 w-10 items-center justify-center rounded-full border transition",
              "border-slate-200 bg-white text-slate-700",
              "group-hover:border-emerald-200 group-hover:bg-emerald-50 group-hover:text-emerald-900",
              "group-active:scale-[0.98] group-active:bg-emerald-100",
              "shadow-sm"
            ].join(" ")}
            aria-hidden="true"
          >
            {open ? "˄" : "˅"}
          </span>
        </div>
      </button>

      {open && <div className="mt-4">{children}</div>}
    </Card>
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

type ZakatSection = "nisab" | "cash" | "metals" | "other" | "deductions" | null;
type AppView = "home" | "pillars";
type ZakatMode = "guided" | "power";
type GuidedStep =
  | "nisab"
  | "rate"
  | "gold24"
  | "gold22"
  | "gold18"
  | "goldCustom"
  | "silver"
  | "cash"
  | "other"
  | "debts"
  | "summary";

function StepCard({
  title,
  subtitle,
  children,
  footer
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 soft-shadow">
      <div className="text-xs tracking-widest text-slate-500 font-semibold">GUIDED FLOW</div>
      <div className="mt-2 text-lg font-semibold text-slate-900">{title}</div>
      {subtitle ? <div className="mt-1 text-sm text-slate-600">{subtitle}</div> : null}

      <div className="mt-4">{children}</div>

      {footer ? <div className="mt-5 flex items-center justify-between gap-3">{footer}</div> : null}
    </div>
  );
}

function ModeToggle({
  mode,
  onChange
}: {
  mode: ZakatMode;
  onChange: (m: ZakatMode) => void;
}) {
  return (
    <div className="mt-4 flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onChange("guided")}
        className={[
          "rounded-xl border px-4 py-2 text-sm font-semibold transition",
          mode === "guided"
            ? "border-emerald-300 bg-emerald-50 text-emerald-900"
            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
        ].join(" ")}
      >
        Guided flow
      </button>

      <button
        type="button"
        onClick={() => onChange("power")}
        className={[
          "rounded-xl border px-4 py-2 text-sm font-semibold transition",
          mode === "power"
            ? "border-emerald-300 bg-emerald-50 text-emerald-900"
            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
        ].join(" ")}
      >
        Power users
      </button>
    </div>
  );
}

function BottomActions({
  onShare,
  onReset
}: {
  onShare: () => void;
  onReset: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40">
      <div
        className="container-page pb-4"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
      >
        <div className="max-w-md mx-auto">
          <div className="rounded-2xl border border-slate-200 bg-white p-3 soft-shadow">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onShare}
                className="w-full rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 py-3 font-semibold transition"
              >
                Share
              </button>

              <button
                type="button"
                onClick={onReset}
                className="w-full rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 py-3 font-semibold transition"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const VIEW_KEY = "fp_view_v1";
  const [view, setView] = usePersistedState<AppView>(VIEW_KEY, "home");

  // First-ever open lands on Home
  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_KEY);
      if (saved === null) setView("home");
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [active, setActive] = usePersistedState<PillarKey>("fp_active_tab_v1", "zakat");

  const [z, setZ] = usePersistedState<ZakatForm>("fp_zakat_form_v3", {
    cash: "",
    bank: "",
    goldHoldings: defaultGoldHoldings(),
    goldKarat: "24k",

    // legacy (kept)
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

  const [openSection, setOpenSection] = usePersistedState<ZakatSection>(
    "fp_zakat_open_section_v2",
    "nisab"
  );

  /* ---------- Guided flow state ---------- */
  const [zMode, setZMode] = usePersistedState<ZakatMode>("fp_zakat_mode_v1", "guided");
  const [gStep, setGStep] = usePersistedState<GuidedStep>("fp_zakat_guided_step_v1", "nisab");
  const [gIntroDismissed, setGIntroDismissed] = usePersistedState<boolean>(
    "fp_zakat_guided_intro_dismissed_v1",
    false
  );

  const pillar = PILLARS[active];
  const zakatResult = active === "zakat" ? calculateZakat(z) : null;

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
    setOpenSection("nisab");
  };

  const resetGuidedFlow = () => {
    resetForm();
    setGIntroDismissed(false);
    setGStep("nisab");
    setZMode("guided");
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

  const handleFetchOnline = async () => {
    try {
      // mock values (keep your real fetch later)
      const mockGold = 14413.5;
      const mockSilver = 165.25;

      if (z.nisabBasis === "gold") {
        setZ((s) => ({
          ...s,
          goldHoldings: {
            ...(s.goldHoldings ?? defaultGoldHoldings()),
            "24k": { ...(s.goldHoldings?.["24k"] ?? { grams: "", rate: "" }), rate: mockGold }
          }
        }));
      } else {
        setZ((s) => ({ ...s, silverRate: mockSilver }));
      }

      setLastFetchedAt(Date.now());
    } catch {
      alert("Could not fetch rates. You can still enter the rate manually.");
    }
  };

  const basis = z.nisabBasis;
  const manualRateValue = basis === "gold" ? (z.goldHoldings?.["24k"]?.rate ?? "") : z.silverRate;
  const manualRateLabel = basis === "gold" ? "Gold rate (₹/g)" : "Silver rate (₹/g)";

  /* ---------- Breakdown values (used by both flows) ---------- */
  const h = z.goldHoldings ?? defaultGoldHoldings();
  const gold24Value = n(h["24k"].grams) * n(h["24k"].rate) * 1.0;
  const gold22Value = n(h["22k"].grams) * n(h["22k"].rate) * 0.916;
  const gold18Value = n(h["18k"].grams) * n(h["18k"].rate) * 0.75;
  const goldCustomValue =
    n(h.custom.grams) *
    n(h.custom.rate) *
    Math.max(0, Math.min(1, n(h.custom.purityPct) / 100));

  const silverValue = n(z.silverGrams) * n(z.silverRate);
  const cashTotal = n(z.cash) + n(z.bank);
  const otherTotal = n(z.investments) + n(z.businessAssets) + n(z.moneyLent);
  const debtsTotal = n(z.debts);

  const metalsTotal = gold24Value + gold22Value + gold18Value + goldCustomValue + silverValue;

  const estimatedNisab =
    zakatResult && zakatResult.nisab > 0 ? `₹ ${formatINR(zakatResult.nisab)}` : "₹ —";

  const nisabSubtitle =
    zakatResult?.breakdown?.nisabRateMissing
      ? `Add ${basis} rate`
      : estimatedNisab !== "₹ —"
      ? `Threshold: ${estimatedNisab}`
      : "Not entered";

  const cashSubtitle = cashTotal > 0 ? `₹ ${formatINR(cashTotal)}` : "Not entered";
  const metalsSubtitle =
    metalsTotal > 0 ? `₹ ${formatINR(metalsTotal)}` : "Not entered";
  const otherSubtitle = otherTotal > 0 ? `₹ ${formatINR(otherTotal)}` : "Not entered";
  const deductionsSubtitle = debtsTotal > 0 ? `₹ ${formatINR(debtsTotal)}` : "None";

  const toggleSection = (section: Exclude<ZakatSection, null>) => {
    setOpenSection((curr) => (curr === section ? null : section));
  };

  /* ---------- Gold tab helpers (Power users) ---------- */
  const activeKarat: GoldKarat = (z.goldKarat ?? "24k") as GoldKarat;

  const setActiveKarat = (k: GoldKarat) => {
    setZ((s: any) => ({ ...s, goldKarat: k }));
  };

  const updateHolding = (k: GoldKarat, patch: Partial<any>) => {
    setZ((s: any) => {
      const curr = (s.goldHoldings ?? defaultGoldHoldings()) as GoldHoldings;

      if (k === "custom") {
        return { ...s, goldHoldings: { ...curr, custom: { ...curr.custom, ...patch } } };
      }

      return { ...s, goldHoldings: { ...curr, [k]: { ...(curr as any)[k], ...patch } } };
    });
  };

  const activeHolding =
    activeKarat === "custom"
      ? (z.goldHoldings?.custom ?? { grams: "", rate: "", purityPct: "" })
      : ((z.goldHoldings as any)?.[activeKarat] ?? { grams: "", rate: "" });

  /* When selecting from homepage, switch view + set active */
  const goToPillar = (k: PillarKey) => {
    setActive(k);
    setView("pillars");
  };

  /* ---------- HOME VIEW ---------- */
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

      {/* Home icon (left) aligned with HelpFab */}
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

      <section className="container-page pb-24">
        <PillarHeader
          title={active === "zakat" ? "Calculate Zakat" : pillar.title}
          subtitle={pillar.subtitle}
          icon={pillar.icon}
          hideIcon={active === "zakat"}
        />

        {/* Non-Zakat pillars */}
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
            {/* Mode selector (under the Zakat heading) */}
            <ModeToggle
              mode={zMode}
              onChange={(m) => {
                setZMode(m);
                if (m === "guided") {
                  // keep their current progress; do not force reset
                  // (they can hit "Calculate again" on summary if they want)
                }
              }}
            />

            {/* ---------- GUIDED FLOW ---------- */}
            {zMode === "guided" ? (
              <div className="mt-6 space-y-4 max-w-2xl mx-auto">
                {/* Intro card (no Power users button inside) */}
                {!gIntroDismissed && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 soft-shadow">
                    <div className="text-xs tracking-widest text-slate-500 font-semibold">GUIDED FLOW</div>
                    <div className="mt-2 text-lg font-semibold text-slate-900">
                      Let’s calculate your Zakat step-by-step
                    </div>
                    <div className="mt-2 text-sm text-slate-600">
                      Answer a few quick questions. You can switch to Power users anytime.
                    </div>
                  </div>
                )}

                {/* Step: choose nisab */}
                {gStep === "nisab" && (
                  <StepCard
                    title="1) Choose your Nisab basis"
                    subtitle="Do you want to calculate using silver or gold?"
                    footer={
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            // ensure something selected (default is silver)
                            setGIntroDismissed(true); // ✅ hide intro after first Next
                            setGStep("rate");
                          }}
                          className="ml-auto rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white px-4 py-2 text-sm font-semibold transition"
                        >
                          Next
                        </button>
                      </>
                    }
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setZ((s) => ({ ...s, nisabBasis: "silver" }))}
                        className={[
                          "rounded-xl border px-3 py-3 text-sm font-semibold transition",
                          z.nisabBasis === "silver"
                            ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                            : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                        ].join(" ")}
                      >
                        Silver (612.36g)
                      </button>

                      <button
                        type="button"
                        onClick={() => setZ((s) => ({ ...s, nisabBasis: "gold" }))}
                        className={[
                          "rounded-xl border px-3 py-3 text-sm font-semibold transition",
                          z.nisabBasis === "gold"
                            ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                            : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                        ].join(" ")}
                      >
                        Gold (87.48g)
                      </button>
                    </div>
                  </StepCard>
                )}

                {/* Step: rate */}
                {gStep === "rate" && (
                  <StepCard
                    title="2) Enter today’s rate"
                    subtitle={`We’ll use this to estimate your Nisab threshold (${basis}).`}
                    footer={
                      <>
                        <button
                          type="button"
                          onClick={() => setGStep("nisab")}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const v = Number(manualRateValue);
                            if (!Number.isFinite(v) || v <= 0) {
                              alert("Please enter a valid rate to continue.");
                              return;
                            }
                            setGStep(basis === "gold" ? "gold24" : "silver");
                          }}
                          className="ml-auto rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white px-4 py-2 text-sm font-semibold transition"
                        >
                          Next
                        </button>
                      </>
                    }
                  >
                    <div className="rounded-xl border border-slate-200 p-4">
                      <div className="text-sm font-semibold text-slate-900">
                        {manualRateLabel} <span className="text-slate-500">(₹/g)</span>
                      </div>

                      <div className="mt-2">
                        <Field
                          label=""
                          prefix="₹"
                          value={manualRateValue}
                          onChange={(v) => {
                            if (basis === "gold") {
                              setZ((s: any) => ({
                                ...s,
                                goldHoldings: {
                                  ...(s.goldHoldings ?? defaultGoldHoldings()),
                                  "24k": { ...(s.goldHoldings?.["24k"] ?? { grams: "", rate: "" }), rate: v }
                                }
                              }));
                            } else {
                              setZ((s: any) => ({ ...s, silverRate: v }));
                            }
                          }}
                        />
                      </div>

                      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                        <span className="font-semibold">Estimated Nisab threshold:</span>{" "}
                        <span className="font-semibold">{estimatedNisab}</span>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="text-xs text-slate-500">
                          Last updated:{" "}
                          <span className="font-medium text-slate-700">{formatDateTime(lastFetchedAt)}</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleFetchOnline}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                          Auto-fill today’s rate
                        </button>
                      </div>
                    </div>
                  </StepCard>
                )}

                {/* Gold steps (only if gold basis) */}
                {basis === "gold" && gStep === "gold24" && (
                  <StepCard
                    title="3) 24K gold"
                    subtitle="How many grams of 24K gold do you have?"
                    footer={
                      <>
                        <button
                          type="button"
                          onClick={() => setGStep("rate")}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          onClick={() => setGStep("gold22")}
                          className="ml-auto rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white px-4 py-2 text-sm font-semibold transition"
                        >
                          Next
                        </button>
                      </>
                    }
                  >
                    <div className="grid grid-cols-1 gap-3">
                      <Field
                        label="24K gold (grams)"
                        suffix="g"
                        value={h["24k"].grams}
                        onChange={(v) => updateHolding("24k", { grams: v })}
                      />
                      <Field
                        label="24K gold rate (₹/g)"
                        prefix="₹"
                        value={h["24k"].rate}
                        onChange={(v) => updateHolding("24k", { rate: v })}
                      />
                    </div>
                  </StepCard>
                )}

                {basis === "gold" && gStep === "gold22" && (
                  <StepCard
                    title="4) 22K gold"
                    subtitle="How many grams of 22K gold do you have?"
                    footer={
                      <>
                        <button
                          type="button"
                          onClick={() => setGStep("gold24")}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          onClick={() => setGStep("gold18")}
                          className="ml-auto rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white px-4 py-2 text-sm font-semibold transition"
                        >
                          Next
                        </button>
                      </>
                    }
                  >
                    <div className="grid grid-cols-1 gap-3">
                      <Field
                        label="22K gold (grams)"
                        suffix="g"
                        value={h["22k"].grams}
                        onChange={(v) => updateHolding("22k", { grams: v })}
                      />
                      <Field
                        label="22K gold rate (₹/g)"
                        prefix="₹"
                        value={h["22k"].rate}
                        onChange={(v) => updateHolding("22k", { rate: v })}
                      />
                    </div>
                  </StepCard>
                )}

                {basis === "gold" && gStep === "gold18" && (
                  <StepCard
                    title="5) 18K gold"
                    subtitle="How many grams of 18K gold do you have?"
                    footer={
                      <>
                        <button
                          type="button"
                          onClick={() => setGStep("gold22")}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          onClick={() => setGStep("goldCustom")}
                          className="ml-auto rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white px-4 py-2 text-sm font-semibold transition"
                        >
                          Next
                        </button>
                      </>
                    }
                  >
                    <div className="grid grid-cols-1 gap-3">
                      <Field
                        label="18K gold (grams)"
                        suffix="g"
                        value={h["18k"].grams}
                        onChange={(v) => updateHolding("18k", { grams: v })}
                      />
                      <Field
                        label="18K gold rate (₹/g)"
                        prefix="₹"
                        value={h["18k"].rate}
                        onChange={(v) => updateHolding("18k", { rate: v })}
                      />
                    </div>
                  </StepCard>
                )}

                {basis === "gold" && gStep === "goldCustom" && (
                  <StepCard
                    title="6) Any custom gold?"
                    subtitle="If you have any other purity (e.g., 20K), enter it here. Otherwise keep it blank."
                    footer={
                      <>
                        <button
                          type="button"
                          onClick={() => setGStep("gold18")}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          onClick={() => setGStep("silver")}
                          className="ml-auto rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white px-4 py-2 text-sm font-semibold transition"
                        >
                          Next
                        </button>
                      </>
                    }
                  >
                    <div className="grid grid-cols-1 gap-3">
                      <Field
                        label="Custom purity (%)"
                        hint="Example: 83.3 for 20K"
                        suffix="%"
                        value={h.custom.purityPct}
                        onChange={(v) => updateHolding("custom", { purityPct: v })}
                      />
                      <Field
                        label="Custom gold (grams)"
                        suffix="g"
                        value={h.custom.grams}
                        onChange={(v) => updateHolding("custom", { grams: v })}
                      />
                      <Field
                        label="Custom gold rate (₹/g)"
                        prefix="₹"
                        value={h.custom.rate}
                        onChange={(v) => updateHolding("custom", { rate: v })}
                      />
                    </div>
                  </StepCard>
                )}

                {/* Silver step (always asked) */}
                {gStep === "silver" && (
                  <StepCard
                    title={basis === "gold" ? "7) Silver" : "3) Silver"}
                    subtitle="Do you have any silver?"
                    footer={
                      <>
                        <button
                          type="button"
                          onClick={() => setGStep(basis === "gold" ? "goldCustom" : "rate")}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          onClick={() => setGStep("cash")}
                          className="ml-auto rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white px-4 py-2 text-sm font-semibold transition"
                        >
                          Next
                        </button>
                      </>
                    }
                  >
                    <div className="grid grid-cols-1 gap-3">
                      <Field
                        label="Silver (grams)"
                        suffix="g"
                        value={z.silverGrams}
                        onChange={(v) => setZ((s: any) => ({ ...s, silverGrams: v }))}
                      />
                      <Field
                        label="Silver rate (₹/g)"
                        prefix="₹"
                        value={z.silverRate}
                        onChange={(v) => setZ((s: any) => ({ ...s, silverRate: v }))}
                      />
                    </div>
                  </StepCard>
                )}

                {/* Cash */}
                {gStep === "cash" && (
                  <StepCard
                    title="Cash & Bank"
                    subtitle="Enter your cash and bank balances."
                    footer={
                      <>
                        <button
                          type="button"
                          onClick={() => setGStep("silver")}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          onClick={() => setGStep("other")}
                          className="ml-auto rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white px-4 py-2 text-sm font-semibold transition"
                        >
                          Next
                        </button>
                      </>
                    }
                  >
                    <div className="grid grid-cols-1 gap-3">
                      <Field
                        label="Cash in hand"
                        prefix="₹"
                        value={z.cash}
                        onChange={(v) => setZ((s: any) => ({ ...s, cash: v }))}
                      />
                      <Field
                        label="Cash in bank"
                        prefix="₹"
                        value={z.bank}
                        onChange={(v) => setZ((s: any) => ({ ...s, bank: v }))}
                      />
                    </div>
                  </StepCard>
                )}

                {/* Other assets */}
                {gStep === "other" && (
                  <StepCard
                    title="Other assets"
                    subtitle="Investments, business assets, or money you lent."
                    footer={
                      <>
                        <button
                          type="button"
                          onClick={() => setGStep("cash")}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          onClick={() => setGStep("debts")}
                          className="ml-auto rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white px-4 py-2 text-sm font-semibold transition"
                        >
                          Next
                        </button>
                      </>
                    }
                  >
                    <div className="grid grid-cols-1 gap-3">
                      <Field
                        label="Investments / savings"
                        prefix="₹"
                        value={z.investments}
                        onChange={(v) => setZ((s: any) => ({ ...s, investments: v }))}
                      />
                      <Field
                        label="Business assets"
                        prefix="₹"
                        value={z.businessAssets}
                        onChange={(v) => setZ((s: any) => ({ ...s, businessAssets: v }))}
                      />
                      <Field
                        label="Money lent to others"
                        prefix="₹"
                        value={z.moneyLent}
                        onChange={(v) => setZ((s: any) => ({ ...s, moneyLent: v }))}
                      />
                    </div>
                  </StepCard>
                )}

                {/* Debts */}
                {gStep === "debts" && (
                  <StepCard
                    title="Deductions"
                    subtitle="Enter debts / liabilities due soon."
                    footer={
                      <>
                        <button
                          type="button"
                          onClick={() => setGStep("other")}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          onClick={() => setGStep("summary")}
                          className="ml-auto rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white px-4 py-2 text-sm font-semibold transition"
                        >
                          Calculate Zakaat
                        </button>
                      </>
                    }
                  >
                    <div className="grid grid-cols-1 gap-3">
                      <Field
                        label="Debts & liabilities"
                        prefix="₹"
                        value={z.debts}
                        onChange={(v) => setZ((s: any) => ({ ...s, debts: v }))}
                      />
                    </div>
                  </StepCard>
                )}

                {/* Summary */}
                {gStep === "summary" && zakatResult && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 soft-shadow">
                    <div className="text-lg font-semibold text-slate-900">Your Zakat Summary</div>
                    <div className="mt-2 text-sm text-slate-600">
                      This is based on the values you entered. You can edit answers or calculate again.
                    </div>

                    <div className="mt-5 rounded-2xl border border-slate-200 p-5 bg-white">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="text-sm text-slate-600">Zakat to pay</div>
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

                      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-sm font-semibold text-slate-900">Breakdown</div>

                        <div className="mt-3 space-y-2 text-sm text-slate-700">
                          <div className="flex items-center justify-between">
                            <span>Cash & bank</span>
                            <span>₹ {formatINR(cashTotal)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Gold (24K)</span>
                            <span>₹ {formatINR(gold24Value)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Gold (22K)</span>
                            <span>₹ {formatINR(gold22Value)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Gold (18K)</span>
                            <span>₹ {formatINR(gold18Value)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Gold (custom)</span>
                            <span>₹ {formatINR(goldCustomValue)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Silver</span>
                            <span>₹ {formatINR(silverValue)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Other assets</span>
                            <span>₹ {formatINR(otherTotal)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Deductions</span>
                            <span>− ₹ {formatINR(debtsTotal)}</span>
                          </div>

                          <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between font-semibold">
                            <span>Net zakatable wealth</span>
                            <span>₹ {formatINR(zakatResult.net)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={resetGuidedFlow}
                        className="rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white px-4 py-2 text-sm font-semibold transition"
                      >
                        Calculate again
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setGStep("nisab");
                          setGIntroDismissed(false);
                        }}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                      >
                        Edit answers
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ---------- POWER USERS FLOW (keep collapsible cards + bottom buttons) ---------- */
              <>
                <div className="mt-6 space-y-4">
                  <CollapsibleCard
                    title="Nisab & Eligibility"
                    subtitle={nisabSubtitle}
                    open={openSection === "nisab"}
                    onToggle={() => toggleSection("nisab")}
                  >
                    <div className="rounded-xl border border-slate-200 p-4">
                      <div className="text-sm font-semibold text-slate-900">Choose your Nisab basis</div>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setZ((s) => ({ ...s, nisabBasis: "silver" }))}
                          className={[
                            "rounded-xl border px-3 py-2 text-sm font-semibold transition",
                            z.nisabBasis === "silver"
                              ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                              : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                          ].join(" ")}
                        >
                          Silver (612.36g)
                        </button>

                        <button
                          type="button"
                          onClick={() => setZ((s) => ({ ...s, nisabBasis: "gold" }))}
                          className={[
                            "rounded-xl border px-3 py-2 text-sm font-semibold transition",
                            z.nisabBasis === "gold"
                              ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                              : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                          ].join(" ")}
                        >
                          Gold (87.48g)
                        </button>
                      </div>

                      <p className="mt-3 text-xs leading-relaxed text-slate-600">
                        Nisab is the minimum threshold that determines whether Zakat is due. We compare your{" "}
                        <b>total net zakatable wealth</b> against Nisab.
                      </p>

                      <div className="mt-4">
                        <div className="text-sm font-semibold text-slate-900">
                          {manualRateLabel} <span className="text-slate-500">(Enter today’s rate)</span>
                        </div>
                        <div className="mt-2">
                          <Field
                            label=""
                            prefix="₹"
                            value={manualRateValue}
                            onChange={(v) => {
                              if (basis === "gold") {
                                setZ((s: any) => ({
                                  ...s,
                                  goldHoldings: {
                                    ...(s.goldHoldings ?? defaultGoldHoldings()),
                                    "24k": {
                                      ...(s.goldHoldings?.["24k"] ?? { grams: "", rate: "" }),
                                      rate: v
                                    }
                                  }
                                }));
                              } else {
                                setZ((s: any) => ({ ...s, silverRate: v }));
                              }
                            }}
                          />
                        </div>

                        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                          <span className="font-semibold">Estimated Nisab threshold:</span>{" "}
                          <span className="font-semibold">{estimatedNisab}</span>{" "}
                          <span className="text-slate-500">
                            (Based on {basis === "gold" ? "87.48g gold" : "612.36g silver"} × your rate)
                          </span>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-3">
                          <div className="text-xs text-slate-500">
                            Last updated:{" "}
                            <span className="font-medium text-slate-700">{formatDateTime(lastFetchedAt)}</span>
                          </div>

                          <button
                            type="button"
                            onClick={handleFetchOnline}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                          >
                            Auto-fill today&apos;s rate
                          </button>
                        </div>
                      </div>
                    </div>
                  </CollapsibleCard>

                  <CollapsibleCard
                    title="Cash & Bank"
                    subtitle={cashSubtitle}
                    open={openSection === "cash"}
                    onToggle={() => toggleSection("cash")}
                  >
                    <div className="space-y-3">
                      <Field
                        label="Cash in hand"
                        hint="Money you currently have available."
                        prefix="₹"
                        value={z.cash}
                        onChange={(v) => setZ((s: any) => ({ ...s, cash: v }))}
                      />
                      <Field
                        label="Cash in bank"
                        hint="Total balance across your bank accounts"
                        prefix="₹"
                        value={z.bank}
                        onChange={(v) => setZ((s: any) => ({ ...s, bank: v }))}
                      />
                    </div>
                  </CollapsibleCard>

                  <CollapsibleCard
                    title="Gold & Silver"
                    subtitle={metalsSubtitle}
                    open={openSection === "metals"}
                    onToggle={() => toggleSection("metals")}
                  >
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs font-semibold tracking-wide text-slate-500">Select Gold Purity</div>

                        <div className="mt-2 grid grid-cols-4 gap-2">
                          {(["24k", "22k", "18k", "custom"] as const).map((k) => (
                            <button
                              key={k}
                              type="button"
                              onClick={() => setActiveKarat(k)}
                              className={[
                                "rounded-xl border px-3 py-2 text-sm font-semibold transition",
                                String(activeKarat).toLowerCase() === k
                                  ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                                  : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                              ].join(" ")}
                            >
                              {k === "custom" ? "Custom" : k.toUpperCase()}
                            </button>
                          ))}
                        </div>

                        <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                          Add the grams you own and the per gram rate for each purity.
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="text-xs font-semibold tracking-wide text-slate-500">
                          {activeKarat === "custom" ? "CUSTOM GOLD" : `${activeKarat.toUpperCase()} GOLD`}
                        </div>

                        {activeKarat === "custom" && (
                          <div className="mt-3">
                            <Field
                              label="Custom purity (%)"
                              hint="Example: 91.6 for 22k, 75 for 18k"
                              suffix="%"
                              value={(activeHolding as any).purityPct ?? ""}
                              onChange={(v) => updateHolding("custom", { purityPct: v })}
                            />
                          </div>
                        )}

                        <div className="mt-3 space-y-3">
                          <Field
                            label="Gold (grams)"
                            hint="Weight of gold you own for this purity."
                            suffix="g"
                            value={(activeHolding as any).grams ?? ""}
                            onChange={(v) => updateHolding(activeKarat, { grams: v })}
                          />

                          <Field
                            label="Gold rate (₹/g)"
                            hint="Current market price per gram for this purity."
                            prefix="₹"
                            value={(activeHolding as any).rate ?? ""}
                            onChange={(v) => updateHolding(activeKarat, { rate: v })}
                          />
                        </div>

                        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                          Tip: Select the gold purity, then enter grams and rate for that purity.
                        </div>
                      </div>

                      <Field
                        label="Silver (grams)"
                        hint="Weight of silver you own."
                        suffix="g"
                        value={z.silverGrams}
                        onChange={(v) => setZ((s: any) => ({ ...s, silverGrams: v }))}
                      />

                      <Field
                        label="Silver rate (₹/g)"
                        hint="Current market price per gram."
                        prefix="₹"
                        value={z.silverRate}
                        onChange={(v) => setZ((s: any) => ({ ...s, silverRate: v }))}
                      />
                    </div>
                  </CollapsibleCard>

                  <CollapsibleCard
                    title="Other Assets"
                    subtitle={otherSubtitle}
                    open={openSection === "other"}
                    onToggle={() => toggleSection("other")}
                  >
                    <div className="space-y-3">
                      <Field
                        label="Investments / savings"
                        hint="Stocks, mutual funds, savings plans, etc."
                        prefix="₹"
                        value={z.investments}
                        onChange={(v) => setZ((s: any) => ({ ...s, investments: v }))}
                      />
                      <Field
                        label="Business assets"
                        hint="Inventory, goods held for sale, business cash, receivables."
                        prefix="₹"
                        value={z.businessAssets}
                        onChange={(v) => setZ((s: any) => ({ ...s, businessAssets: v }))}
                      />
                      <Field
                        label="Money lent to others"
                        hint="Money you expect to receive back."
                        prefix="₹"
                        value={z.moneyLent}
                        onChange={(v) => setZ((s: any) => ({ ...s, moneyLent: v }))}
                      />
                    </div>
                  </CollapsibleCard>

                  <CollapsibleCard
                    title="Deductions"
                    subtitle={deductionsSubtitle}
                    open={openSection === "deductions"}
                    onToggle={() => toggleSection("deductions")}
                  >
                    <div className="space-y-3">
                      <Field
                        label="Debts & liabilities"
                        hint="Bills or loans you must repay soon."
                        prefix="₹"
                        value={z.debts}
                        onChange={(v) => setZ((s: any) => ({ ...s, debts: v }))}
                      />
                    </div>
                  </CollapsibleCard>

                  <Accordion title="How Zakat is calculated">
                    <div className="text-sm text-slate-600 leading-relaxed space-y-2">
                      <p>
                        Zakat is estimated at <b>2.5%</b> of your <b>net zakatable wealth</b>.
                      </p>
                      <p>
                        <b>Net</b> = (Cash + Bank + Gold value + Silver value + Investments + Business assets + Money lent)
                        − Debts
                      </p>
                      <p>
                        Zakat is <b>due</b> if Net is ≥ the <b>Nisab</b> threshold (based on your selected gold/silver rate).
                      </p>
                    </div>
                  </Accordion>

                  {/* spacer for fixed buttons */}
                  <div style={{ height: 120 }} />
                </div>

                {/* ✅ Keep bottom buttons (Share + Reset) ONLY in Power users flow */}
                <BottomActions onShare={handleShare} onReset={resetForm} />
              </>
            )}
          </>
        )}
      </section>
    </main>
  );
}
