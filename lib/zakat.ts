// lib/zakat.ts

export type ZakatForm = {
  cash: number;
  bank: number;

  goldGrams: number;
  goldRate: number;   // ₹ per gram

  silverGrams: number;
  silverRate: number; // ₹ per gram

  investments: number;
  businessAssets: number;
  moneyLent: number;

  debts: number;
};

// Silver nisab is commonly 595g (some references use 612.36g; pick one and stay consistent)
const SILVER_NISAB_GRAMS = 595;

// Zakat rate is 2.5%
const ZAKAT_RATE = 0.025;

function n(v: any) {
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

  // Nisab uses silver threshold by default
  const nisab = SILVER_NISAB_GRAMS * silverRate;

  const eligible = nisab > 0 ? net >= nisab : false; // if silverRate is 0, we can't compute nisab reliably
  const zakat = eligible ? net * ZAKAT_RATE : 0;

  return {
    eligible,
    zakat,
    net,
    nisab,

    // optional breakdown (useful for future UI)
    breakdown: {
      assets,
      debts,
      goldValue,
      silverValue,
      silverNisabGrams: SILVER_NISAB_GRAMS
    }
  };
}
