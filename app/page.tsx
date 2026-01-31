"use client";

import InstallBanner from "@/components/InstallBanner";
@@ -13,7 +12,10 @@ import { calculateZakat } from "@/lib/zakat";

export default function HomePage() {
  // Persist active tab (anonymous)
  const [active, setActive] = usePersistedState<PillarKey>("fp_active_tab_v1","zakat");




  // Persist zakat inputs (anonymous)
  const [z, setZ] = usePersistedState("fp_zakat_form_v1", {
@@ -28,7 +30,6 @@ export default function HomePage() {
  });

  const pillar = PILLARS[active];

  const zakatResult = active === "zakat" ? calculateZakat(z) : null;

  return (
@@ -39,15 +40,21 @@ export default function HomePage() {
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
@@ -60,7 +67,7 @@ export default function HomePage() {
          </div>
        ) : (
          <>
            {/* Zakat calculator */}
            <div className="mt-6 space-y-4">
              <Card title="CASH & SAVINGS">
                <div className="space-y-3">
@@ -86,13 +93,17 @@ export default function HomePage() {
                    label="Gold (grams)"
                    suffix="g"
                    value={z.goldGrams}
                    onChange={(v) => setZ((s: any) => ({ ...s, goldGrams: v }))}


                  />
                  <Field
                    label="Silver (grams)"
                    suffix="g"
                    value={z.silverGrams}
                    onChange={(v) => setZ((s: any) => ({ ...s, silverGrams: v }))}


                  />
                </div>
              </Card>
@@ -103,19 +114,25 @@ export default function HomePage() {
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
@@ -127,34 +144,83 @@ export default function HomePage() {
                    hint="Money you owe and must repay"
                    prefix="₹"
                    value={z.debts}
                    onChange={(v) => setZ((s: any) => ({ ...s, debts: v }))}


                  />
                </div>
              </Card>

              <Accordion title="About Zakat Calculation">
                <div className="text-sm text-slate-600 leading-relaxed space-y-2">
                  <p>
                    This estimates Zakat at <b>2.5%</b> on your net zakatable wealth (assets minus debts).

                  </p>
                  <p>
                    It uses the <b>silver nisab</b> by default (commonly used because it lowers the threshold).

                  </p>
                  <p className="text-xs text-slate-500">
                    Metal prices are set in code. You can later add live prices with an API.

                  </p>
                </div>
              </Accordion>

              {/* Sticky action like your screenshot */}
              <div className="sticky bottom-4 pt-2">
                <div className="max-w-md mx-auto space-y-2">
                  <button
                    onClick={() =>
                      document.getElementById("zakat-result")?.scrollIntoView({ behavior: "smooth" })
                    }
                    className="w-full rounded-xl bg-brand-800 hover:bg-brand-900 text-white py-4 font-medium soft-shadow"
                  >












































                    Calculate Zakat
                  </button>

@@ -177,32 +243,6 @@ export default function HomePage() {
                  </button>
                </div>
              </div>

              {/* Result */}
              {zakatResult && (
                <div id="zakat-result" className="max-w-md mx-auto mt-6">
                  <Card title="RESULT" variant="result">
                    {zakatResult.eligible ? (
                      <div className="text-center">
                        <div className="text-sm text-slate-600">Zakat to Pay</div>
                        <div className="mt-2 text-3xl font-semibold text-brand-900">
                          ₹ {zakatResult.zakat.toFixed(2)}
                        </div>
                        <div className="mt-3 text-xs text-slate-500">
                          Net zakatable amount: ₹ {zakatResult.net.toFixed(2)}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-slate-700">
                        You are below Nisab. No Zakat due.
                        <div className="mt-3 text-xs text-slate-500">
                          Net amount: ₹ {zakatResult.net.toFixed(2)} · Nisab: ₹ {zakatResult.nisab.toFixed(2)}
                        </div>
                      </div>
                    )}
                  </Card>
                </div>
              )}
            </div>
          </>
        )}
