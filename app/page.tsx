"use client";

import { useMemo, useState } from "react";
import PillarTabs from "@/components/PillarTabs";
import PillarHeader from "@/components/PillarHeader";
import Card from "@/components/Card";
import Field from "@/components/Field";
import Accordion from "@/components/Accordion";
import usePersistedState from "@/lib/usePersistedState";
import { PILLARS, PillarKey } from "@/lib/pillars";
import { calculateZakat, NisabBasis, ZakatForm } from "@/lib/zakat";

/** Formatting helpers */
function formatINR(n: number) {
  try {
    return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
  } catch {
    return String(Math.round(n));
  }
}
function formatINR2(n: number) {
  try {
    return new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(n);
  } catch {
    return String(n.toFixed(2));
  }
}

/** Nisab weights (for display + docs) */
const GOLD_NISAB_GRAMS = 85;
const SILVER_NISAB_GRAMS = 595;

export default function HomePage() {
  // Persist active tab (anonymous)
  const [active, setActive] = usePersistedState<PillarKey>("fp_active_tab_v1", "zakat");

  // Persist zakat inputs (anonymous)
  const [z, setZ] = usePersistedState<ZakatForm & { goldRateUpdatedAt?: number; silverRateUpdatedAt?: number }>(
    "fp_zakat_form_v3",
    {
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

      nisabBasis: "silver",

      // offline cache timestamps
      goldRateUpdatedAt: undefined,
      silverRateUpdatedAt: undefined
    }
  );

  const pillar = PILLARS[active];

  const zakatResult = useMemo(() => {
    return active === "zakat" ? calculateZakat(z) : null;
  }, [active, z]);

  // --- optional online fetch state
  const [fetchState, setFetchState] = useState<{ loading: boolean; error: string | null }>({
    loading: false,
    error: null
  });

  async function fetchLatestRate(basis: NisabBasis) {
    try {
      setFetchState({ loading: true, error: null });

      const res = await fetch(`/api/metal-rates?basis=${basis}&currency=INR`, { cache: "no-store" });
      const data = await res.json();

      if (!res.ok || !data?.success || !data?.perGram) {
        throw new Error(data?.error || "Failed to fetch rate");
      }

      const perGram = Number(data.perGram);
      const updatedAt = (data.timestamp ? Number(data.timestamp) : Math.floor(Date.now() / 1000)) * 1000;

      setZ((s: any) => {
        if (basis === "gold") {
          return { ...s, goldRate: perGram, goldRateUpdatedAt: updatedAt };
        }
        return { ...s, silverRate: perGram, silverRateUpdatedAt: updatedAt };
      });

      setFetchState({ loading: false, error: null });
    } catch (e: any) {
      setFetchState({ loading: false, error: e?.message || "Could not fetch rate" });
    }
  }

  const TRAY_HEIGHT_PX = 360;

  const resetForm = () => {
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

      nisabBasis: "silver",

      goldRateUpdatedAt: undefined,
      silverRateUpdatedAt: undefined
    });
  };

  const onShare = async () => {
    if (!zakatResult) return;

    const textLines = [
      `Zakat Calculator`,
      `Status: ${zakatResult.eligible ? "Due" : "Not Due"}`,
      `Zakat: ₹ ${formatINR2(zakatResult.eligible ? zakatResult.zakat : 0)}`,
      `Net: ₹ ${formatINR2(zakatResult.net)}`,
      `Nisab (${zakatResult.basis}): ₹ ${formatINR2(zakatResult.nisab)}`
    ];

    const text = textLines.join("\n");

    try {
      // @ts-ignore
      if (navigator.share) {
        // @ts-ignore
        await navigator.share({ title: "Zakat Calculation", text });
        return;
      }
    } catch {
      // ignore
    }

    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard");
    } catch {
      window.prompt("Copy this text:", text);
    }
  };

  const onDownloadPDF = () => {
    alert("PDF download can be implemented next (jsPDF / react-pdf).");
  };

  const basisRate =
    z.nisabBasis === "gold"
      ? (z.goldRate === "" ? 0 : Number(z.goldRate))
      : (z.silverRate === "" ? 0 : Number(z.silverRate));

  const basisUpdatedAt = z.nisabBasis === "gold" ? z.goldRateUpdatedAt : z.silverRateUpdatedAt;

  const nisabDisplay = (() => {
    if (!basisRate || basisRate <= 0) return null;
    const grams = z.nisabBasis === "gold" ? GOLD_NISAB_GRAMS : SILVER_NISAB_GRAMS;
    return grams * basisRate;
  })();

  return (
    <main className="min-h-screen">
      <header className="container-page pt-10 pb-4 text-center">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Five Pillars of Islam</h1>
        <p className="mt-1 text-sm text-slate-500">Simple · Private · Offline</p>

        <div className="mt-6">
          <PillarTabs active={active} onChange={setActive} />
        </div>
      </header>

      <section className="container-page pb-16">
        <PillarHeader title={pillar.title} subtitle={pillar.subtitle} icon={pillar.icon} />

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
              {/* NEW: Nisab card (manual first, optional fetch) */}
              <Card title="NISAB (ELIGIBILITY)">
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="text-sm font-semibold text-slate-800">Choose Nisab basis</div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setZ((s: any) => ({ ...s, nisabBasis: "silver" }))}
                      className={[
                        "rounded-xl border px-3 py-3 text-sm font-semibold transition",
                        z.nisabBasis === "silver"
                          ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                          : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                      ].join(" ")}
                    >
                      Silver (595g)
                    </button>

                    <button
                      type="button"
                      onClick={() => setZ((s: any) => ({ ...s, nisabBasis: "gold" }))}
                      className={[
                        "rounded-xl border px-3 py-3 text-sm font-semibold transition",
                        z.nisabBasis === "gold"
                          ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                          : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                      ].join(" ")}
                    >
                      Gold (85g)
                    </button>
                  </div>

                  <div className="mt-3 text-xs text-slate-500">
                    Nisab determines whether Zakat is due based on your <b>total net assets</b> (not just metals).
                  </div>

                  <div className="mt-4 grid gap-3">
                    {/* Manual rate field (primary) */}
                    {z.nisabBasis === "gold" ? (
                      <Field
                        label="Gold rate per gram (manual)"
                        prefix="₹"
                        value={z.goldRate}
                        onChange={(v) => setZ((s: any) => ({ ...s, goldRate: v }))}
                      />
                    ) : (
                      <Field
                        label="Silver rate per gram (manual)"
                        prefix="₹"
                        value={z.silverRate}
                        onChange={(v) => setZ((s: any) => ({ ...s, silverRate: v }))}
                      />
                    )}

                    {/* Optional fetch */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs text-slate-600">
                        {basisUpdatedAt ? (
                          <>
                            Last fetched:{" "}
                            <span className="font-semibold">{new Date(basisUpdatedAt).toLocaleString()}</span>
                          </>
                        ) : (
                          <>You can optionally fetch a live estimate (requires internet).</>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => fetchLatestRate(z.nisabBasis)}
                        disabled={fetchState.loading}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                      >
                        {fetchState.loading ? "Fetching…" : "Fetch online (optional)"}
                      </button>
                    </div>

                    {fetchState.error ? (
                      <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                        {fetchState.error}. You can continue using manual rates (offline).
                      </div>
                    ) : null}

                    {/* Quick computed threshold preview */}
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                      {nisabDisplay ? (
                        <>
                          Estimated Nisab threshold: <b>₹ {formatINR(nisabDisplay)}</b> (based on{" "}
                          {z.nisabBasis === "gold" ? "85g gold" : "595g silver"} × your rate)
                        </>
                      ) : (
                        <>Enter a {z.nisabBasis} rate per gram to compute the Nisab threshold.</>
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              <Card title="CASH & SAVINGS">
                <div className="space-y-3">
                  <Field
                    label="Cash in hand"
                    prefix="₹"
                    value={z.cash}
                    onChange={(v) => setZ((s: any) => ({ ...s, cash: v }))}
                  />
                  <Field
                    label="Cash in bank"
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
                    onChange={(v) => setZ((s: any) => ({ ...s, goldGrams: v }))}
                  />
                  <Field
                    label="Gold rate per gram"
                    prefix="₹"
                    value={z.goldRate}
                    onChange={(v) => setZ((s: any) => ({ ...s, goldRate: v }))}
                  />
                  <Field
                    label="Silver (grams)"
                    suffix="g"
                    value={z.silverGrams}
                    onChange={(v) => setZ((s: any) => ({ ...s, silverGrams: v }))}
                  />
                  <Field
                    label="Silver rate per gram"
                    prefix="₹"
                    value={z.silverRate}
                    onChange={(v) => setZ((s: any) => ({ ...s, silverRate: v }))}
                  />
                  <p className="text-xs text-slate-500">
                    Rates are used to value your metals and compute Nisab eligibility. You can enter them manually or
                    fetch online in the Nisab card.
                  </p>
                </div>
              </Card>

              <Card title="OTHER ASSETS">
                <div className="space-y-3">
                  <Field
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

              <Accordion title="How Zakat is calculated">
                <div className="text-sm text-slate-600 leading-relaxed space-y-2">
                  <p>
                    <b>Assets</b> = cash + bank + (gold grams × gold rate) + (silver grams × silver rate) + other assets.
                  </p>
                  <p>
                    <b>Net</b> = max(0, assets − debts).
                  </p>
                  <p>
                    <b>Nisab</b> = (85g gold × gold rate) OR (595g silver × silver rate), depending on your selection.
                  </p>
                  <p>
                    If net ≥ Nisab, then <b>Zakat</b> = 2.5% of net.
                  </p>
                </div>
              </Accordion>

              <div style={{ height: TRAY_HEIGHT_PX }} />
            </div>

            {/* Fixed bottom tray */}
            {zakatResult && (
              <div
                className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur"
                style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
              >
                <div className="container-page py-3">
                  <div className="max-w-md mx-auto space-y-3">
                    <div className="rounded-2xl border border-emerald-300 bg-emerald-50/40 p-5 soft-shadow">
                      <div className="text-[11px] tracking-widest text-emerald-900/70 font-semibold">RESULT</div>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm text-slate-700">
                            {zakatResult.eligible ? "Zakat to Pay" : "Below Nisab"}
                          </div>
                          <div className="mt-1 text-3xl font-semibold text-emerald-900">
                            ₹ {formatINR(zakatResult.eligible ? zakatResult.zakat : 0)}
                          </div>

                          <div className="mt-2 text-xs text-slate-600">
                            Net: ₹ {formatINR(zakatResult.net)} · Nisab: ₹ {formatINR(zakatResult.nisab)} (
                            {zakatResult.basis})
                          </div>
                        </div>

                        <div
                          className={[
                            "shrink-0 rounded-full px-3 py-1 text-xs font-semibold border",
                            zakatResult.eligible
                              ? "bg-emerald-100 text-emerald-900 border-emerald-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          ].join(" ")}
                        >
                          {zakatResult.eligible ? "Due" : "Not Due"}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={onDownloadPDF}
                        className="w-full rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white py-4 font-semibold soft-shadow transition"
                      >
                        Download PDF
                      </button>

                      <button
                        onClick={onShare}
                        className="w-full rounded-xl border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-900 py-4 font-semibold transition"
                      >
                        Share
                      </button>
                    </div>

                    <button
                      onClick={resetForm}
                      className="w-full rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 py-3 text-sm font-semibold transition"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
