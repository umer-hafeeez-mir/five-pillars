"use client";

import InstallBanner from "@/components/InstallBanner";
import PillarTabs from "@/components/PillarTabs";
import PillarHeader from "@/components/PillarHeader";
import Card from "@/components/Card";
import Field from "@/components/Field";
import Accordion from "@/components/Accordion";
import usePersistedState from "@/lib/usePersistedState";
import { PILLARS, PillarKey } from "@/lib/pillars";
import { calculateZakat } from "@/lib/zakat";

export default function HomePage() {
  // Persist active tab (anonymous)
  const [active, setActive] = usePersistedState<PillarKey>(
    "fp_active_tab_v1",
    "zakat"
  );

  // Persist zakat inputs (anonymous)
  const [z, setZ] = usePersistedState("fp_zakat_form_v1", {
    cash: 0,
    bank: 0,
    goldGrams: 0,
    silverGrams: 0,
    investments: 0,
    businessAssets: 0,
    moneyLent: 0,
    debts: 0
  });

  const pillar = PILLARS[active];
  const zakatResult = active === "zakat" ? calculateZakat(z) : null;

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
        <PillarHeader
          title={pillar.title}
          subtitle={pillar.subtitle}
          icon={pillar.icon}
        />

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
            {/* Zakat calculator form */}
            <div className="mt-6 space-y-4">
              <Card title="CASH & SAVINGS">
                <div className="space-y-3">
                  <Field
                    label="Cash in hand"
                    hint="Money you currently have"
                    prefix="₹"
                    value={z.cash}
                    onChange={(v) => setZ((s: any) => ({ ...s, cash: v }))}
                  />
                  <Field
                    label="Bank balance"
                    prefix="₹"
                    value={z.bank}
                    onChange={(v) => setZ((s: any) => ({ ...s, bank: v }))}
                  />
                </div>
              </Card>

              <Card title="PRECIOUS METALS">
                <div className="space-y-3">
                  <Field
                    label="Gold (grams)"
                    suffix="g"
                    value={z.goldGrams}
                    onChange={(v) =>
                      setZ((s: any) => ({ ...s, goldGrams: v }))
                    }
                  />
                  <Field
                    label="Silver (grams)"
                    suffix="g"
                    value={z.silverGrams}
                    onChange={(v) =>
                      setZ((s: any) => ({ ...s, silverGrams: v }))
                    }
                  />
                </div>
              </Card>

              <Card title="OTHER ASSETS">
                <div className="space-y-3">
                  <Field
                    label="Investments / Savings"
                    prefix="₹"
                    value={z.investments}
                    onChange={(v) =>
                      setZ((s: any) => ({ ...s, investments: v }))
                    }
                  />
                  <Field
                    label="Business assets"
                    prefix="₹"
                    value={z.businessAssets}
                    onChange={(v) =>
                      setZ((s: any) => ({ ...s, businessAssets: v }))
                    }
                  />
                  <Field
                    label="Money lent to others"
                    prefix="₹"
                    value={z.moneyLent}
                    onChange={(v) =>
                      setZ((s: any) => ({ ...s, moneyLent: v }))
                    }
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
                    onChange={(v) => setZ((s: any) => ({ ...s, debts: v }))}
                  />
                </div>
              </Card>

              <Accordion title="About Zakat Calculation">
                <div className="text-sm text-slate-600 leading-relaxed space-y-2">
                  <p>
                    This estimates Zakat at <b>2.5%</b> on your net zakatable
                    wealth (assets minus debts).
                  </p>
                  <p>
                    It uses the <b>silver nisab</b> by default (commonly used
                    because it lowers the threshold).
                  </p>
                  <p className="text-xs text-slate-500">
                    Metal prices are set in code. You can later add live prices
                    with an API.
                  </p>
                </div>
              </Accordion>

              {/* (3) Spacer so the form doesn’t get hidden under the fixed tray */}
              <div className="h-[320px]" />
            </div>

            {/* (1) Fixed Bottom Tray: Result + Calculate + Reset stay always on screen */}
            <div className="fixed left-0 right-0 bottom-0 z-50">
              {/* subtle fade to blend the tray with the page */}
              <div className="h-10 bg-gradient-to-t from-white to-transparent" />

              <div className="px-3 pb-4">
                <div className="max-w-md mx-auto space-y-3">
                  {/* RESULT (only here — (2) no in-flow Result block) */}
                  {zakatResult && (
                    <Card title="RESULT" variant="result">
                      {zakatResult.eligible ? (
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <div className="text-xs text-slate-700">
                              Zakat to Pay
                            </div>
                            <div className="mt-1 text-2xl font-bold text-brand-900 tracking-tight">
                              ₹ {zakatResult.zakat.toFixed(2)}
                            </div>
                            <div className="mt-1 text-[11px] text-slate-600">
                              Net: ₹ {zakatResult.net.toFixed(2)} · Nisab: ₹{" "}
                              {zakatResult.nisab.toFixed(2)}
                            </div>
                          </div>

                          <span className="text-[11px] px-2 py-1 rounded-full font-medium border bg-brand-100 text-brand-900 border-brand-200">
                            Due
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <div className="text-xs text-slate-700">
                              Below Nisab
                            </div>
                            <div className="mt-1 text-2xl font-bold text-slate-800 tracking-tight">
                              ₹ 0.00
                            </div>
                            <div className="mt-1 text-[11px] text-slate-600">
                              Net: ₹ {zakatResult.net.toFixed(2)} · Nisab: ₹{" "}
                              {zakatResult.nisab.toFixed(2)}
                            </div>
                          </div>

                          <span className="text-[11px] px-2 py-1 rounded-full font-medium border bg-slate-100 text-slate-700 border-slate-200">
                            Not Due
                          </span>
                        </div>
                      )}
                    </Card>
                  )}

                  <button
                    onClick={() =>
                      window.scrollTo({ top: 0, behavior: "smooth" })
                    }
                    className="w-full rounded-xl bg-brand-800 hover:bg-brand-900 text-white py-4 font-medium soft-shadow"
                  >
                    Calculate Zakat
                  </button>

                  <button
                    onClick={() =>
                      setZ({
                        cash: 0,
                        bank: 0,
                        goldGrams: 0,
                        silverGrams: 0,
                        investments: 0,
                        businessAssets: 0,
                        moneyLent: 0,
                        debts: 0
                      })
                    }
                    className="w-full rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 py-3 text-sm font-medium"
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
