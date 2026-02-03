// lib/zakat.ts

export type NisabBasis = "silver" | "gold";
export type GoldKarat = "24k" | "22k" | "18k" | "custom";

export type GoldHoldings = {
  "24k": { grams: number | ""; rate: number | "" };
  "22k": { grams: number | ""; rate: number | "" };
  "18k": { grams: number | ""; rate: number | "" };
  custom: { grams: number | ""; rate: number | ""; purityPct: number | "" }; // 0–100
};

export type ZakatForm = {
  cash: number | "";
  bank: number | "";

  // ✅ New: multiple holdings by karat
  goldHoldings: GoldHoldings;

  // ✅ Keep this as UI selection state (and for backward compat if needed)
  goldKarat: GoldKarat;

  // ✅ Legacy fields (optional backward compatibility)
  goldGrams?: number | "";
  goldRate?: number | "";
  goldCustomPurity?: number | "";

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

function clampPct(pct: number) {
  return Math.min(100, Math.max(0, pct));
}

function karatToPurityFactor(karat: GoldKarat, customPurityPct: number) {
  if (karat === "24k") return 1.0;
  if (karat === "22k") return 0.916; // common approximation
  if (karat === "18k") return 0.75;
  return clampPct(customPurityPct) / 100;
}

function defaultGoldHoldings(): GoldHoldings {
  return {
    "24k": { grams: "", rate: "" },
    "22k": { grams: "", rate: "" },
    "18k": { grams: "", rate: "" },
    custom: { grams: "", rate: "", purityPct: "" }
  };
}

/**
 * Pure-gold rate is required for gold-basis nisab.
 * We:
 * - prefer 24k rate if present
 * - else derive pure rate from any available karat rate / purityFactor
 */
function derivePureGoldRate(holdings: GoldHoldings): number {
  const r24 = n(holdings["24k"]?.rate);
  if (r24 > 0) return r24;

  const r22 = n(holdings["22k"]?.rate);
  if (r22 > 0) return r22 / 0.916;

  const r18 = n(holdings["18k"]?.rate);
  if (r18 > 0) return r18 / 0.75;

  const rc = n(holdings.custom?.rate);
  const pc = n(holdings.custom?.purityPct);
  const factor = clampPct(pc) / 100;
  if (rc > 0 && factor > 0) return rc / factor;

  return 0;
}

export function calculateZakat(form: ZakatForm) {
  const cash = n(form.cash);
  const bank = n(form.bank);

  // ✅ Ensure holdings exists (safety)
  const holdings: GoldHoldings = (form.goldHoldings ?? defaultGoldHoldings()) as GoldHoldings;

  // ✅ Backward compat: if an older persisted form only has goldGrams/goldRate, map it into selected karat bucket
  const legacyGoldGrams = n((form as any).goldGrams);
  const legacyGoldRate = n((form as any).goldRate);
  const legacyGoldCustomPurity = n((form as any).goldCustomPurity);
  const selectedKarat: GoldKarat = form.goldKarat ?? "24k";

  const hasAnyHolding =
    n(holdings["24k"].grams) > 0 ||
    n(holdings["22k"].grams) > 0 ||
    n(holdings["18k"].grams) > 0 ||
    n(holdings.custom.grams) > 0 ||
    n(holdings["24k"].rate) > 0 ||
    n(holdings["22k"].rate) > 0 ||
    n(holdings["18k"].rate) > 0 ||
    n(holdings.custom.rate) > 0;

  if (!hasAnyHolding && (legacyGoldGrams > 0 || legacyGoldRate > 0)) {
    // place legacy into selected bucket (or custom)
    if (selectedKarat === "custom") {
      holdings.custom.grams = legacyGoldGrams || "";
      holdings.custom.rate = legacyGoldRate || "";
      holdings.custom.purityPct = legacyGoldCustomPurity || "";
    } else {
      (holdings[selectedKarat] as any).grams = legacyGoldGrams || "";
      (holdings[selectedKarat] as any).rate = legacyGoldRate || "";
    }
  }

  // ✅ Gold value = sum across all buckets (each adjusted by purity)
  const goldValue =
    n(holdings["24k"].grams) * n(holdings["24k"].rate) * 1.0 +
    n(holdings["22k"].grams) * n(holdings["22k"].rate) * 0.916 +
    n(holdings["18k"].grams) * n(holdings["18k"].rate) * 0.75 +
    n(holdings.custom.grams) *
      n(holdings.custom.rate) *
      karatToPurityFactor("custom", n(holdings.custom.purityPct));

  const silverGrams = n(form.silverGrams);
  const silverRate = n(form.silverRate);
  const silverValue = silverGrams * silverRate;

  const investments = n(form.investments);
  const businessAssets = n(form.businessAssets);
  const moneyLent = n(form.moneyLent);

  const debts = n(form.debts);

  const assets = cash + bank + goldValue + silverValue + investments + businessAssets + moneyLent;
  const net = Math.max(0, assets - debts);

  const basis = form.nisabBasis ?? "silver";

  const pureGoldRate = derivePureGoldRate(holdings);

  // ✅ Nisab uses pure gold/silver (purity does NOT affect nisab)
  const nisab =
    basis === "silver"
      ? SILVER_NISAB_GRAMS * silverRate
      : GOLD_NISAB_GRAMS * pureGoldRate;

  const nisabRateMissing =
    (basis === "silver" && silverRate <= 0) || (basis === "gold" && pureGoldRate <= 0);

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
      // helpful for UI/debug
      pureGoldRateUsedForNisab: pureGoldRate,
      goldHoldings: holdings,
      selectedGoldKarat: selectedKarat
    }
  };
}
