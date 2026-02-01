"use client";

import { useRef, useState } from "react";
import InstallBanner from "@/components/InstallBanner";
import PillarTabs from "@/components/PillarTabs";
import PillarHeader from "@/components/PillarHeader";
import Card from "@/components/Card";
import Field from "@/components/Field";
import Accordion from "@/components/Accordion";
import usePersistedState from "@/lib/usePersistedState";
import { PILLARS, PillarKey } from "@/lib/pillars";
import { calculateZakat } from "@/lib/zakat";

type NumOrEmpty = number | "";
type NisabBasis = "silver" | "gold";

type ZState = {
  cash: NumOrEmpty;
  bank: NumOrEmpty;

  goldGrams: NumOrEmpty;
  goldRate: NumOrEmpty;

  silverGrams: NumOrEmpty;
  silverRate: NumOrEmpty;

  investments: NumOrEmpty;
  businessAssets: NumOrEmpty;
  moneyLent: NumOrEmpty;

  debts: NumOrEmpty;

  nisabBasis: NisabBasis;
};

const ZAKAT_DEFAULTS: ZState = {
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
};

function formatINR(n: number) {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export default function HomePage() {
  const [active, setActive] = usePersistedState<PillarKey>(
    "fp_active_tab_v1",
    "zakat"
  );

  const [z, setZ] = usePersistedState<ZState>("fp_zakat_form_v3", ZAKAT_DEFAULTS);
  const pillar = PILLARS[active];
  const zakatResult = active === "zakat" ? calculateZakat(z as any) : null;

  const goldRateRef = useRef<HTMLInputElement | null>(null);
  const silverRateRef = useRef<HTMLInputElement | null>(null);

  const [toast, setToast] = useState("");

  const resetZakat = () => setZ(ZAKAT_DEFAULTS);

  const dismissToast = () => {
    window.clearTimeout((dismissToast as any)._t);
    (dismissToast as any)._t = window.setTimeout(() => setToast(""), 1600);
  };

  const downloadPdf = () => {
    if (!zakatResult) return;

    const text = [
      "Zakat Calculation Summary",
      "------------------------",
      `Status: ${zakatResult.eligible ? "Due" : "Not Due"}`,
      `Zakat: ₹ ${formatINR(zakatResult.zakat)}`,
      `Net: ₹ ${formatINR(zakatResult.net)}`,
      `Nisab (${zakatResult.basis}): ₹ ${formatINR(zakatResult.nisab)}`
    ].join("\n");

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "zakat-summary.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    setToast("Downloaded");
    dismissToast();
  };

  const handleShare = async () => {
    if (!zakatResult) return;

    const text = [
      "Zakat Calculation",
      `Status: ${zakatResult.eligible ? "Due" : "Not Due"}`,
      `Zakat: ₹ ${formatINR(zakatResult.zakat)}`,
      `Net: ₹ ${formatINR(zakatResult.net)}`,
      `Nisab (${zakatResult.basis}): ₹ ${formatINR(zakatResult.nisab)}`,
      "",
      "Calculated offline"
    ].join("\n");

    try {
      if (navigator.share) {
        await navigator.share({ title: "Zakat", text });
        setToast("Shared");
        dismissToast();
        return;
      }
    } catch {
      return;
    }

    await navigator.clipboard.writeText(text);
    setToast("Copied");
    dismissToast();
  };

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
            {/* FORM */}
            <div className="mt-6 space-y-4">
              <Card title="CASH & SAVINGS">
                <div className="space-y-3">
                  <Field label="Cash in hand" prefix="₹" value={z.cash} onChange={(v) => setZ(s => ({ ...s, cash: v }))} />
                  <Field label="Cash in bank" prefix="₹" value={z.bank} onChange={(v) => setZ(s => ({ ...s, bank: v }))} />
                </div>
              </Card>

              <Card title="PRECIOUS METALS">
                <div className="space-y-3">
                  <div className="rounded-xl border border-slate-200 p-3">
                    <div className="text-sm font-medium">Nisab basis</div>
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => {
                          setZ(s => ({ ...s, nisabBasis: "silver" }));
                          setTimeout(() => silverRateRef.current?.focus(), 50);
                        }}
                        className={`flex-1 rounded-xl border py-2 text-sm font-medium transition ${
                          z.nisabBasis === "silver"
                            ? "border-brand-300 bg-brand-50 text-brand-900"
                            : "border-slate-200"
                        }`}
                      >
                        Silver (595g)
                      </button>

                      <button
                        onClick={() => {
                          setZ(s => ({ ...s, nisabBasis: "gold" }));
                          setTimeout(() => goldRateRef.current?.focus(), 50);
                        }}
                        className={`flex-1 rounded-xl border py-2 text-sm font-medium transition ${
                          z.nisabBasis === "gold"
                            ? "border-brand-300 bg-brand-50 text-brand-900"
                            : "border-slate-200"
                        }`}
                      >
                        Gold (85g)
                      </button>
                    </div>
                  </div>

                  <Field label="Gold (grams)" suffix="g" value={z.goldGrams} onChange={(v) => setZ(s => ({ ...s, goldGrams: v }))} />
                  <Field label="Gold rate per gram" prefix="₹" value={z.goldRate} inputRef={goldRateRef} onChange={(v) => setZ(s => ({ ...s, goldRate: v }))} />

                  <Field label="Silver (grams)" suffix="g" value={z.silverGrams} onChange={(v) => setZ(s => ({ ...s, silverGrams: v }))} />
                  <Field label="Silver rate per gram" prefix="₹" value={z.silverRate} inputRef={silverRateRef} onChange={(v) => setZ(s => ({ ...s, silverRate: v }))} />
                </div>
              </Card>

              <div className="h-[320px]" />
            </div>

            {/* FIXED TRAY */}
            <div className="fixed left-0 right-0 bottom-0 z-50">
              <div className="h-10 bg-gradient-to-t from-white to-transparent" />

              <div className="px-3 pb-4">
                <div className="max-w-md mx-auto space-y-3">
                  {zakatResult && (
                    <Card title="RESULT" variant="result">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs">Zakat to Pay</div>
                          <div className="text-2xl font-bold text-brand-900">
                            ₹ {formatINR(zakatResult.zakat)}
                          </div>
                        </div>
                        <span className="text-[11px] px-2 py-1 rounded-full border bg-brand-100 text-brand-900 border-brand-200">
                          {zakatResult.eligible ? "Due" : "Not Due"}
                        </span>
                      </div>
                    </Card>
                  )}

                  {/* ACTIONS */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={downloadPdf}
                      className="rounded-xl bg-brand-800 text-white py-4 font-medium shadow-md hover:bg-brand-900 transition"
                    >
                      Download PDF
                    </button>

                    <button
                      onClick={handleShare}
                      className="rounded-xl border border-brand-300 bg-white text-brand-900 py-4 font-medium hover:bg-brand-50 transition"
                    >
                      Share
                    </button>
                  </div>

                  <button
                    onClick={resetZakat}
                    className="rounded-xl border border-slate-200 bg-white text-slate-700 py-3 text-sm font-medium hover:bg-slate-50 transition"
                  >
                    Reset
                  </button>

                  {toast && (
                    <div className="text-center text-xs text-slate-600">
                      {toast}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
