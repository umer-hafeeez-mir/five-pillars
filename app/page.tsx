"use client";

import { useRef } from "react";
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
  const [active, setActive] = usePersistedState<PillarKey>(
    "fp_active_tab_v1",
    "zakat"
  );

  const [z, setZ] = usePersistedState("fp_zakat_form_v3", {
    cash: "",
    bank: "",

    goldGrams: "",
    goldRate: "",

    silverGrams: "",
    silverRate: "",

    investments: "",
    businessAssets: "",
    moneyLent: "",

    debts: "",

    nisabBasis: "silver" as "silver" | "gold"
  });

  const pillar = PILLARS[active];
  const zakatResult = active === "zakat" ? calculateZakat(z as any) : null;

  // 🔑 refs for autofocus
  const goldRateRef = useRef<HTMLInputElement | null>(null);
  const silverRateRef = useRef<HTMLInputElement | null>(null);

  const resetZakat = () =>
    setZ({
      cash: "",
      bank: "",

      goldGrams: "",
      goldRate: "",

      silverGrams: "",
      silverRate: "",

      investments: "",
      businessAssets: "",
      moneyLent: "",

      debts: "",

      nisabBasis: "silver"
    });

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
            <div className="mt-6 space-y-4">
              <Card title="CASH & SAVINGS">
                <div className="space-y-3">
                  <Field
                    label="Cash in hand"
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
                  {/* Nisab basis */}
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="text-sm font-medium text-slate-800">
                      Nisab basis
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setZ((s: any) => ({ ...s, nisabBasis: "silver" }));
                          setTimeout(() => silverRateRef.current?.focus(), 50);
                        }}
                        className={[
                          "flex-1 rounded-xl border px-3 py-2 text-sm font-medium",
                          z.nisabBasis === "silver"
                            ? "border-brand-300 bg-brand-50 text-brand-900"
                            : "border-slate-200 bg-white text-slate-700"
                        ].join(" ")}
                      >
                        Silver (595g)
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setZ((s: any) => ({ ...s, nisabBasis: "gold" }));
                          setTimeout(() => goldRateRef.current?.focus(), 50);
                        }}
                        className={[
                          "flex-1 rounded-xl border px-3 py-2 text-sm font-medium",
                          z.nisabBasis === "gold"
                            ? "border-brand-300 bg-brand-50 text-brand-900"
                            : "border-slate-200 bg-white text-slate-700"
                        ].join(" ")}
                      >
                        Gold (85g)
                      </button>
                    </div>
                  </div>

                  <Field
                    label="Gold (grams)"
                    suffix="g"
                    value={z.goldGrams}
                    onChange={(v) => setZ((s: any) => ({ ...s, goldGrams: v }))}
                  />

                  <Field
                    label="Gold rate per gram"
                    prefix="₹"
                    value={z.goldRate}
                    inputRef={goldRateRef}
                    onChange={(v) => setZ((s: any) => ({ ...s, goldRate: v }))}
                  />

                  <Field
                    label="Silver (grams)"
                    suffix="g"
                    value={z.silverGrams}
                    onChange={(v) =>
                      setZ((s: any) => ({ ...s, silverGrams: v }))
                    }
                  />

                  <Field
                    label="Silver rate per gram"
                    prefix="₹"
                    value={z.silverRate}
                    inputRef={silverRateRef}
                    onChange={(v) =>
                      setZ((s: any) => ({ ...s, silverRate: v }))
                    }
                  />
                </div>
              </Card>

              {/* Spacer for fixed tray */}
              <div className="h-[320px]" />
            </div>

            {/* Fixed Bottom Tray */}
            <div className="fixed left-0 right-0 bottom-0 z-50">
              <div className="h-10 bg-gradient-to-t from-white to-transparent" />
              <div className="px-3 pb-4">
                <div className="max-w-md mx-auto space-y-3">
                  {zakatResult && (
                    <Card title="RESULT" variant="result">
                      {zakatResult.eligible ? (
                        <div className="text-2xl font-bold text-brand-900">
                          ₹ {zakatResult.zakat.toFixed(2)}
                        </div>
                      ) : (
                        <div className="text-slate-700">Below Nisab</div>
                      )}
                    </Card>
                  )}

                  <button
                    onClick={resetZakat}
                    className="w-full rounded-xl bg-slate-100 hover:bg-slate-200 py-3 text-sm font-medium"
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
