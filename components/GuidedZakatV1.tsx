"use client";

import React, { useMemo, useState } from "react";
import Card from "@/components/Card";
import Field from "@/components/Field";
import { ZakatForm, GoldHoldings } from "@/lib/zakat";

type Props = {
  z: ZakatForm;
  setZ: (updater: any) => void;

  zakatResult: any; // from calculateZakat(z)
  formatINR: (n: number) => string;

  onRestart: () => void;
  onJumpToPower: () => void;

  onResetAll: () => void; // optional: full reset if you want
};

type StepId =
  | "basis"
  | "rate"
  | "gold24"
  | "gold22"
  | "gold18"
  | "silver"
  | "cash"
  | "bank"
  | "other"
  | "deductions"
  | "summary";

function defaultGoldHoldings(): GoldHoldings {
  return {
    "24k": { grams: "", rate: "" },
    "22k": { grams: "", rate: "" },
    "18k": { grams: "", rate: "" },
    custom: { grams: "", rate: "", purityPct: "" }
  };
}

function val(v: any) {
  return v === null || v === undefined ? "" : v;
}

function toNum(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function GuidedZakatV1({
  z,
  setZ,
  zakatResult,
  formatINR,
  onRestart,
  onJumpToPower
}: Props) {
  const [step, setStep] = useState<StepId>("basis");

  const basis = z.nisabBasis ?? "silver";
  const gold = (z.goldHoldings ?? defaultGoldHoldings()) as GoldHoldings;

  const nisabRateValue = basis === "gold" ? val(gold["24k"]?.rate) : val(z.silverRate);

  const canNext = useMemo(() => {
    switch (step) {
      case "rate":
        return String(nisabRateValue).trim() !== "";
      default:
        return true;
    }
  }, [step, nisabRateValue]);

  const order: StepId[] = [
    "basis",
    "rate",
    "gold24",
    "gold22",
    "gold18",
    "silver",
    "cash",
    "bank",
    "other",
    "deductions",
    "summary"
  ];

  const goNext = () => {
    const idx = order.indexOf(step);
    setStep(order[Math.min(order.length - 1, idx + 1)]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    const idx = order.indexOf(step);
    setStep(order[Math.max(0, idx - 1)]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const setBasis = (b: "gold" | "silver") => setZ((s: any) => ({ ...s, nisabBasis: b }));

  const setGold = (k: "24k" | "22k" | "18k", patch: any) =>
    setZ((s: any) => ({
      ...s,
      goldHoldings: {
        ...(s.goldHoldings ?? defaultGoldHoldings()),
        [k]: { ...((s.goldHoldings ?? defaultGoldHoldings())[k] as any), ...patch }
      }
    }));

  const setSilver = (patch: any) => setZ((s: any) => ({ ...s, ...patch }));

  const restartFlow = () => {
    onRestart();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Simple “what you entered” breakdown for summary
  const cashTotal = toNum(z.cash) + toNum(z.bank);
  const gold24 = toNum(gold["24k"]?.grams) * toNum(gold["24k"]?.rate);
  const gold22 = toNum(gold["22k"]?.grams) * toNum(gold["22k"]?.rate);
  const gold18 = toNum(gold["18k"]?.grams) * toNum(gold["18k"]?.rate);
  const silverVal = toNum(z.silverGrams) * toNum(z.silverRate);
  const otherTotal = toNum(z.investments) + toNum(z.businessAssets) + toNum(z.moneyLent);
  const debtsTotal = toNum(z.debts);

  return (
    <div className="mt-6 space-y-4">
      {/* ✅ Intro card ONLY on first question */}
      {step === "basis" && (
        <Card title="">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] tracking-widest text-slate-500 font-semibold">GUIDED FLOW</div>
              <div className="mt-2 text-lg font-semibold text-slate-900">Let’s calculate your Zakat step-by-step</div>
              <div className="mt-1 text-sm text-slate-600">
                Answer a few quick questions. You can switch to Power users anytime.
              </div>
            </div>

            <button
              type="button"
              onClick={onJumpToPower}
              className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Power users
            </button>
          </div>
        </Card>
      )}

      {/* Step content */}
      {step === "basis" && (
        <Card title="">
          <div className="text-base font-semibold text-slate-900">1) Choose your Nisab basis</div>
          <div className="mt-2 text-sm text-slate-600">Do you want to calculate using silver or gold?</div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setBasis("silver")}
              className={[
                "rounded-xl border px-3 py-3 text-sm font-semibold transition",
                basis === "silver"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                  : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
              ].join(" ")}
            >
              Silver (612.36g)
            </button>

            <button
              type="button"
              onClick={() => setBasis("gold")}
              className={[
                "rounded-xl border px-3 py-3 text-sm font-semibold transition",
                basis === "gold"
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
              onClick={goNext}
              className="rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white px-4 py-2 text-sm font-semibold transition"
            >
              Next
            </button>
          </div>
        </Card>
      )}

      {step === "rate" && (
        <Card title="">
          <div className="text-base font-semibold text-slate-900">2) Enter today’s rate</div>
          <div className="mt-2 text-sm text-slate-600">
            We need the <b>{basis === "gold" ? "24K gold" : "silver"}</b> rate to determine your Nisab threshold.
          </div>

          <div className="mt-4">
            <Field
              label={basis === "gold" ? "24K gold rate (₹/g)" : "Silver rate (₹/g)"}
              prefix="₹"
              value={nisabRateValue}
              onChange={(v) => {
                if (basis === "gold") setGold("24k", { rate: v });
                else setSilver({ silverRate: v });
              }}
            />
          </div>

          <div className="mt-5 flex items-center justify-between">
            <button
              type="button"
              onClick={goBack}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Back
            </button>

            <button
              type="button"
              disabled={!canNext}
              onClick={goNext}
              className={[
                "rounded-xl px-4 py-2 text-sm font-semibold transition",
                canNext ? "bg-emerald-800 hover:bg-emerald-900 text-white" : "bg-slate-200 text-slate-500"
              ].join(" ")}
            >
              Next
            </button>
          </div>
        </Card>
      )}

      {step === "gold24" && (
        <Card title="">
          <div className="text-base font-semibold text-slate-900">3) 24K Gold</div>
          <div className="mt-2 text-sm text-slate-600">If you don’t have any, leave it blank.</div>

          <div className="mt-4 space-y-3">
            <Field
              label="How many grams of 24K gold?"
              suffix="g"
              value={val(gold["24k"]?.grams)}
              onChange={(v) => setGold("24k", { grams: v })}
            />
            <Field
              label="24K rate (₹/g)"
              prefix="₹"
              value={val(gold["24k"]?.rate)}
              onChange={(v) => setGold("24k", { rate: v })}
            />
          </div>

          <div className="mt-5 flex items-center justify-between">
            <button
              type="button"
              onClick={goBack}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Back
            </button>
            <button
              type="button"
              onClick={goNext}
              className="rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white px-4 py-2 text-sm font-semibold transition"
            >
              Next
            </button>
          </div>
        </Card>
      )}

      {step === "gold22" && (
        <Card title="">
          <div className="text-base font-semibold text-slate-900">4) 22K Gold</div>
          <div className="mt-2 text-sm text-slate-600">If you don’t have any, leave it blank.</div>

          <div className="mt-4 space-y-3">
            <Field
              label="How many grams of 22K gold?"
              suffix="g"
              value={val(gold["22k"]?.grams)}
              onChange={(v) => setGold("22k", { grams: v })}
            />
            <Field
              label="22K rate (₹/g)"
              prefix="₹"
              value={val(gold["22k"]?.rate)}
              onChange={(v) => setGold("22k", { rate: v })}
            />
          </div>

          <div className="mt-5 flex items-center justify-between">
            <button
              type="button"
              onClick={goBack}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Back
            </button>
            <button
              type="button"
              onClick={goNext}
              className="rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white px-4 py-2 text-sm font-semibold transition"
            >
              Next
            </button>
          </div>
        </Card>
      )}

      {step === "gold18" && (
        <Card title="">
          <div className="text-base font-semibold text-slate-900">5) 18K Gold</div>
          <div className="mt-2 text-sm text-slate-600">If you don’t have any, leave it blank.</div>

          <div className="mt-4 space-y-3">
            <Field
              label="How many grams of 18K gold?"
              suffix="g"
              value={val(gold["18k"]?.grams)}
              onChange={(v) => setGold("18k", { grams: v })}
            />
            <Field
              label="18K rate (₹/g)"
              prefix="₹"
              value={val(gold["18k"]?.rate)}
              onChange={(v) => setGold("18k", { rate: v })}
            />
          </div>

          <div className="mt-5 flex items-center justify-between">
            <button
              type="button"
              onClick={goBack}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Back
            </button>
            <button
              type="button"
              onClick={goNext}
              className="rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white px-4 py-2 text-sm font-semibold transition"
            >
              Next
            </button>
          </div>
        </Card>
      )}

      {step === "silver" && (
        <Card title="">
          <div className="text-base font-semibold text-slate-900">6) Silver</div>

          <div className="mt-4 space-y-3">
            <Field
              label="How many grams of silver?"
              suffix="g"
              value={val(z.silverGrams)}
              onChange={(v) => setSilver({ silverGrams: v })}
            />
            <Field
              label="Silver rate (₹/g)"
              prefix="₹"
              value={val(z.silverRate)}
              onChange={(v) => setSilver({ silverRate: v })}
            />
          </div>

          <div className="mt-5 flex items-center justify-between">
            <button
              type="button"
              onClick={goBack}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Back
            </button>
            <button
              type="button"
              onClick={goNext}
              className="rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white px-4 py-2 text-sm font-semibold transition"
            >
              Next
            </button>
          </div>
        </Card>
      )}

      {step === "cash" && (
        <Card title="">
          <div className="text-base font-semibold text-slate-900">7) Cash in hand</div>

          <div className="mt-4">
            <Field
              label="Cash you currently have"
              prefix="₹"
              value={val(z.cash)}
              onChange={(v) => setZ((s: any) => ({ ...s, cash: v }))}
            />
          </div>

          <div className="mt-5 flex items-center justify-between">
            <button
              type="button"
              onClick={goBack}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Back
            </button>
            <button
              type="button"
              onClick={goNext}
              className="rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white px-4 py-2 text-sm font-semibold transition"
            >
              Next
            </button>
          </div>
        </Card>
      )}

      {step === "bank" && (
        <Card title="">
          <div className="text-base font-semibold text-slate-900">8) Cash in bank</div>

          <div className="mt-4">
            <Field
              label="Total balance across bank accounts"
              prefix="₹"
              value={val(z.bank)}
              onChange={(v) => setZ((s: any) => ({ ...s, bank: v }))}
            />
          </div>

          <div className="mt-5 flex items-center justify-between">
            <button
              type="button"
              onClick={goBack}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Back
            </button>
            <button
              type="button"
              onClick={goNext}
              className="rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white px-4 py-2 text-sm font-semibold transition"
            >
              Next
            </button>
          </div>
        </Card>
      )}

      {step === "other" && (
        <Card title="">
          <div className="text-base font-semibold text-slate-900">9) Other zakatable assets</div>

          <div className="mt-4 space-y-3">
            <Field
              label="Investments / savings"
              prefix="₹"
              value={val(z.investments)}
              onChange={(v) => setZ((s: any) => ({ ...s, investments: v }))}
            />
            <Field
              label="Business assets"
              prefix="₹"
              value={val(z.businessAssets)}
              onChange={(v) => setZ((s: any) => ({ ...s, businessAssets: v }))}
            />
            <Field
              label="Money lent to others"
              prefix="₹"
              value={val(z.moneyLent)}
              onChange={(v) => setZ((s: any) => ({ ...s, moneyLent: v }))}
            />
          </div>

          <div className="mt-5 flex items-center justify-between">
            <button
              type="button"
              onClick={goBack}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Back
            </button>
            <button
              type="button"
              onClick={goNext}
              className="rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white px-4 py-2 text-sm font-semibold transition"
            >
              Next
            </button>
          </div>
        </Card>
      )}

      {step === "deductions" && (
        <Card title="">
          <div className="text-base font-semibold text-slate-900">10) Deductions</div>
          <div className="mt-2 text-sm text-slate-600">Only include debts you need to repay soon.</div>

          <div className="mt-4">
            <Field
              label="Debts & liabilities"
              prefix="₹"
              value={val(z.debts)}
              onChange={(v) => setZ((s: any) => ({ ...s, debts: v }))}
            />
          </div>

          <div className="mt-5 flex items-center justify-between">
            <button
              type="button"
              onClick={goBack}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Back
            </button>
            <button
              type="button"
              onClick={goNext}
              className="rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white px-4 py-2 text-sm font-semibold transition"
            >
              Calculate Zakaat
            </button>
          </div>
        </Card>
      )}

      {/* ✅ Summary screen WITH result + breakdown */}
      {step === "summary" && (
        <Card title="">
          <div className="text-base font-semibold text-slate-900">Your Zakat Summary</div>
          <div className="mt-2 text-sm text-slate-600">
            This is based on the values you entered. You can edit answers or calculate again.
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
            {zakatResult?.breakdown?.nisabRateMissing ? (
              <div className="text-sm text-slate-700">
                We still need a valid <b>{zakatResult?.basis ?? basis}</b> rate to calculate Nisab and confirm whether Zakat is due.
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm text-slate-600">
                      {zakatResult?.eligible ? "Zakat to pay" : "Zakat not due (below Nisab)"}
                    </div>
                    <div className="mt-1 text-3xl font-semibold text-emerald-900">
                      ₹ {formatINR(zakatResult?.eligible ? zakatResult?.zakat : 0)}
                    </div>
                    <div className="mt-2 text-xs text-slate-600">
                      Net: ₹ {formatINR(zakatResult?.net ?? 0)} · Nisab: ₹ {formatINR(zakatResult?.nisab ?? 0)} ({zakatResult?.basis})
                    </div>
                  </div>

                  <span
                    className={[
                      "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold",
                      zakatResult?.eligible
                        ? "border-emerald-200 bg-emerald-100 text-emerald-900"
                        : "border-slate-200 bg-slate-100 text-slate-700"
                    ].join(" ")}
                  >
                    {zakatResult?.eligible ? "Due" : "Not due"}
                  </span>
                </div>

                {/* Breakdown */}
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 space-y-2">
                  <div className="font-semibold text-slate-900">Breakdown</div>
                  <div className="flex justify-between gap-3">
                    <span>Cash & bank</span>
                    <span className="font-semibold">₹ {formatINR(cashTotal)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span>Gold (24K)</span>
                    <span className="font-semibold">₹ {formatINR(gold24)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span>Gold (22K)</span>
                    <span className="font-semibold">₹ {formatINR(gold22)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span>Gold (18K)</span>
                    <span className="font-semibold">₹ {formatINR(gold18)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span>Silver</span>
                    <span className="font-semibold">₹ {formatINR(silverVal)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span>Other assets</span>
                    <span className="font-semibold">₹ {formatINR(otherTotal)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span>Deductions</span>
                    <span className="font-semibold">− ₹ {formatINR(debtsTotal)}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex justify-between gap-3">
                    <span className="font-semibold">Net zakatable wealth</span>
                    <span className="font-semibold">₹ {formatINR(zakatResult?.net ?? 0)}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={restartFlow}
              className="rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white px-4 py-2 text-sm font-semibold transition"
            >
              Calculate again
            </button>

            <button
              type="button"
              onClick={() => setStep("basis")}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Edit answers
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
