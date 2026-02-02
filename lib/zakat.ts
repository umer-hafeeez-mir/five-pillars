// lib/zakat.ts

export type NisabBasis = "silver" | "gold";
export type GoldKarat = "24k" | "22k" | "18k" | "custom";

export type ZakatForm = {
  cash: number | "";
  bank: number | "";

  goldGrams: number | "";
  goldRate: number | ""; // ₹ per gram (rate of gold used in your market)

  // ✅ New: gold purity selector
  goldKarat: GoldKarat;
  goldCustomPurity: number | ""; // percentage (0–100) used when karat = "custom"

  silverGrams: number | "";
  silverRate: number | ""; // ₹ per gram

  investments: number | "";
  businessAssets: number | "";
  moneyLent: number | "";

  debts: number | "";

  nisabBasis: NisabBasis;
};

// Classical nisab weights (as you decided)
const SILVER_NISAB_GRAMS = 612.36;
const GOLD_NISAB_GRAMS = 87.48;

const ZAKAT_RATE = 0.025;

function n(v: any) {
  if (v === "" || v === null || v === undefined) return 0;
  const num = Number(v);
  return Number.isFinite(num) ? num : 0;
}

// ✅ Karat → purity factor
function karatToPurityFactor(karat: GoldKarat, customPurityPct: number) {
  if (karat === "24k") return 1.0;
  if (karat === "22k") return 0.916; // common approximation
  if (karat === "18k") return 0.75;
  // custom: treat as percentage
  const pct = Math.min(100, Math.max(0, customPurityPct));
  return pct / 100;
}

export function calculateZakat(form: ZakatForm) {
  const cash = n(form.cash);
  const bank = n(form.bank);

  const goldGrams = n(form.goldGrams);
  const goldRate = n(form.goldRate);

  const goldKarat: GoldKarat = form.goldKarat ?? "24k";
  const goldCustomPurity = n(form.goldCustomPurity);

  const goldPurityFactor = karatToPurityFactor(goldKarat, goldCustomPurity);

  // ✅ Gold value adjusted by purity
  const goldValue = goldGrams * goldPurityFactor * goldRate;

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

  const basis = form.nisabBasis ?? "silver";

  // ✅ Nisab is based on nisab grams × rate per gram (purity does NOT affect nisab)
  const nisab =
    basis === "silver"
      ? SILVER_NISAB_GRAMS * silverRate
      : GOLD_NISAB_GRAMS * goldRate;

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
    breakdown: {
      assets,
      debts,
      goldValue,
      silverValue,
      goldNisabGrams: GOLD_NISAB_GRAMS,
      silverNisabGrams: SILVER_NISAB_GRAMS,
      zakatRate: ZAKAT_RATE,
      nisabRateMissing,

      // ✅ helpful UI details
      goldPurityFactor,
      goldKarat,
      goldCustomPurity
    }
  };
}
