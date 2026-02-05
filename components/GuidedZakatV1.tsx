"use client";

import React, { useMemo, useState } from "react";
import Field from "@/components/Field";
import Card from "@/components/Card";
import type { ZakatForm, GoldHoldings, GoldKarat } from "@/lib/zakat";
import { calculateZakat } from "@/lib/zakat";

type Step =
  | "nisabBasis"
  | "nisabRate"
  | "goldAny"
  | "gold24"
  | "gold22"
  | "gold18"
  | "goldCustom"
  | "silverAny"
  | "silverDetails"
  | "cashBank"
  | "otherAssets"
  | "debts"
  | "summary";

function n(v: any) {
  if (v === "" || v === null || v === undefined) return 0;
  const num = Number(v);
  return Number.isFinite(num) ? num : 0;
}

function formatINR(nm: number) {
  try {
    return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(nm);
  } catch {
    return String(Math.round(nm));
  }
}

function defaultGoldHoldings(): GoldHoldings {
  return {
    "24k": { grams: "", rate: "" },
    "22k": { grams: "", rate: "" },
    "18k": { grams: "", rate: "" },
    custom: { grams: "", rate: "", purityPct: "" }
  };
}

function ensureGoldHoldings(z: ZakatForm): GoldHoldings {
  return (z.goldHoldings as any) ?? defaultGoldHoldings();
}

