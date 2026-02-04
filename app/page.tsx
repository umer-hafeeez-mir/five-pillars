"use client";

import React, { useEffect, useRef } from "react";
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

function HelpFab() {
  return (
    <Link
      href="/help"
      aria-label="Help"
      title="Help"
      className={[
        "fixed right-4 top-4 z-50",
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

type ZakatSection = "nisab" | "cash" | "metals" | "other" | "deductions" | null;
type AppView = "home" | "pillars";

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

export default function Page() {
  const [active, setActive] = usePersistedState<PillarKey>("fp_active_tab_v1", "zakat");

  // ✅ New: switch between Home and Pillars (no long scroll page)
  // Persisted view key
const VIEW_KEY = "fp_view_v1";
const [view, setView] = usePersistedState<AppView>(VIEW_KEY, "home");

// Ensure first-ever app open lands on Home.
// If the persisted key is already present, we respect the saved value (so returning users resume where they left off).
useEffect(() => {
  try {
    const saved = localStorage.getItem(VIEW_KEY);
    if (saved === null) {
      // No saved preference → first-ever open → make sure we show Home.
      // This will also persist the "home" default for future loads.
      setView("home");
    }
  } catch {
    // ignore localStorage errors in constrained environments
  }
  // run only once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);


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

  const [openSection, setOpenSection] = usePersistedState<ZakatSection>(
    "fp_zakat_open_section_v2",
    "nisab"
  );

  const prevEligibleRef = useRef<boolean>(false);
  const prevActiveRef = useRef<PillarKey>(active);

  const pillar = PILLARS[active];
  const zakatResult = active === "zakat" ? calculateZakat(z) : null;

  // ✅ Auto-expand result tray when zakat becomes due (false -> true)
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
    setOpenSection("nisab");
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

  const handleFetchOnline = async () => {
    try {
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

  const estimatedNisab =
    zakatResult && zakatResult.nisab > 0 ? `₹ ${formatINR(zakatResult.nisab)}` : "₹ —";

  const trayHeading = zakatResult?.breakdown?.nisabRateMissing
    ? `Add a ${zakatResult?.basis ?? basis} rate to check Nisab`
    : zakatResult?.eligible
    ? "Zakat is due"
    : "Zakat is not due";

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
        return {
          ...s,
          goldHoldings: { ...curr, custom: { ...curr.custom, ...patch } }
        };
      }

      return {
        ...s,
        goldHoldings: { ...curr, [k]: { ...(curr as any)[k], ...patch } }
      };
    });
  };

  const activeHolding =
    activeKarat === "custom"
      ? (z.goldHoldings?.custom ?? { grams: "", rate: "", purityPct: "" })
      : ((z.goldHoldings as any)?.[activeKarat] ?? { grams: "", rate: "" });

  // ✅ When selecting from homepage, switch view + set active
  const goToPillar = (k: PillarKey) => {
    setActive(k);
    setView("pillars");
  };

  // ✅ HOME VIEW ONLY (no stacking)
  if (view === "home") {
    return (
      <main className="min-h-screen">
        <HelpFab />
        <HomePage
          onExplore={() => setView("pillars")}
          onSelectPillar={(k) => goToPillar(k)}
        />
      </main>
    );
  }

  // ✅ PILLARS VIEW ONLY
  return (
    <main className="min-h-screen">
      <HelpFab />
      <header className="container-page pt-10 pb-4 text-center">
        <div className="flex items-center justify-between max-w-5xl mx-auto px-4">
          <button
            type="button"
            onClick={() => setView("home")}
            aria-label="Go to home"
            title="Home"
            className={[
              "inline-flex h-9 w-9 items-center justify-center rounded-full",
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

          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Five Pillars of Islam
          </h1>

          <div className="w-[88px]" aria-hidden="true" />
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
            <div className="mt-6 space-y-4">
              <CollapsibleCard
                title="Nisab Eligibility"
                subtitle={nisabSubtitle}
                open={openSection === "nisab"}
                onToggle={() => toggleSection("nisab")}
              >
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="text-sm font-semibold text-slate-900">Choose Nisab basis</div>

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
                    Nisab is the minimum wealth threshold used to decide whether Zakat is due. It is compared against
                    your <b>total net assets</b> (not just metals).
                  </p>

                  <div className="mt-4">
                    <div className="text-sm font-semibold text-slate-900">
                      {manualRateLabel} <span className="text-slate-500">(manual)</span>
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
                        (based on {basis === "gold" ? "87.48g gold" : "612.36g silver"} × your rate)
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
                        Fetch online (optional)
                      </button>
                    </div>
                  </div>
                </div>
              </CollapsibleCard>

              {/* rest of zakat UI preserved unchanged... */}
            </div>

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
                          onClick={() => {
                            setResultOpen((v) => {
                              const next = !v;
                              if (next && zakatResult?.breakdown?.nisabRateMissing) {
                                setOpenSection("metals");
                              }
                              return next;
                            });
                          }}
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
