// lib/zakat.ts

export type NisabBasis = "silver" | "gold";

export type ZakatForm = {
  cash: number | "";
  bank: number | "";

  goldGrams: number | "";
  goldRate: number | "";   // ₹ per gram

  silverGrams: number | "";
  silverRate: number | ""; // ₹ per gram

  investments: number | "";
  businessAssets: number | "";
  moneyLent: number | "";

  debts: number | "";

  nisabBasis: NisabBasis;
};

// Common nisab weights (widely used)
export const SILVER_NISAB_GRAMS = 595;
export const GOLD_NISAB_GRAMS = 85;

export const ZAKAT_RATE = 0.025;

function n(v: unknown): number {
  // Treat ""/null/undefined as 0
  if (v === "" || v === null || v === undefined) return 0;
  const num = Number(v);
  return Number.isFinite(num) ? num : 0;
}

export type ZakatStatus = "due" | "not_due" | "rate_missing";

export function calculateZakat(form: ZakatForm) {
  // Inputs
  const cash = n(form.cash);
  const bank = n(form.bank);

  const goldGrams = n(form.goldGrams);
  const goldRate = n(form.goldRate);
  const goldValue = goldGrams * goldRate;

  const silverGrams = n(form.silverGrams);
  const silverRate = n(form.silverRate);
  const silverValue = silverGrams * silverRate;

  const investments = n(form.investments);
  const businessAssets = n(form.businessAssets);
  const moneyLent = n(form.moneyLent);

  const debts = n(form.debts);

  // Totals
  const assets =
    cash +
    bank +
    goldValue +
    silverValue +
    investments +
    businessAssets +
    moneyLent;

  // Keep raw net for transparency
  const rawNet = assets - debts;

  // For eligibility & zakat, negative net should behave as 0 (no zakat due)
  const netZakatable = Math.max(0, rawNet);

  // Nisab basis selection
  const basis: NisabBasis = form.nisabBasis ?? "silver";

  const basisRate = basis === "silver" ? silverRate : goldRate;
  const basisGrams = basis === "silver" ? SILVER_NISAB_GRAMS : GOLD_NISAB_GRAMS;

  // If chosen basis rate is missing, nisab can't be computed
  const nisabRateMissing = basisRate <= 0;

  const nisab = nisabRateMissing ? 0 : basisGrams * basisRate;

  const eligible = !nisabRateMissing && nisab > 0 ? netZakatable >= nisab : false;
  const zakat = eligible ? netZakatable * ZAKAT_RATE : 0;

  const status: ZakatStatus = nisabRateMissing
    ? "rate_missing"
    : eligible
      ? "due"
      : "not_due";

  // Documentation strings (for in-app help, PDF, share)
  const formulas = {
    assets:
      "Assets = cash + bank + (gold grams × gold rate) + (silver grams × silver rate) + investments + business assets + money lent",
    net: "Net = Assets − debts",
    nisab:
      basis === "silver"
        ? `Nisab (Silver) = ${SILVER_NISAB_GRAMS}g × silver rate`
        : `Nisab (Gold) = ${GOLD_NISAB_GRAMS}g × gold rate`,
    zakat: "If Net ≥ Nisab, Zakat = 2.5% × Net"
  };

  return {
    eligible,
    status,
    zakat,

    // Keep returning `net` like before, but now it's the true value
    net: rawNet,

    // Still return nisab + basis
    nisab,
    basis,

    breakdown: {
      // Inputs (optional but useful)
      cash,
      bank,
      investments,
      businessAssets,
      moneyLent,
      debts,

      goldGrams,
      goldRate,
      goldValue,

      silverGrams,
      silverRate,
      silverValue,

      assets,
      rawNet,
      netZakatable,

      basisRate,
      basisGrams,

      goldNisabGrams: GOLD_NISAB_GRAMS,
      silverNisabGrams: SILVER_NISAB_GRAMS,
      zakatRate: ZAKAT_RATE,
      nisabRateMissing,

      formulas
    }
  };
}