function StepShell({
  title,
  subtitle,
  children,
  onBack,
  onNext,
  nextLabel = "Next",
  backLabel = "Back",
  canNext = true
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  backLabel?: string;
  canNext?: boolean;
}) {
  return (
    <Card title="">
      <div className="space-y-3">
        <div>
          <div className="text-lg font-semibold text-slate-900">{title}</div>
          {subtitle ? <div className="mt-1 text-sm text-slate-600">{subtitle}</div> : null}
        </div>

        <div>{children}</div>

        <div className="pt-2 flex items-center justify-between gap-3">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2 text-sm font-semibold transition"
            >
              {backLabel}
            </button>
          ) : (
            <span />
          )}

          {onNext ? (
            <button
              type="button"
              disabled={!canNext}
              onClick={onNext}
              className={[
                "rounded-xl px-5 py-2 text-sm font-semibold transition",
                canNext
                  ? "bg-emerald-800 hover:bg-emerald-900 text-white"
                  : "bg-slate-200 text-slate-500 cursor-not-allowed"
              ].join(" ")}
            >
              {nextLabel}
            </button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

function YesNo({
  value,
  onChange
}: {
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={[
          "rounded-xl border px-3 py-2 text-sm font-semibold transition",
          value === true
            ? "border-emerald-300 bg-emerald-50 text-emerald-900"
            : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
        ].join(" ")}
      >
        Yes
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={[
          "rounded-xl border px-3 py-2 text-sm font-semibold transition",
          value === false
            ? "border-emerald-300 bg-emerald-50 text-emerald-900"
            : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
        ].join(" ")}
      >
        No
      </button>
    </div>
  );
}

export default function GuidedZakatV1({
  z,
  setZ,
  traySpacerHeight = 360
}: {
  z: ZakatForm;
  setZ: (updater: any) => void;
  traySpacerHeight?: number;
}) {
  const [step, setStep] = useState<Step>("nisabBasis");

  // local yes/no flags to guide flow (do not affect calculation)
  const [hasGold, setHasGold] = useState<boolean | null>(null);
  const [has24, setHas24] = useState<boolean | null>(null);
  const [has22, setHas22] = useState<boolean | null>(null);
  const [has18, setHas18] = useState<boolean | null>(null);
  const [hasCustom, setHasCustom] = useState<boolean | null>(null);
  const [hasSilver, setHasSilver] = useState<boolean | null>(null);

  const basis = z.nisabBasis ?? "silver";
  const goldHoldings = ensureGoldHoldings(z);

  const zakatResult = useMemo(() => calculateZakat(z), [z]);
  const nisabText =
    zakatResult && zakatResult.nisab > 0 ? `₹ ${formatINR(zakatResult.nisab)}` : "₹ —";

  const manualRateValue =
    basis === "gold" ? (goldHoldings?.["24k"]?.rate ?? "") : (z.silverRate ?? "");
  const manualRateLabel = basis === "gold" ? "Gold rate (₹/g)" : "Silver rate (₹/g)";

  const setManualRate = (v: any) => {
    if (basis === "gold") {
      setZ((s: any) => ({
        ...s,
        goldHoldings: {
          ...(s.goldHoldings ?? defaultGoldHoldings()),
          "24k": {
            ...((s.goldHoldings ?? defaultGoldHoldings())["24k"]),
            rate: v
          }
        }
      }));
    } else {
      setZ((s: any) => ({ ...s, silverRate: v }));
    }
  };

  const goBack = (prev: Step) => setStep(prev);

  const goNextFromNisabBasis = () => setStep("nisabRate");

  const goNextFromNisabRate = () => setStep("goldAny");

  const goNextFromGoldAny = () => {
    if (hasGold === false) return setStep("silverAny");
    return setStep("gold24");
  };

  const goNextGold24 = () => setStep("gold22");
  const goNextGold22 = () => setStep("gold18");
  const goNextGold18 = () => setStep("goldCustom");

  const goNextGoldCustom = () => setStep("silverAny");

  const goNextSilverAny = () => {
    if (hasSilver === false) return setStep("cashBank");
    return setStep("silverDetails");
  };

  const goNextSilverDetails = () => setStep("cashBank");
  const goNextCash = () => setStep("otherAssets");
  const goNextOther = () => setStep("debts");
  const goNextDebts = () => setStep("summary");

  const canProceedNisabRate = String(manualRateValue ?? "").trim() !== "";

  const updateGold = (k: GoldKarat, patch: Partial<any>) => {
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

  return (
    <div className="mt-6 space-y-4">
      {/* STEP 1 */}
      {step === "nisabBasis" && (
        <StepShell
          title="Which Nisab basis would you like to use?"
          subtitle="This affects eligibility (whether Zakat is due), not the 2.5% rate."
          onNext={goNextFromNisabBasis}
          nextLabel="Continue"
        >
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setZ((s: any) => ({ ...s, nisabBasis: "silver" }))}
              className={[
                "rounded-xl border px-3 py-2 text-sm font-semibold transition",
                basis === "silver"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                  : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
              ].join(" ")}
            >
              Silver (612.36g)
            </button>
            <button
              type="button"
              onClick={() => setZ((s: any) => ({ ...s, nisabBasis: "gold" }))}
              className={[
                "rounded-xl border px-3 py-2 text-sm font-semibold transition",
                basis === "gold"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                  : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
              ].join(" ")}
            >
              Gold (87.48g)
            </button>
          </div>
        </StepShell>
      )}

      {/* STEP 2 */}
      {step === "nisabRate" && (
        <StepShell
          title={`Enter today’s ${basis === "gold" ? "gold" : "silver"} rate`}
          subtitle="A rough estimate is fine."
          onBack={() => goBack("nisabBasis")}
          onNext={goNextFromNisabRate}
          canNext={canProceedNisabRate}
        >
          <Field
            label={manualRateLabel}
            hint="Enter today’s approximate rate."
            prefix="₹"
            value={manualRateValue}
            onChange={setManualRate}
          />

          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <span className="font-semibold">Estimated Nisab threshold:</span>{" "}
            <span className="font-semibold">{nisabText}</span>
          </div>
        </StepShell>
      )}

      {/* STEP 3 */}
      {step === "goldAny" && (
        <StepShell
          title="Do you own any gold?"
          subtitle="We’ll ask by purity so it’s easy to enter."
          onBack={() => goBack("nisabRate")}
          onNext={goNextFromGoldAny}
          canNext={hasGold !== null}
        >
          <YesNo value={hasGold} onChange={setHasGold} />
        </StepShell>
      )}

      {/* GOLD 24K */}
      {step === "gold24" && (
        <StepShell
          title="Do you have 24K gold?"
          subtitle="If yes, add grams and the rate for 24K."
          onBack={() => goBack("goldAny")}
          onNext={goNextGold24}
          canNext={has24 !== null}
        >
          <YesNo value={has24} onChange={setHas24} />
          {has24 ? (
            <div className="mt-3 space-y-3">
              <Field
                label="24K gold weight (grams)"
                hint="Total grams you own."
                suffix="g"
                value={goldHoldings["24k"]?.grams ?? ""}
                onChange={(v) => updateGold("24k", { grams: v })}
              />
              <Field
                label="24K gold rate (₹/g)"
                hint="Approximate market rate per gram."
                prefix="₹"
                value={goldHoldings["24k"]?.rate ?? ""}
                onChange={(v) => updateGold("24k", { rate: v })}
              />
            </div>
          ) : null}
        </StepShell>
      )}

      {/* GOLD 22K */}
      {step === "gold22" && (
        <StepShell
          title="Do you have 22K gold?"
          subtitle="If yes, add grams and the rate for 22K."
          onBack={() => goBack("gold24")}
          onNext={goNextGold22}
          canNext={has22 !== null}
        >
          <YesNo value={has22} onChange={setHas22} />
          {has22 ? (
            <div className="mt-3 space-y-3">
              <Field
                label="22K gold weight (grams)"
                hint="Total grams you own."
                suffix="g"
                value={goldHoldings["22k"]?.grams ?? ""}
                onChange={(v) => updateGold("22k", { grams: v })}
              />
              <Field
                label="22K gold rate (₹/g)"
                hint="Approximate market rate per gram."
                prefix="₹"
                value={goldHoldings["22k"]?.rate ?? ""}
                onChange={(v) => updateGold("22k", { rate: v })}
              />
            </div>
          ) : null}
        </StepShell>
      )}

      {/* GOLD 18K */}
      {step === "gold18" && (
        <StepShell
          title="Do you have 18K gold?"
          subtitle="If yes, add grams and the rate for 18K."
          onBack={() => goBack("gold22")}
          onNext={goNextGold18}
          canNext={has18 !== null}
        >
          <YesNo value={has18} onChange={setHas18} />
          {has18 ? (
            <div className="mt-3 space-y-3">
              <Field
                label="18K gold weight (grams)"
                hint="Total grams you own."
                suffix="g"
                value={goldHoldings["18k"]?.grams ?? ""}
                onChange={(v) => updateGold("18k", { grams: v })}
              />
              <Field
                label="18K gold rate (₹/g)"
                hint="Approximate market rate per gram."
                prefix="₹"
                value={goldHoldings["18k"]?.rate ?? ""}
                onChange={(v) => updateGold("18k", { rate: v })}
              />
            </div>
          ) : null}
        </StepShell>
      )}

      {/* GOLD CUSTOM */}
      {step === "goldCustom" && (
        <StepShell
          title="Do you have gold with a custom purity?"
          subtitle="Optional — use this for non-standard purity."
          onBack={() => goBack("gold18")}
          onNext={goNextGoldCustom}
          canNext={hasCustom !== null}
        >
          <YesNo value={hasCustom} onChange={setHasCustom} />
          {hasCustom ? (
            <div className="mt-3 space-y-3">
              <Field
                label="Purity percentage"
                hint="Example: 91.6 (22K), 75 (18K)"
                suffix="%"
                value={goldHoldings.custom?.purityPct ?? ""}
                onChange={(v) => updateGold("custom", { purityPct: v })}
              />
              <Field
                label="Custom gold weight (grams)"
                hint="Total grams you own."
                suffix="g"
                value={goldHoldings.custom?.grams ?? ""}
                onChange={(v) => updateGold("custom", { grams: v })}
              />
              <Field
                label="Custom gold rate (₹/g)"
                hint="Approximate market rate per gram."
                prefix="₹"
                value={goldHoldings.custom?.rate ?? ""}
                onChange={(v) => updateGold("custom", { rate: v })}
              />
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                Tip: If you’re unsure, you can skip this section.
              </div>
            </div>
          ) : null}
        </StepShell>
      )}

      {/* SILVER ANY */}
      {step === "silverAny" && (
        <StepShell
          title="Do you own any silver?"
          subtitle="If yes, we’ll ask for grams and rate."
          onBack={() => goBack("goldCustom")}
          onNext={goNextSilverAny}
          canNext={hasSilver !== null}
        >
          <YesNo value={hasSilver} onChange={setHasSilver} />
        </StepShell>
      )}

      {/* SILVER DETAILS */}
      {step === "silverDetails" && (
        <StepShell
          title="Add your silver details"
          subtitle="Enter the total grams and approximate rate."
          onBack={() => goBack("silverAny")}
          onNext={goNextSilverDetails}
        >
          <div className="space-y-3">
            <Field
              label="Silver weight (grams)"
              hint="Total grams you own."
              suffix="g"
              value={z.silverGrams ?? ""}
              onChange={(v) => setZ((s: any) => ({ ...s, silverGrams: v }))}
            />
            <Field
              label="Silver rate (₹/g)"
              hint="Approximate market rate per gram."
              prefix="₹"
              value={z.silverRate ?? ""}
              onChange={(v) => setZ((s: any) => ({ ...s, silverRate: v }))}
            />
          </div>
        </StepShell>
      )}

      {/* CASH & BANK */}
      {step === "cashBank" && (
        <StepShell
          title="Cash & Bank"
          subtitle="Enter amounts you currently have access to."
          onBack={() => goBack(hasSilver ? "silverDetails" : "silverAny")}
          onNext={goNextCash}
        >
          <div className="space-y-3">
            <Field
              label="Cash in hand"
              hint="Money you currently have available."
              prefix="₹"
              value={z.cash ?? ""}
              onChange={(v) => setZ((s: any) => ({ ...s, cash: v }))}
            />
            <Field
              label="Bank balance"
              hint="Total balance across your accounts."
              prefix="₹"
              value={z.bank ?? ""}
              onChange={(v) => setZ((s: any) => ({ ...s, bank: v }))}
            />
          </div>
        </StepShell>
      )}

      {/* OTHER ASSETS */}
      {step === "otherAssets" && (
        <StepShell
          title="Other assets"
          subtitle="Optional — include these if they apply."
          onBack={() => goBack("cashBank")}
          onNext={goNextOther}
        >
          <div className="space-y-3">
            <Field
              label="Investments"
              hint="Stocks, mutual funds, liquid savings."
              prefix="₹"
              value={z.investments ?? ""}
              onChange={(v) => setZ((s: any) => ({ ...s, investments: v }))}
            />
            <Field
              label="Business assets"
              hint="Inventory, business cash, receivables."
              prefix="₹"
              value={z.businessAssets ?? ""}
              onChange={(v) => setZ((s: any) => ({ ...s, businessAssets: v }))}
            />
            <Field
              label="Money owed to you"
              hint="Loans you expect to be repaid."
              prefix="₹"
              value={z.moneyLent ?? ""}
              onChange={(v) => setZ((s: any) => ({ ...s, moneyLent: v }))}
            />
          </div>
        </StepShell>
      )}

      {/* DEBTS */}
      {step === "debts" && (
        <StepShell
          title="Deductions"
          subtitle="Add short-term debts you intend to repay."
          onBack={() => goBack("otherAssets")}
          onNext={goNextDebts}
        >
          <Field
            label="Short-term debts"
            hint="Bills or loans due soon."
            prefix="₹"
            value={z.debts ?? ""}
            onChange={(v) => setZ((s: any) => ({ ...s, debts: v }))}
          />
        </StepShell>
      )}

      {/* SUMMARY */}
      {step === "summary" && (
        <StepShell
          title="Summary"
          subtitle="Your detailed result is available in the result tray below."
          onBack={() => goBack("debts")}
          onNext={undefined}
        >
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-sm text-slate-700">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900">Status</span>
              <span className="font-semibold">
                {zakatResult?.breakdown?.nisabRateMissing
                  ? "Rate needed"
                  : zakatResult?.eligible
                  ? "Zakat is due"
                  : "Below Nisab"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span>Net</span>
              <span className="font-medium">₹ {formatINR(zakatResult?.net ?? 0)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span>Nisab ({basis})</span>
              <span className="font-medium">₹ {formatINR(zakatResult?.nisab ?? 0)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span>Zakat</span>
              <span className="font-medium">
                ₹ {formatINR(zakatResult?.eligible ? zakatResult?.zakat ?? 0 : 0)}
              </span>
            </div>

            {zakatResult?.breakdown?.nisabRateMissing ? (
              <div className="pt-2 text-xs text-slate-600">
                Add a valid {basis} rate to confirm eligibility.
              </div>
            ) : null}
          </div>

          <div style={{ height: traySpacerHeight }} />
        </StepShell>
      )}

      {/* Keep space so result tray doesn't cover content */}
      {step !== "summary" && <div style={{ height: traySpacerHeight }} />}
    </div>
  );
}
