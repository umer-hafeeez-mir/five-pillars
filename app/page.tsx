"use client";

import PillarTabs from "@/components/PillarTabs";
import PillarHeader from "@/components/PillarHeader";
import Card from "@/components/Card";
import Field from "@/components/Field";
import Accordion from "@/components/Accordion";
import usePersistedState from "@/lib/usePersistedState";
import { PILLARS, PillarKey } from "@/lib/pillars";
import { calculateZakat, ZakatForm } from "@/lib/zakat";

// ✅ Minimal UI-only constants (labels/helptext)
// (Actual calculation constants should live in lib/zakat.ts)
const SILVER_NISAB_GRAMS = 612.36;
const GOLD_NISAB_GRAMS = 87.48;

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

export default function HomePage() {
  const [active, setActive] = usePersistedState<PillarKey>("fp_active_tab_v1", "zakat");

  const [z, setZ] = usePersistedState<ZakatForm>("fp_zakat_form_v3", {
    cash: "",
    bank: "",

    goldGrams: "",
    goldRate: "",

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

  // ✅ Result card collapsed by default (persisted)
  const [resultOpen, setResultOpen] = usePersistedState<boolean>("fp_result_open_v1", false);

  const pillar = PILLARS[active];
  const zakatResult = active === "zakat" ? calculateZakat(z) : null;

  // Spacer must roughly match tray height so form never hides under tray
  const TRAY_SPACER_HEIGHT = 360;

  const resetForm = () => {
    setZ({
      cash: "",
      bank: "",

      goldGrams: "",
      goldRate: "",

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
    } catch {
      // ignore and fallback
    }

    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard.");
    } catch {
      window.prompt("Copy the result:", text);
    }
  };

  // Optional fetch (hook to a real API later). For now, it just demonstrates the flow.
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

  // Manual rate field depends on selected basis
  const basis = z.nisabBasis;
  const manualRateValue = basis === "gold" ? z.goldRate : z.silverRate;
  const manualRateLabel = basis === "gold" ? "Gold rate (₹/g)" : "Silver rate (₹/g)";

  const estimatedNisab =
    zakatResult && zakatResult.nisab > 0 ? `₹ ${formatINR(zakatResult.nisab)}` : "₹ —";

  // Tray: short heading (always shown)
  const trayHeading = zakatResult?.breakdown?.nisabRateMissing
    ? `Add a ${zakatResult?.basis ?? basis} rate to check Nisab`
    : zakatResult?.eligible
    ? "Zakat is due"
    : "Zakat is not due";

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
              {/* Nisab (Eligibility) */}
              <Card title="NISAB (ELIGIBILITY)">
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
                      Silver ({SILVER_NISAB_GRAMS}g)
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
                      Gold ({GOLD_NISAB_GRAMS}g)
                    </button>
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-slate-600">
                    Nisab is the minimum wealth threshold used to decide whether Zakat is due. It is compared against
                    your <b>total net assets</b> (cash, savings, metals, investments, etc.) — not just metals. If your net zakatable wealth stays above Nisab for a lunar
                    year, Zakat is due.
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
                          if (basis === "gold") setZ((s: any) => ({ ...s, goldRate: v }));
                          else setZ((s: any) => ({ ...s, silverRate: v }));
                        }}
                      />
                    </div>

                    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      <span className="font-semibold">Estimated Nisab threshold:</span>{" "}
                      <span className="font-semibold">{estimatedNisab}</span>{" "}
                      <span className="text-slate-500">
                        (based on {basis === "gold" ? `${GOLD_NISAB_GRAMS}g gold` : `${SILVER_NISAB_GRAMS}g silver`} ×
                        your rate)
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
              </Card>

              <Card title="CASH & SAVINGS">
                <div className="space-y-3">
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
              </Card>

              <Card title="PRECIOUS METALS">
                <div className="space-y-3">
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
              </Card>

              <Card title="OTHER ASSETS">
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
              </Card>

              <Card title="DEDUCTIONS">
                <div className="space-y-3">
                  <Field
                    label="Short-term debts & liabilities"
                    hint="Only include amounts due soon (e.g., within the year): bills, credit cards, near-term loan payments."
                    prefix="₹"
                    value={z.debts}
                    onChange={(v) => setZ((s: any) => ({ ...s, debts: v }))}
                  />
                </div>
              </Card>

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
                  <p className="text-sm">
                    <b>Haul:</b> This calculator assumes you are checking on your annual Zakat date (1 lunar year).
                  </p>
                </div>
              </Accordion>

              <div style={{ height: TRAY_SPACER_HEIGHT }} />
            </div>

            {/* Fixed bottom tray (result collapsible) */}
            <div className="fixed inset-x-0 bottom-0 z-50 pointer-events-none">
              <div
                className="container-page pb-4"
                style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
              >
                <div className="max-w-md mx-auto pointer-events-auto">
                  <div className="rounded-2xl border border-slate-200 bg-white p-3 soft-shadow">
                    {/* Result (collapsible header always visible) */}
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

                        {/* Expanded details */}
                        {resultOpen && (
                          <div className="mt-4">
                            {zakatResult.breakdown.nisabRateMissing ? (
                              <div className="text-sm text-slate-600">
                                Nisab is based on your selected <b>{zakatResult.basis}</b> rate, but it is compared
                                against your <b>total net assets</b> (cash, savings, metals, investments, etc.). Enter
                                the {zakatResult.basis} rate above to calculate Nisab and confirm whether Zakat is due.
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
