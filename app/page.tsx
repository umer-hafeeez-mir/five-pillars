"use client";

import { useEffect, useRef } from "react";
import PillarTabs from "@/components/PillarTabs";
import PillarHeader from "@/components/PillarHeader";
import Card from "@/components/Card";
import Field from "@/components/Field";
import Accordion from "@/components/Accordion";
import usePersistedState from "@/lib/usePersistedState";
import { PILLARS, PillarKey } from "@/lib/pillars";
import { calculateZakat, ZakatForm } from "@/lib/zakat";

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

type ZCardKey = "nisab" | "cash" | "metals" | "other" | "deductions" | "how";

export default function HomePage() {
  const [active, setActive] = usePersistedState<PillarKey>("fp_active_tab_v1", "zakat");

  const [z, setZ] = usePersistedState<ZakatForm>("fp_zakat_form_v3", {
    cash: "",
    bank: "",

    goldGrams: "",
    goldRate: "",
    goldKarat: "24k",
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
  const [resultVisible, setResultVisible] = usePersistedState<boolean>("fp_result_visible_v1", false);

  // ✅ NEW: one-open-at-a-time collapsible cards (default open = nisab)
  const [openCard, setOpenCard] = usePersistedState<ZCardKey>("fp_zakat_open_card_v1", "nisab");

  const prevEligibleRef = useRef<boolean>(false);
  const prevActiveRef = useRef<PillarKey>(active);

  const pillar = PILLARS[active];
  const zakatResult = active === "zakat" ? calculateZakat(z) : null;

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

      goldGrams: "",
      goldRate: "",
      goldKarat: "24k",
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
    setResultVisible(false);

    // reset open card to first
    setOpenCard("nisab");
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

  const handleCalculate = () => {
    setResultVisible(true);
    if (zakatResult?.eligible) setResultOpen(true);
  };

  const handleFetchOnline = async () => {
    try {
      const mockGold = 14413.5;
      const mockSilver = 165.25;

      if (z.nisabBasis === "gold") {
        setZ((s) => ({ ...s, goldRate: mockGold }));
      } else {
        setZ((s) => ({ ...s, silverRate: mockSilver }));
      }
      setLastFetchedAt(Date.now());
    } catch {
      alert("Could not fetch rates. You can still enter the rate manually.");
    }
  };

  const basis = z.nisabBasis;
  const manualRateValue = basis === "gold" ? z.goldRate : z.silverRate;
  const manualRateLabel = basis === "gold" ? "Gold rate (₹/g)" : "Silver rate (₹/g)";

  const estimatedNisab =
    zakatResult && zakatResult.nisab > 0 ? `₹ ${formatINR(zakatResult.nisab)}` : "₹ —";

  const trayHeading = zakatResult?.breakdown?.nisabRateMissing
    ? `Add a ${zakatResult?.basis ?? basis} rate to check Nisab`
    : zakatResult?.eligible
    ? "Zakat is due"
    : "Zakat is not due";

  // helpers for collapsible UI
  const toggleCard = (key: ZCardKey) => setOpenCard((cur) => (cur === key ? key : key));
  const isOpen = (key: ZCardKey) => openCard === key;

  const CollapsibleCard = ({
    cardKey,
    title,
    subtitle,
    children
  }: {
    cardKey: ZCardKey;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
  }) => {
    const open = isOpen(cardKey);
    return (
      <div className="max-w-md mx-auto">
        <button
          type="button"
          onClick={() => setOpenCard(cardKey)}
          className="w-full text-left"
          aria-expanded={open}
        >
          <div className="rounded-2xl border border-slate-200 bg-white p-5 soft-shadow">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] tracking-widest text-slate-400 font-semibold">{title}</div>
                {subtitle ? <div className="mt-2 text-sm text-slate-600">{subtitle}</div> : null}
              </div>
              <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700">
                {open ? "–" : "+"}
              </span>
            </div>

            {open ? <div className="mt-4">{children}</div> : null}
          </div>
        </button>
      </div>
    );
  };

  return (
    <main className="min-h-screen">
      <header className="container-page pt-10 pb-4 text-center">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Five Pillars of Islam</h1>
        <p className="mt-1 text-sm text-slate-500">Simple · Private · Offline</p>

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
                cardKey="nisab"
                title="NISAB (ELIGIBILITY)"
                subtitle="Choose gold/silver and enter a rate"
              >
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="text-sm font-semibold text-slate-900">Choose Nisab basis</div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setZ((s) => ({ ...s, nisabBasis: "silver" }));
                      }}
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
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setZ((s) => ({ ...s, nisabBasis: "gold" }));
                      }}
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
                    <div
                      className="mt-2"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <Field
                        label=""
                        prefix="₹"
                        value={manualRateValue}
                        onChange={(v) => {
                          if (basis === "gold") setZ((s: any) => ({ ...s, goldRate: v }));
                          else setZ((s: any) => ({ ...s, silverRate: v }));
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
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleFetchOnline();
                        }}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                      >
                        Fetch online (optional)
                      </button>
                    </div>
                  </div>
                </div>
              </CollapsibleCard>

              <CollapsibleCard cardKey="cash" title="CASH & SAVINGS" subtitle="">
                <div
                  className="space-y-3"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <Field
                    label="Cash in hand"
                    hint="Money you have right now."
                    prefix="₹"
                    value={z.cash}
                    onChange={(v) => setZ((s: any) => ({ ...s, cash: v }))}
                  />
                  <Field
                    label="Cash in bank"
                    hint="Your current bank balance."
                    prefix="₹"
                    value={z.bank}
                    onChange={(v) => setZ((s: any) => ({ ...s, bank: v }))}
                  />
                </div>
              </CollapsibleCard>

              <CollapsibleCard cardKey="metals" title="PRECIOUS METALS" subtitle="">
                <div
                  className="space-y-3"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <div>
                    <div className="text-xs font-semibold tracking-wide text-slate-500">GOLD PURITY</div>
                    <div className="mt-2 grid grid-cols-4 gap-2">
                      {(["24k", "22k", "18k", "custom"] as const).map((k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setZ((s: any) => ({ ...s, goldKarat: k }));
                          }}
                          className={[
                            "rounded-xl border px-3 py-2 text-sm font-semibold transition",
                            z.goldKarat === k
                              ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                              : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                          ].join(" ")}
                        >
                          {k === "custom" ? "Custom" : k.toUpperCase()}
                        </button>
                      ))}
                    </div>

                    {z.goldKarat === "custom" && (
                      <div className="mt-3">
                        <Field
                          label="Custom purity (%)"
                          hint="Example: 91.6 for 22k, 75 for 18k"
                          suffix="%"
                          value={z.goldCustomPurity}
                          onChange={(v) => setZ((s: any) => ({ ...s, goldCustomPurity: v }))}
                        />
                      </div>
                    )}

                    <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                      Jewellery value is adjusted by purity (e.g., 18k = 75%). Nisab always uses pure gold/silver.
                    </p>
                  </div>

                  <Field
                    label="Gold (grams)"
                    hint="Weight of gold you own."
                    suffix="g"
                    value={z.goldGrams}
                    onChange={(v) => setZ((s: any) => ({ ...s, goldGrams: v }))}
                  />

                  <Field
                    label="Gold rate (₹/g)"
                    hint="Current market price per gram."
                    prefix="₹"
                    value={z.goldRate}
                    onChange={(v) => setZ((s: any) => ({ ...s, goldRate: v }))}
                  />

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

              <CollapsibleCard cardKey="other" title="OTHER ASSETS" subtitle="">
                <div
                  className="space-y-3"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <Field
                    label="Investments / savings"
                    hint="Stocks, mutual funds, savings plans, etc."
                    prefix="₹"
                    value={z.investments}
                    onChange={(v) => setZ((s: any) => ({ ...s, investments: v }))}
                  />
                  <Field
                    label="Business assets"
                    hint="Goods held for sale, business cash, receivables."
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

              <CollapsibleCard cardKey="deductions" title="DEDUCTIONS" subtitle="">
                <div
                  className="space-y-3"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <Field
                    label="Debts & liabilities"
                    hint="Bills or loans you must repay soon."
                    prefix="₹"
                    value={z.debts}
                    onChange={(v) => setZ((s: any) => ({ ...s, debts: v }))}
                  />
                </div>
              </CollapsibleCard>

              <div className="max-w-md mx-auto">
                <button
                  type="button"
                  onClick={() => setOpenCard("how")}
                  className="w-full text-left"
                  aria-expanded={isOpen("how")}
                >
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 soft-shadow">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-[11px] tracking-widest text-slate-400 font-semibold">
                          HOW ZAKAT IS CALCULATED
                        </div>
                        <div className="mt-2 text-sm text-slate-600">Formula and assumptions</div>
                      </div>
                      <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700">
                        {isOpen("how") ? "–" : "+"}
                      </span>
                    </div>

                    {isOpen("how") ? (
                      <div className="mt-4">
                        <Accordion title="How Zakat is calculated">
                          <div className="text-sm text-slate-600 leading-relaxed space-y-2">
                            <p>
                              Zakat is estimated at <b>2.5%</b> of your <b>net zakatable wealth</b>.
                            </p>
                            <p className="text-sm">
                              <b>Net</b> = (Cash + Bank + Gold value + Silver value + Investments + Business assets +
                              Money lent) − Debts
                            </p>
                            <p>
                              Zakat is <b>due</b> if Net is ≥ the <b>Nisab</b> threshold (based on your selected
                              gold/silver rate).
                            </p>
                          </div>
                        </Accordion>
                      </div>
                    ) : null}
                  </div>
                </button>
              </div>

              <div style={{ height: TRAY_SPACER_HEIGHT }} />
            </div>

            {/* Fixed bottom tray */}
            <div className="fixed inset-x-0 bottom-0 z-50 pointer-events-none">
              <div
                className="container-page pb-4"
                style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
              >
                <div className="max-w-md mx-auto pointer-events-auto">
                  <div className="rounded-2xl border border-slate-200 bg-white p-3 soft-shadow">
                    {resultVisible && zakatResult && (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4">
                        <button
                          type="button"
                          onClick={() => setResultOpen((v) => !v)}
                          className="w-full text-left"
                          aria-expanded={resultOpen}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-[11px] tracking-widest text-emerald-800/70 font-semibold">RESULT</div>
                              <div className="mt-2 text-base font-semibold text-slate-900">{trayHeading}</div>
                              <div className="mt-1 text-xs text-slate-500">
                                {resultOpen ? "Tap to collapse" : "Tap to expand"}
                              </div>
                            </div>

                            <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700">
                              {resultOpen ? "–" : "+"}
                            </span>
                          </div>
                        </button>

                        {resultOpen && (
                          <div className="mt-4">
                            {zakatResult.breakdown.nisabRateMissing ? (
                              <div className="text-sm text-slate-600">
                                You can enter your assets without metal rates, but we need the selected{" "}
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

                    {/* Actions */}
                    <div className="mt-3 grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={handleCalculate}
                        className="w-full rounded-xl bg-brand-800 hover:bg-brand-900 text-white py-3 font-semibold soft-shadow transition"
                      >
                        Calculate
                      </button>

                      <button
                        type="button"
                        onClick={handleShare}
                        disabled={!resultVisible || !zakatResult}
                        className={[
                          "w-full rounded-xl py-3 font-semibold transition",
                          !resultVisible || !zakatResult
                            ? "border border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                            : "border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900"
                        ].join(" ")}
                      >
                        Share
                      </button>

                      <button
                        type="button"
                        onClick={resetForm}
                        className="w-full rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 py-3 text-sm font-semibold transition"
                      >
                        Reset
                      </button>
                    </div>
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
