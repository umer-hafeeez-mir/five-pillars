"use client";

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

export default function HomePage() {
  // Persist active tab (anonymous)
  const [active, setActive] = usePersistedState<PillarKey>("fp_active_tab_v1", "zakat");

  // Persist zakat inputs (anonymous)
  const [z, setZ] = usePersistedState<ZakatForm>("fp_zakat_form_v2", {
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

  const pillar = PILLARS[active];
  const zakatResult = active === "zakat" ? calculateZakat(z) : null;

  // Fixed tray sizing (keep this in sync with what’s rendered in tray)
  const TRAY_HEIGHT = 330;

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
  };

  const handleDownloadPDF = () => {
    // Placeholder (you can wire actual PDF generation later)
    // For now, just downloads a simple text file so the button does something useful.
    if (!zakatResult) return;

    const lines = [
      `Zakat Calculation (offline)`,
      `Status: ${zakatResult.eligible ? "Due" : "Not Due"}`,
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
      `Status: ${zakatResult.eligible ? "Due" : "Not Due"}`
    ].join(" · ");

    try {
      // @ts-ignore
      if (navigator.share) {
        // @ts-ignore
        await navigator.share({ title: "Zakat Calculation", text });
        return;
      }
    } catch {
      // ignore and fallback to clipboard
    }

    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard.");
    } catch {
      window.prompt("Copy this text:", text);
    }
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
        <PillarHeader title={pillar.title} subtitle={pillar.subtitle} icon={pillar.icon} />

        {/* Non-zakat pages */}
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
            {/* Zakat calculator */}
            <div className="mt-6 space-y-4">
              {/* Optional: Nisab basis selector card at top */}
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
                      Silver (595g)
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
                      Gold (85g)
                    </button>
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-slate-600">
                    Nisab determines whether Zakat is due based on your <b>total net assets</b> (not just metals).
                    Set the selected basis rate in <b>Precious Metals</b>.
                  </p>
                </div>
              </Card>

              <Card title="CASH & SAVINGS">
                <div className="space-y-3">
                  <Field
                    label="Cash in hand"
                    hint="Money you currently have"
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
              </Card>

              <Card title="PRECIOUS METALS">
                <div className="space-y-3">
                  <Field
                    label="Gold (grams)"
                    suffix="g"
                    value={z.goldGrams}
                    onChange={(v) => setZ((s: any) => ({ ...s, goldGrams: v }))}
                  />
                  <Field
                    label="Gold rate per gram"
                    prefix="₹"
                    value={z.goldRate}
                    onChange={(v) => setZ((s: any) => ({ ...s, goldRate: v }))}
                  />

                  <Field
                    label="Silver (grams)"
                    suffix="g"
                    value={z.silverGrams}
                    onChange={(v) => setZ((s: any) => ({ ...s, silverGrams: v }))}
                  />
                  <Field
                    label="Silver rate per gram"
                    prefix="₹"
                    value={z.silverRate}
                    onChange={(v) => setZ((s: any) => ({ ...s, silverRate: v }))}
                  />
                </div>
              </Card>

              <Card title="OTHER ASSETS">
                <div className="space-y-3">
                  <Field
                    label="Investments / Savings"
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
              </Card>

              <Card title="DEDUCTIONS">
                <div className="space-y-3">
                  <Field
                    label="Debts & liabilities"
                    hint="Money you owe and must repay"
                    prefix="₹"
                    value={z.debts}
                    onChange={(v) => setZ((s: any) => ({ ...s, debts: v }))}
                  />
                </div>
              </Card>

              <Accordion title="How Zakat is calculated">
                <div className="text-sm text-slate-600 leading-relaxed space-y-2">
                  <p>
                    Zakat is estimated at <b>2.5%</b> of your <b>net zakatable wealth</b>:
                  </p>
                  <p className="text-sm">
                    <b>Net</b> = (Cash + Bank + Gold value + Silver value + Investments + Business assets + Money lent) − Debts
                  </p>
                  <p>
                    You are <b>eligible</b> if your Net is greater than or equal to the <b>Nisab</b> threshold.
                    Nisab is calculated using your selected basis (gold or silver) and the rate per gram you enter.
                  </p>
                  <p className="text-xs text-slate-500">
                    This app works offline. Rates are entered manually.
                  </p>
                </div>
              </Accordion>

              {/* Spacer so the form never hides behind the fixed tray */}
              <div style={{ height: TRAY_HEIGHT }} />
            </div>

            {/* FIXED BOTTOM TRAY — SOLID (no transparency, no blur, no overlay) */}
            <div
              className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white shadow-[0_-12px_30px_-20px_rgba(15,23,42,0.35)]"
              style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
            >
              <div className="container-page py-4">
                <div className="max-w-md mx-auto">
                  {/* Result card (tray only) */}
                  {zakatResult && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-sm">
                      <div className="text-[11px] tracking-widest text-emerald-800/70 font-semibold">RESULT</div>

                      {/* If nisab can’t be computed yet */}
                      {zakatResult.breakdown.nisabRateMissing ? (
                        <div className="mt-4">
                          <div className="text-base font-semibold text-slate-900">
                            Enter {zakatResult.basis} rate to calculate Nisab
                          </div>
                          <div className="mt-2 text-sm text-slate-600">
                            You selected <b>{zakatResult.basis}</b> as your nisab basis. Add its rate per gram in{" "}
                            <b>Precious Metals</b> to compute eligibility.
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 flex items-center justify-between gap-4">
                          <div>
                            <div className="text-sm text-slate-600">
                              {zakatResult.eligible ? "Zakat to Pay" : "Below Nisab"}
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
                            {zakatResult.eligible ? "Due" : "Not Due"}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Buttons */}
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
          </>
        )}
      </section>
    </main>
  );
}
