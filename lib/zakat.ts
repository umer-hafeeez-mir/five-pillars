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

  nisabBasis: NisabBasis; // ✅ user choice
};

// Common nisab weights
const SILVER_NISAB_GRAMS = 595; // widely used
const GOLD_NISAB_GRAMS = 85;    // widely used

const ZAKAT_RATE = 0.025;

function n(v: any) {
  // Treat "" or null as 0
  if (v === "" || v === null || v === undefined) return 0;
  const num = Number(v);
  return Number.isFinite(num) ? num : 0;
}

export function calculateZakat(form: ZakatForm) {
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

  const assets =
    cash +
    bank +
    goldValue +
    silverValue +
    investments +
    businessAssets +
    moneyLent;

  const net = Math.max(0, assets - debts);

  // ✅ Nisab basis selection
  const basis = form.nisabBasis ?? "silver";
  const nisab =
    basis === "silver"
      ? SILVER_NISAB_GRAMS * silverRate
      : GOLD_NISAB_GRAMS * goldRate;

  // If chosen basis rate is missing, nisab can't be computed
  const nisabRateMissing =
    (basis === "silver" && silverRate <= 0) ||
    (basis === "gold" && goldRate <= 0);

  const eligible = !nisabRateMissing && nisab > 0 ? net >= nisab : false;
  const zakat = eligible ? net * ZAKAT_RATE : 0;

  return {
    eligible,
    zakat,
    net,
    nisab,
    basis,

    // Helpful details for UI/docs
    breakdown: {
      assets,
      debts,
      goldValue,
      silverValue,
      goldNisabGrams: GOLD_NISAB_GRAMS,
      silverNisabGrams: SILVER_NISAB_GRAMS,
      zakatRate: ZAKAT_RATE,
      nisabRateMissing
    }
  };
}
