// app/page.tsx
"use client";

import PillarTabs from "@/components/PillarTabs";
import PillarHeader from "@/components/PillarHeader";
import Card from "@/components/Card";
import Field from "@/components/Field";
import Accordion from "@/components/Accordion";
import usePersistedState from "@/lib/usePersistedState";
import { PILLARS, PillarKey } from "@/lib/pillars";
import { calculateZakat, NisabBasis, ZakatForm } from "@/lib/zakat";

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

  // Persist zakat inputs (anonymous) — allow blank values
  const [z, setZ] = usePersistedState<ZakatForm>("fp_zakat_form_v1", {
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

  // Spacer should cover the full tray height so form never appears behind it
  const TRAY_HEIGHT_PX = 380;

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

  const buildShareText = () => {
    if (!zakatResult) return "";
    const status = zakatResult.eligible ? "Due" : "Not Due";
    const zakatToPay = zakatResult.eligible ? zakatResult.zakat : 0;

    return [
      "Zakat Summary",
      `Status: ${status}`,
      `Zakat: ₹ ${formatINR(zakatToPay)}`,
      `Net: ₹ ${formatINR(zakatResult.net)}`,
      `Nisab (${zakatResult.basis}): ₹ ${formatINR(zakatResult.nisab)}`,
      "",
      "Calculated offline"
    ].join("\n");
  };

  const onShare = async () => {
    const text = buildShareText();
    if (!text) return;

    // Prefer native share
    // @ts-ignore
    if (navigator?.share) {
      try {
        // @ts-ignore
        await navigator.share({ title: "Zakat Summary", text });
        return;
      } catch {
        // fall through
      }
    }

    // Clipboard fallback
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied summary to clipboard.");
    } catch {
      window.prompt("Copy this text:", text);
    }
  };

  const onDownloadPDF = () => {
    // Placeholder for now (offline-friendly). Next step: implement jsPDF.
    const text = buildShareText();
    const blob = new Blob([text || "No result to export"], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "zakat-summary.txt"; // later change to .pdf after jsPDF implementation
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  };

  // Helpful computed values for the Nisab card (display only)
  const basis: NisabBasis = z.nisabBasis ?? "silver";
  const basisRate =
    basis === "silver"
      ? (z.silverRate === "" ? 0 : Number(z.silverRate))
      : (z.goldRate === "" ? 0 : Number(z.goldRate));
  const basisNisabGrams = basis === "silver" ? 595 : 85;
  const estimatedNisab = basisRate > 0 ? basisNisabGrams * basisRate : 0;

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
            <div className="mt-6 space-y-4">
              {/* Nisab (Eligibility) */}
              <Card title="NISAB (ELIGIBILITY)">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-sm font-semibold text-slate-900">Choose Nisab basis</div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setZ((s: any) => ({ ...s, nisabBasis: "silver" as NisabBasis }))}
                      className={[
                        "w-full rounded-xl border px-4 py-3 text-sm font-semibold transition",
                        z.nisabBasis === "silver"
                          ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                          : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                      ].join(" ")}
                    >
                      Silver (595g)
                    </button>

                    <button
                      type="button"
                      onClick={() => setZ((s: any) => ({ ...s, nisabBasis: "gold" as NisabBasis }))}
                      className={[
                        "w-full rounded-xl border px-4 py-3 text-sm font-semibold transition",
                        z.nisabBasis === "gold"
                          ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                          : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                      ].join(" ")}
                    >
                      Gold (85g)
                    </button>
                  </div>

                  <p className="mt-3 text-xs text-slate-600">
                    Nisab determines whether Zakat is due based on your <b>total net assets</b> (not just metals).
                  </p>

                  {basis === "gold" ? (
                    <div className="mt-4">
                      <Field
                        label="Gold rate per gram (manual)"
                        prefix="₹"
                        value={z.goldRate}
                        onChange={(v) => setZ((s: any) => ({ ...s, goldRate: v }))}
                      />
                    </div>
                  ) : (
                    <div className="mt-4">
                      <Field
                        label="Silver rate per gram (manual)"
                        prefix="₹"
                        value={z.silverRate}
                        onChange={(v) => setZ((s: any) => ({ ...s, silverRate: v }))}
                      />
                    </div>
                  )}

                  <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200 p-3 text-sm text-slate-700">
                    Estimated Nisab threshold:{" "}
                    <b>₹ {estimatedNisab > 0 ? formatINR(estimatedNisab) : "—"}</b>{" "}
                    <span className="text-slate-500">
                      (based on {basisNisabGrams}g {basis} × your rate)
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-xs text-slate-500">Last fetched: —</div>
                    <button
                      type="button"
                      disabled
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-400 cursor-not-allowed"
                      title="Optional online fetch can be added later"
                    >
                      Fetch online (optional)
                    </button>
                  </div>
                </div>
              </Card>

              {/* CASH & SAVINGS */}
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

              {/* PRECIOUS METALS */}
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

              {/* OTHER ASSETS */}
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

              {/* DEDUCTIONS */}
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
                    This calculator estimates Zakat at <b>2.5%</b> of your <b>net zakatable wealth</b>.
                  </p>
                  <p>
                    <b>Assets</b> include: cash, bank, gold value, silver value, investments, business assets, and money lent.
                  </p>
                  <p>
                    <b>Net</b> = Assets − Debts (minimum 0). If Net ≥ Nisab, then Zakat = Net × 2.5%.
                  </p>
                  <p className="text-xs text-slate-500">
                    Nisab uses 595g silver or 85g gold × your entered rate (manual by default). Optional online fetch can be added later.
                  </p>
                </div>
              </Accordion>

              {/* Spacer so content doesn't hide behind the fixed tray */}
              <div style={{ height: TRAY_HEIGHT_PX }} />
            </div>

            {/* Fixed bottom tray (NO full-width banner) */}
            {zakatResult && (
              <div
                className="fixed inset-x-0 bottom-0 z-50 pointer-events-none"
                style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
              >
                <div className="container-page py-3">
                  <div className="max-w-md mx-auto space-y-3 pointer-events-auto">
                    {/* Result */}
                    <div className="rounded-2xl border border-emerald-300 bg-emerald-50/60 p-5 soft-shadow">
                      <div className="text-[11px] tracking-widest text-emerald-900/70 font-semibold">
                        RESULT
                      </div>

                      {zakatResult.breakdown.nisabRateMissing ? (
                        <div className="mt-4">
                          <div className="text-base font-semibold text-emerald-900">
                            Enter {zakatResult.basis} rate to calculate Nisab
                          </div>
                          <p className="mt-2 text-sm text-slate-600">
                            You selected <b>{zakatResult.basis}</b> as your nisab basis. Add its rate per gram above to
                            compute eligibility.
                          </p>
                        </div>
                      ) : (
                        <div className="mt-4 flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm text-slate-700">
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

                          <div
                            className={[
                              "shrink-0 rounded-full px-3 py-1 text-xs font-semibold border",
                              zakatResult.eligible
                                ? "bg-emerald-100 text-emerald-900 border-emerald-200"
                                : "bg-slate-100 text-slate-700 border-slate-200"
                            ].join(" ")}
                          >
                            {zakatResult.eligible ? "Due" : "Not Due"}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="rounded-2xl bg-white p-3 border border-slate-200 soft-shadow">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={onDownloadPDF}
                          className="w-full rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white py-4 font-semibold transition"
                        >
                          Download PDF
                        </button>

                        <button
                          onClick={onShare}
                          className="w-full rounded-xl border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-900 py-4 font-semibold transition"
                        >
                          Share
                        </button>
                      </div>

                      <button
                        onClick={resetForm}
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 py-3 text-sm font-semibold transition"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
