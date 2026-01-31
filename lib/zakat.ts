
type ZakatInput = {
  cash: number;
  bank: number;
  goldGrams: number;
  silverGrams: number;
  investments: number;
  businessAssets: number;
  moneyLent: number;
  debts: number;
};

export function calculateZakat(input: ZakatInput) {
  // Defaults (edit anytime). Later you can swap in a live price API.
  const GOLD_PRICE_PER_GRAM = 6000;
  const SILVER_PRICE_PER_GRAM = 75;

  // Silver nisab commonly ~ 612.36g
  const nisab = 612.36 * SILVER_PRICE_PER_GRAM;

  const assets =
    input.cash +
    input.bank +
    input.investments +
    input.businessAssets +
    input.moneyLent +
    input.goldGrams * GOLD_PRICE_PER_GRAM +
    input.silverGrams * SILVER_PRICE_PER_GRAM;

  const net = Math.max(0, assets - input.debts);

  const eligible = net >= nisab;
  const zakat = eligible ? net * 0.025 : 0;

  return { eligible, zakat, net, nisab };
}
