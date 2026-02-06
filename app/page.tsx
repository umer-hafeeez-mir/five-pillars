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

/* ---------------- UI bits ---------------- */

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
/**
 * Guided steps:
 * 0 intro
 * 1 nisab basis
 * 2 rate (mandatory based on basis)
 * 3 cash
 * 4 do you own gold? (NEW)
 * 5 metals (inline yes/no toggle inside this step too)
 * 6 other assets
 * 7 deductions -> then summary
 */
type GuidedStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

/* =================== Page =================== */

export default function Page() {
  const VIEW_KEY = "fp_view_v1";
  const [view, setView] = usePersistedState<AppView>(VIEW_KEY, "home");

  // Ensure first-ever open lands on Home (if no key present)
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

  // Power-user accordion open state (kept)
  const [openSection, setOpenSection] = usePersistedState<ZakatSection>(
    "fp_zakat_open_section_v2",
    "nisab"
  );

  // Mode + Guided flow state
  const [zakatMode, setZakatMode] = usePersistedState<ZakatMode>("fp_zakat_mode_v1", "guided");
  const [guidedStep, setGuidedStep] = usePersistedState<GuidedStep>("fp_guided_step_v2", 0); // bumped key
  const [ownsGold, setOwnsGold] = usePersistedState<boolean>("fp_guided_owns_gold_v1", true);

  // Summary visibility (both modes)
  const [showSummary, setShowSummary] = usePersistedState<boolean>("fp_zakat_summary_v1", false);

  const pillar = PILLARS[active];
  const zakatResult = active === "zakat" ? calculateZakat(z) : null;

  const resetZakatState = () => {
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
    setGuidedStep(0);
    setOwnsGold(true);
    setShowSummary(false);
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
      // mock values
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

  const toggleSection = (section: Exclude<ZakatSection, null>) => {
    setOpenSection((curr) => (curr === section ? null : section));
  };

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

  // Derived values
  const basis = z.nisabBasis;
  const manualRateValue = basis === "gold" ? (z.goldHoldings?.["24k"]?.rate ?? "") : z.silverRate;
  const manualRateLabel = basis === "gold" ? "Gold rate (₹/g)" : "Silver rate (₹/g)";
  const isRateValid = n(manualRateValue) > 0;

  const estimatedNisab =
    zakatResult && zakatResult.nisab > 0 ? `₹ ${formatINR(zakatResult.nisab)}` : "₹ —";

  const cashTotal = n(z.cash) + n(z.bank);

  const h = z.goldHoldings ?? defaultGoldHoldings();
  const goldValueApprox =
    n(h["24k"].grams) * n(h["24k"].rate) * 1.0 +
    n(h["22k"].grams) * n(h["22k"].rate) * 0.916 +
    n(h["18k"].grams) * n(h["18k"].rate) * 0.75 +
    n(h.custom.grams) * n(h.custom.rate) * Math.max(0, Math.min(1, n(h.custom.purityPct) / 100));

  const silverValueApprox = n(z.silverGrams) * n(z.silverRate);
  const metalsTotal = goldValueApprox + silverValueApprox;

  const otherTotal = n(z.investments) + n(z.businessAssets) + n(z.moneyLent);
  const debtsTotal = n(z.debts);

  const nisabSubtitle =
    zakatResult?.breakdown?.nisabRateMissing
      ? `Add ${basis} rate`
      : estimatedNisab !== "₹ —"
      ? `Threshold: ${estimatedNisab}`
      : "Not entered";

  const cashSubtitle = cashTotal > 0 ? `₹ ${formatINR(cashTotal)}` : "Not entered";
  const metalsSubtitle =
    metalsTotal > 0
      ? `₹ ${formatINR(metalsTotal)}`
      : goldValueApprox > 0 ||
        silverValueApprox > 0 ||
        n(h["24k"].rate) > 0 ||
        n(h["22k"].rate) > 0 ||
        n(h["18k"].rate) > 0 ||
        n(h.custom.rate) > 0 ||
        n(z.silverRate) > 0
      ? "Entered"
      : "Not entered";

  const otherSubtitle = otherTotal > 0 ? `₹ ${formatINR(otherTotal)}` : "Not entered";
  const deductionsSubtitle = debtsTotal > 0 ? `₹ ${formatINR(debtsTotal)}` : "None";

  // Home -> pillars
  const goToPillar = (k: PillarKey) => {
    setActive(k);
    setView("pillars");
  };

  /* ---------------- HOME VIEW ---------------- */
  if (view === "home") {
    return (
      <main className="min-h-screen">
        <HelpFab />
        <HomePage onExplore={() => setView("pillars")} onSelectPillar={(k) => goToPillar(k)} />
      </main>
    );
  }

  /* ---------------- PILLARS VIEW ---------------- */
  return (
    <main className="min-h-screen">
      <HelpFab />

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
  title={
    active === "zakat" ? (
      <div className="flex items-center justify-center gap-3">
        <span>Calculate Zakat</span>

        <span
          className={[
            "inline-flex items-center rounded-full px-2.5 py-1",
            "text-[11px] font-semibold tracking-wide",
            "border border-amber-200 bg-amber-50 text-amber-900"
          ].join(" ")}
        >
          In Early Access
        </span>
      </div>
    ) : (
      pillar.title
    )
  }
  subtitle={pillar.subtitle}
  icon={pillar.icon}
  hideIcon={active === "zakat"}
        />

        {/* Non-zakat pillars unchanged */}
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
            {/* Mode toggle */}
            <div className="mt-4 flex items-center justify-center">
              <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => {
                    setZakatMode("guided");
                    setShowSummary(false);
                    if (guidedStep < 0) setGuidedStep(0);
                  }}
                  className={[
                    "px-4 py-2 text-sm font-semibold rounded-lg transition",
                    zakatMode === "guided"
                      ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                      : "text-slate-700"
                  ].join(" ")}
                >
                  Guided flow
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setZakatMode("power");
                    setShowSummary(false);
                  }}
                  className={[
                    "px-4 py-2 text-sm font-semibold rounded-lg transition",
                    zakatMode === "power"
                      ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                      : "text-slate-700"
                  ].join(" ")}
                >
                  Power users
                </button>
              </div>
            </div>

            {/* SUMMARY (used by both modes) */}
            {showSummary ? (
              <div className="mt-6 max-w-3xl mx-auto">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 soft-shadow">
                  <div className="text-base font-semibold text-slate-900">Your Zakat Summary</div>
                  <div className="mt-1 text-sm text-slate-600">
                    This is based on the values you entered. You can edit answers or calculate again.
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm text-slate-600">
                          {zakatResult?.eligible ? "Zakat to pay" : "Zakat (not due)"}
                        </div>
                        <div className="mt-1 text-3xl font-semibold text-emerald-900">
                          ₹ {formatINR(zakatResult?.eligible ? zakatResult?.zakat ?? 0 : 0)}
                        </div>
                        <div className="mt-2 text-xs text-slate-600">
                          Net: ₹ {formatINR(zakatResult?.net ?? 0)} · Nisab: ₹ {formatINR(zakatResult?.nisab ?? 0)} (
                          {zakatResult?.basis ?? basis})
                        </div>
                        {zakatResult?.breakdown?.nisabRateMissing ? (
                          <div className="mt-2 text-xs text-amber-700">
                            Add a valid {zakatResult?.basis ?? basis} rate to confirm Nisab and due status.
                          </div>
                        ) : null}
                      </div>

                      <span
                        className={[
                          "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold",
                          zakatResult?.eligible
                            ? "border-emerald-200 bg-emerald-100 text-emerald-900"
                            : "border-slate-200 bg-white text-slate-700"
                        ].join(" ")}
                      >
                        {zakatResult?.breakdown?.nisabRateMissing
                          ? "Needs rate"
                          : zakatResult?.eligible
                          ? "Due"
                          : "Not due"}
                      </span>
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="text-sm font-semibold text-slate-900">Breakdown</div>

                      <div className="mt-3 space-y-2 text-sm">
                        <Row label="Cash & bank" value={`₹ ${formatINR(cashTotal)}`} />
                        <Row label="Gold (24K)" value={`₹ ${formatINR(n(h["24k"].grams) * n(h["24k"].rate))}`} />
                        <Row label="Gold (22K)" value={`₹ ${formatINR(n(h["22k"].grams) * n(h["22k"].rate))}`} />
                        <Row label="Gold (18K)" value={`₹ ${formatINR(n(h["18k"].grams) * n(h["18k"].rate))}`} />
                        <Row label="Silver" value={`₹ ${formatINR(silverValueApprox)}`} />
                        <Row label="Other assets" value={`₹ ${formatINR(otherTotal)}`} />
                        <Row label="Deductions" value={`– ₹ ${formatINR(debtsTotal)}`} muted />

                        <div className="pt-2 border-t border-slate-200" />

                        <Row label="Net zakatable wealth" value={`₹ ${formatINR(zakatResult?.net ?? 0)}`} strong />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        resetZakatState();
                        setZakatMode("guided");
                        setGuidedStep(0);
                      }}
                      className="rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white px-5 py-2.5 text-sm font-semibold transition"
                    >
                      Calculate again
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowSummary(false);
                        if (zakatMode === "guided") setGuidedStep((s) => (s === 0 ? 1 : s));
                      }}
                      className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-800 transition"
                    >
                      Edit answers
                    </button>
                  </div>
                </div>

                {/* Sticky buttons below summary: Share + Reset */}
                <BottomBar>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="w-full rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 py-3 font-semibold transition"
                  >
                    Share
                  </button>
                  <button
                    type="button"
                    onClick={resetZakatState}
                    className="w-full rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 py-3 font-semibold transition"
                  >
                    Reset
                  </button>
                </BottomBar>
              </div>
            ) : zakatMode === "power" ? (
              /* ================= POWER USERS ================= */
              <div className="mt-6 max-w-3xl mx-auto space-y-4">
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

                      {!isRateValid ? (
                        <div className="mt-2 text-xs text-amber-700">
                          Please enter a valid {basis === "gold" ? "gold" : "silver"} rate to calculate.
                        </div>
                      ) : null}

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
                          Auto-fill today's rate
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
                        Tip: Select the gold purity (24K, 22K, or 18K), then enter the grams and rate for the selected
                        purity.
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
                    <p className="text-sm">
                      <b>Net</b> = (Cash + Bank + Gold value + Silver value + Investments + Business assets + Money lent)
                      − Debts
                    </p>
                    <p>
                      Zakat is <b>due</b> if Net is ≥ the <b>Nisab</b> threshold (based on your selected gold/silver rate).
                    </p>
                  </div>
                </Accordion>

                {/* POWER USERS bottom buttons: Calculate Zakat + Share + Reset */}
                <BottomBar>
                  <button
                    type="button"
                    disabled={!isRateValid}
                    onClick={() => {
                      if (!isRateValid) return;
                      setShowSummary(true);
                    }}
                    className={[
                      "w-full rounded-xl py-3 font-semibold transition",
                      !isRateValid
                        ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                        : "bg-emerald-800 hover:bg-emerald-900 text-white"
                    ].join(" ")}
                  >
                    Calculate Zakat
                  </button>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="w-full rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 py-3 font-semibold transition"
                  >
                    Share
                  </button>
                  <button
                    type="button"
                    onClick={resetZakatState}
                    className="w-full rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 py-3 font-semibold transition"
                  >
                    Reset
                  </button>
                </BottomBar>
              </div>
            ) : (
              /* ================= GUIDED FLOW ================= */
              <div className="mt-6 max-w-3xl mx-auto space-y-4">
                {/* Intro card */}
                {guidedStep === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 soft-shadow">
                    <div className="text-[11px] tracking-widest text-slate-500 font-semibold">GUIDED FLOW</div>
                    <div className="mt-2 text-xl font-semibold text-slate-900">
                      Let’s calculate your Zakat step-by-step
                    </div>
                    <div className="mt-2 text-sm text-slate-600">
                      Answer a few quick questions, or switch to Power Users mode for a self-serve experience.
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setGuidedStep(1)}
                        className="rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white px-5 py-2.5 text-sm font-semibold transition"
                      >
                        Start
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* Step 1: Nisab basis */}
                {guidedStep === 1 ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 soft-shadow">
                    <div className="text-[11px] tracking-widest text-slate-500 font-semibold">GUIDED FLOW</div>
                    <div className="mt-2 text-base font-semibold text-slate-900">1) Choose your Nisab </div>
                    <div className="mt-1 text-sm text-slate-600">Do you want to calculate Zakat based on silver or gold?</div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setZ((s) => ({ ...s, nisabBasis: "silver" }))}
                        className={[
                          "rounded-xl border px-4 py-3 text-sm font-semibold transition",
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
                          "rounded-xl border px-4 py-3 text-sm font-semibold transition",
                          z.nisabBasis === "gold"
                            ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                            : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                        ].join(" ")}
                      >
                        Gold (87.48g)
                      </button>
                    </div>

                    <div className="mt-5 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setGuidedStep(2)}
                        className="rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white px-5 py-2.5 text-sm font-semibold transition"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* Step 2: Rate (mandatory) */}
                {guidedStep === 2 ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 soft-shadow">
                    <div className="text-[11px] tracking-widest text-slate-500 font-semibold">GUIDED FLOW</div>
                    <div className="mt-2 text-base font-semibold text-slate-900">2) Add today’s {basis} rate</div>
                    <div className="mt-1 text-sm text-slate-600">This is needed to calculate the Nisab threshold.</div>

                    <div className="mt-4">
                      <div className="text-sm font-semibold text-slate-900">{manualRateLabel}</div>
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

                      {!isRateValid ? (
                        <div className="mt-2 text-xs text-amber-700">
                          Please enter a valid {basis === "gold" ? "gold" : "silver"} rate to continue.
                        </div>
                      ) : null}

                      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                        <span className="font-semibold">Estimated Nisab Threshold:</span>{" "}
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

                    <div className="mt-5 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setGuidedStep(1)}
                        className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-800 transition"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        disabled={!isRateValid}
                        onClick={() => setGuidedStep(3)}
                        className={[
                          "rounded-xl px-5 py-2.5 text-sm font-semibold transition",
                          !isRateValid
                            ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                            : "bg-emerald-800 hover:bg-emerald-900 text-white"
                        ].join(" ")}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* Step 3: Cash */}
                {guidedStep === 3 ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 soft-shadow">
                    <div className="text-[11px] tracking-widest text-slate-500 font-semibold">GUIDED FLOW</div>
                    <div className="mt-2 text-base font-semibold text-slate-900">3) Add Cash in Hand and bank</div>
                    <div className="mt-1 text-sm text-slate-600">
                      Add the money you currently have available including cash in hand and funds in your bank accounts.
                    </div>

                    <div className="mt-4 space-y-3">
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

                    <div className="mt-5 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setGuidedStep(2)}
                        className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-800 transition"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setGuidedStep(4)}
                        className="rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white px-5 py-2.5 text-sm font-semibold transition"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* ✅ NEW Step 4: Do you own gold? */}
                {guidedStep === 4 ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 soft-shadow">
                    <div className="text-[11px] tracking-widest text-slate-500 font-semibold">GUIDED FLOW</div>
                    <div className="mt-2 text-base font-semibold text-slate-900">4) Do you own gold?</div>
                    <div className="mt-1 text-sm text-slate-600">
                      If you don’t own gold, we willl skip gold inputs and only ask about silver.
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setOwnsGold(true)}
                        className={[
                          "rounded-xl border px-4 py-3 text-sm font-semibold transition",
                          ownsGold
                            ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                            : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                        ].join(" ")}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setOwnsGold(false)}
                        className={[
                          "rounded-xl border px-4 py-3 text-sm font-semibold transition",
                          !ownsGold
                            ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                            : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                        ].join(" ")}
                      >
                        No
                      </button>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setGuidedStep(3)}
                        className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-800 transition"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setGuidedStep(5)}
                        className="rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white px-5 py-2.5 text-sm font-semibold transition"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* Step 5: Metals (✅ inline Yes/No toggle inside this step too) */}
                {guidedStep === 5 ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 soft-shadow">
                    <div className="text-[11px] tracking-widest text-slate-500 font-semibold">GUIDED FLOW</div>
                    <div className="mt-2 text-base font-semibold text-slate-900">5) Add Gold and Silver Details</div>
                    <div className="mt-1 text-sm text-slate-600">
                      Add details of the gold and silver you own. You can toggle gold on or off here at any time.
                    </div>

                    <div className="mt-4 space-y-4">
                         {/* Inline toggle (compact segmented control) */}
                        <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                          <div className="text-xs font-semibold text-slate-700">Do you own gold?</div>
                        
                          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
                            <button
                              type="button"
                              onClick={() => setOwnsGold(true)}
                              aria-pressed={ownsGold}
                              className={[
                                "px-3 py-1.5 text-xs font-semibold rounded-md transition",
                                ownsGold
                                  ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                                  : "text-slate-700 hover:bg-slate-50"
                              ].join(" ")}
                            >
                              Yes
                            </button>
                        
                            <button
                              type="button"
                              onClick={() => setOwnsGold(false)}
                              aria-pressed={!ownsGold}
                              className={[
                                "px-3 py-1.5 text-xs font-semibold rounded-md transition",
                                !ownsGold
                                  ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                                  : "text-slate-700 hover:bg-slate-50"
                              ].join(" ")}
                            >
                              No
                            </button>
                          </div>
                        </div>


                      {/* Gold section (conditional) */}
                      {ownsGold ? (
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
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                          Gold inputs skipped. You can switch “Do you own gold?” to Yes anytime.
                        </div>
                      )}

                      {/* Silver (always shown) */}
                      <div className="space-y-3">
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
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setGuidedStep(4)}
                        className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-800 transition"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setGuidedStep(6)}
                        className="rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white px-5 py-2.5 text-sm font-semibold transition"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* Step 6: Other */}
                {guidedStep === 6 ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 soft-shadow">
                    <div className="text-[11px] tracking-widest text-slate-500 font-semibold">GUIDED FLOW</div>
                    <div className="mt-2 text-base font-semibold text-slate-900">6) Add Other Asset Details</div>
                    <div className="mt-1 text-sm text-slate-600">
                      Add investments, business assets, and money lent.
                    </div>

                    <div className="mt-4 space-y-3">
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

                    <div className="mt-5 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setGuidedStep(5)}
                        className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-800 transition"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setGuidedStep(7)}
                        className="rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white px-5 py-2.5 text-sm font-semibold transition"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* Step 7: Deductions + Calculate */}
                {guidedStep === 7 ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 soft-shadow">
                    <div className="text-[11px] tracking-widest text-slate-500 font-semibold">GUIDED FLOW</div>
                    <div className="mt-2 text-base font-semibold text-slate-900">7) Add Deduction Details</div>
                    <div className="mt-1 text-sm text-slate-600">Add debts, loans or liabilities you must repay soon.</div>

                    <div className="mt-4 space-y-3">
                      <Field
                        label="Debts & liabilities"
                        hint="Bills or loans you must repay soon."
                        prefix="₹"
                        value={z.debts}
                        onChange={(v) => setZ((s: any) => ({ ...s, debts: v }))}
                      />
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setGuidedStep(6)}
                        className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-800 transition"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowSummary(true)}
                        className="rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white px-5 py-2.5 text-sm font-semibold transition"
                      >
                        Calculate Zakat
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* GUIDED FLOW bottom buttons: Share + Reset */}
                <BottomBar>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="w-full rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 py-3 font-semibold transition"
                  >
                    Share
                  </button>
                  <button
                    type="button"
                    onClick={resetZakatState}
                    className="w-full rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 py-3 font-semibold transition"
                  >
                    Reset
                  </button>
                </BottomBar>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

/* ---------------- Small components ---------------- */

function Row({
  label,
  value,
  strong,
  muted
}: {
  label: string;
  value: string;
  strong?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div
        className={[
          strong ? "font-semibold text-slate-900" : "text-slate-700",
          muted ? "text-slate-500" : ""
        ].join(" ")}
      >
        {label}
      </div>
      <div className={[strong ? "font-semibold text-slate-900" : "text-slate-700", "tabular-nums"].join(" ")}>
        {value}
      </div>
    </div>
  );
}

function BottomBar({ children }: { children: React.ReactNode }) {
  const count = React.Children.count(children);
  const cols = count >= 3 ? "grid-cols-3" : "grid-cols-2";

  return (
    <div className="fixed inset-x-0 bottom-0 z-40">
      <div
        className="container-page pb-4"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
      >
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-slate-200 bg-white p-3 soft-shadow">
            <div className={["grid gap-3", cols].join(" ")}>{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
