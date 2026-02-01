"use client";

import { useRef } from "react";
import InstallBanner from "@/components/InstallBanner";
import PillarTabs from "@/components/PillarTabs";
import PillarHeader from "@/components/PillarHeader";
import Card from "@/components/Card";
import Field from "@/components/Field";
import Accordion from "@/components/Accordion";
import usePersistedState from "@/lib/usePersistedState";
import { PILLARS, PillarKey } from "@/lib/pillars";
import { calculateZakat } from "@/lib/zakat";

type NumOrEmpty = number | "";
type NisabBasis = "silver" | "gold";

type ZState = {
  cash: NumOrEmpty;
  bank: NumOrEmpty;

  goldGrams: NumOrEmpty;
  goldRate: NumOrEmpty;

  silverGrams: NumOrEmpty;
  silverRate: NumOrEmpty;

  investments: NumOrEmpty;
  businessAssets: NumOrEmpty;
  moneyLent: NumOrEmpty;

  debts: NumOrEmpty;

  nisabBasis: NisabBasis;
};

const ZAKAT_DEFAULTS: ZState = {
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
};

function formatINR(n: number) {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export default function HomePage() {
  // Persist active tab (anonymous)
  const [active, setActive] = usePersistedState<PillarKey>(
    "fp_active_tab_v1",
    "zakat"
  );

  // Persist zakat inputs (anonymous)
  const [z, setZ] = usePersistedState<ZState>("fp_zakat_form_v3", ZAKAT_DEFAULTS);

  const pillar = PILLARS[active];
  const zakatResult = active === "zakat" ? calculateZakat(z as any) : null;

  // autofocus refs
  const goldRateRef = useRef<HTMLInputElement | null>(null);
  const silverRateRef = useRef<HTMLInputElement | null>(null);

  const resetZakat = () => setZ(ZAKAT_DEFAULTS);

  // NOTE: InstallBanner likely renders a bottom bar with a “Got it” button.
  // To prevent overlap, we lift our tray above it.
  // If your banner height differs, tweak this value (px).
  const TRAY_BOTTOM_OFFSET = 72;

  // Placeholder handler (we'll implement real PDF later)
  const downloadPdf = () => {
    if (!zakatResult) return;

    const text = [
      "Zakat Calculation Summary",
      "------------------------",
      `Status: ${zakatResult.eligible ? "Due" : "Not Due"}`,
      `Zakat: ₹ ${formatINR(zakatResult.eligible ? zakatResult.zakat : 0)}`,
      `Net: ₹ ${formatINR(zakatResult.net)}`,
      `Nisab (${zakatResult.basis}): ₹ ${formatINR(zakatResult.nisab)}`
    ].join("\n");

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "zakat-summary.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const buildShareText = () => {
    if (!zakatResult) return "Zakat Calculation";

    const dueText = zakatResult.eligible ? "Due" : "Not Due";
    const zakatAmount = zakatResult.eligible ? zakatResult.zakat : 0;

    return [
      "Zakat Calculation",
      `Status: ${dueText}`,
      `Zakat: ₹ ${formatINR(zakatAmount)}`,
      `Net: ₹ ${formatINR(zakatResult.net)}`,
      `Nisab (${zakatResult.basis}): ₹ ${formatINR(zakatResult.nisab)}`,
      "",
      "Calculated offline"
    ].join("\n");
  };

  const handleShare = async () => {
    const text = buildShareText();

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Zakat Calculation",
          text
        });
        return;
      }
    } catch {
      // user cancelled share
      return;
    }

    // Fallback: copy
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Last resort
      window.prompt("Copy this text:", text);
    }
  };

  return (
    <main className="min-h-screen">
      <InstallBanner />

      <header className="container-page pt-10 pb-4 text-center">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          Five Pillars of Islam
        </h1>
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
            {/* Zakat form */}
            <div className="mt-6 space-y-4">
              <Card title="CASH & SAVINGS">
                <div className="space-y-3">
                  <Field
                    label="Cash in hand"
                    prefix="₹"
                    value={z.cash}
                    onChange={(v) => setZ((s) => ({ ...s, cash: v }))}
                  />
                  <Field
                    label="Cash in bank"
                    prefix="₹"
                    value={z.bank}
                    onChange={(v) => setZ((s) => ({ ...s, bank: v }))}
                  />
                </div>
              </Card>

              <Card title="PRECIOUS METALS">
                <div className="space-y-3">
                  {/* Nisab basis */}
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="text-sm font-medium text-slate-800">Nisab basis</div>

                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setZ((s) => ({ ...s, nisabBasis: "silver" }));
                          setTimeout(() => silverRateRef.current?.focus(), 50);
                        }}
                        className={[
                          "flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition",
                          z.nisabBasis === "silver"
                            ? "border-brand-300 bg-brand-50 text-brand-900"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        ].join(" ")}
                      >
                        Silver (595g)
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setZ((s) => ({ ...s, nisabBasis: "gold" }));
                          setTimeout(() => goldRateRef.current?.focus(), 50);
                        }}
                        className={[
                          "flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition",
                          z.nisabBasis === "gold"
                            ? "border-brand-300 bg-brand-50 text-brand-900"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        ].join(" ")}
                      >
                        Gold (85g)
                      </button>
                    </div>

                    <div className="mt-2 text-xs text-slate-500">
                      Nisab threshold is calculated using your selected basis.
                    </div>
                  </div>

                  <Field
                    label="Gold (grams)"
                    suffix="g"
                    value={z.goldGrams}
                    onChange={(v) => setZ((s) => ({ ...s, goldGrams: v }))}
                  />

                  <Field
                    label="Gold rate per gram"
                    prefix="₹"
                    value={z.goldRate}
                    inputRef={goldRateRef}
                    onChange={(v) => setZ((s) => ({ ...s, goldRate: v }))}
                  />

                  <Field
                    label="Silver (grams)"
                    suffix="g"
                    value={z.silverGrams}
                    onChange={(v) => setZ((s) => ({ ...s, silverGrams: v }))}
                  />

                  <Field
                    label="Silver rate per gram"
                    prefix="₹"
                    value={z.silverRate}
                    inputRef={silverRateRef}
                    onChange={(v) => setZ((s) => ({ ...s, silverRate: v }))}
                  />
                </div>
              </Card>

              <Card title="OTHER ASSETS">
                <div className="space-y-3">
                  <Field
                    label="Investments / Savings"
                    prefix="₹"
                    value={z.investments}
                    onChange={(v) => setZ((s) => ({ ...s, investments: v }))}
                  />
                  <Field
                    label="Business assets"
                    prefix="₹"
                    value={z.businessAssets}
                    onChange={(v) => setZ((s) => ({ ...s, businessAssets: v }))}
                  />
                  <Field
                    label="Money lent to others"
                    prefix="₹"
                    value={z.moneyLent}
                    onChange={(v) => setZ((s) => ({ ...s, moneyLent: v }))}
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
                    onChange={(v) => setZ((s) => ({ ...s, debts: v }))}
                  />
                </div>
              </Card>

              <Accordion title="How Zakat is calculated">
                <div className="text-sm text-slate-700 leading-relaxed space-y-3">
                  <div>
                    <div className="font-semibold text-slate-900">1) Assets</div>
                    <p className="mt-1">
                      Assets include cash, bank balance, gold value, silver value,
                      investments/savings, business assets, and money lent out.
                    </p>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">2) Net</div>
                    <p className="mt-1">Net = Total assets − Debts & liabilities.</p>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">3) Nisab</div>
                    <p className="mt-1">Silver: 595g × silver rate, Gold: 85g × gold rate.</p>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">4) Zakat</div>
                    <p className="mt-1">If Net ≥ Nisab, Zakat = 2.5% of Net.</p>
                  </div>
                </div>
              </Accordion>

              {/* Spacer so form never hides behind tray */}
              <div className="h-[360px]" />
            </div>

            {/* Fixed Bottom Tray */}
            <div
              className="fixed left-0 right-0 z-50"
              style={{ bottom: `calc(${TRAY_BOTTOM_OFFSET}px + env(safe-area-inset-bottom))` }}
            >
              <div className="h-10 bg-gradient-to-t from-white to-transparent" />

              <div className="px-3 pb-4">
                <div className="max-w-md mx-auto space-y-3">
                  {/* RESULT (restored full details) */}
                  {zakatResult && (
                    <Card title="RESULT" variant="result">
                      {zakatResult.breakdown?.nisabRateMissing ? (
                        <div className="text-slate-800">
                          <div className="text-sm font-medium text-brand-900">
                            Enter {z.nisabBasis === "silver" ? "silver rate" : "gold rate"} to calculate Nisab
                          </div>
                          <div className="mt-2 text-[11px] text-slate-600">
                            You selected <b>{z.nisabBasis}</b> as your nisab basis.
                            Add its rate per gram above to compute eligibility.
                          </div>
                        </div>
                      ) : zakatResult.eligible ? (
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <div className="text-xs text-slate-700">Zakat to Pay</div>
                            <div className="mt-1 text-2xl font-bold text-brand-900 tracking-tight">
                              ₹ {formatINR(zakatResult.zakat)}
                            </div>
                            <div className="mt-1 text-[11px] text-slate-600">
                              Net: ₹ {formatINR(zakatResult.net)} · Nisab: ₹ {formatINR(zakatResult.nisab)} ({zakatResult.basis})
                            </div>
                          </div>

                          <span className="text-[11px] px-2 py-1 rounded-full font-medium border bg-brand-100 text-brand-900 border-brand-200">
                            Due
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <div className="text-xs text-slate-700">Below Nisab</div>
                            <div className="mt-1 text-2xl font-bold text-slate-800 tracking-tight">
                              ₹ 0.00
                            </div>
                            <div className="mt-1 text-[11px] text-slate-600">
                              Net: ₹ {formatINR(zakatResult.net)} · Nisab: ₹ {formatINR(zakatResult.nisab)} ({zakatResult.basis})
                            </div>
                          </div>

                          <span className="text-[11px] px-2 py-1 rounded-full font-medium border bg-slate-100 text-slate-700 border-slate-200">
                            Not Due
                          </span>
                        </div>
                      )}
                    </Card>
                  )}

                  {/* ACTIONS (consistent scheme) */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={downloadPdf}
                      className="w-full rounded-xl bg-brand-800 hover:bg-brand-900 active:bg-brand-900 text-white py-4 font-medium soft-shadow transition"
                    >
                      Download PDF
                    </button>

                    <button
                      onClick={handleShare}
                      className="w-full rounded-xl border border-brand-300 bg-white hover:bg-brand-50 active:bg-brand-100 text-brand-900 py-4 font-medium transition"
                    >
                      Share
                    </button>
                  </div>

                  {/* Reset (secondary-neutral but NOT “greyed out”) */}
                  <button
                    onClick={resetZakat}
                    className="w-full rounded-xl border border-slate-300 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 py-3 text-sm font-semibold transition"
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
