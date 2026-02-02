"use client";

import { useEffect, useRef } from "react";
import PillarTabs from "@/components/PillarTabs";
import PillarHeader from "@/components/PillarHeader";
import Card from "@/components/Card";
import Field from "@/components/Field";
import Accordion from "@/components/Accordion";
import usePersistedState from "@/lib/usePersistedState";
import { PILLARS, PillarKey } from "@/lib/pillars";
import { calculateZakat, ZakatForm } from "@/lib/zakat";

function formatINR(n: number) {
  try {
    return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
  } catch {
    return String(Math.round(n));
  }
}

function formatDateTime(ts?: number | null) {
  if (!ts) return "—";
  try {
    const d = new Date(ts);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy}, ${hh}:${mi}:${ss}`;
  } catch {
    return "—";
  }
}

export default function HomePage() {
  const [active, setActive] = usePersistedState<PillarKey>("fp_active_tab_v1", "zakat");

  const [z, setZ] = usePersistedState<ZakatForm>("fp_zakat_form_v4", {
    cash: "",
    bank: "",

    goldGrams: "",
    goldRate: "",
    goldKarat: "22k",
    goldCustomPurity: "",

    silverGrams: "",
    silverRate: "",

    investments: "",
    businessAssets: "",
    moneyLent: "",

    debts: "",

    nisabBasis: "silver"
  });

  const [lastFetchedAt, setLastFetchedAt] = usePersistedState<number | null>(
    "fp_rates_last_fetched_v1",
    null
  );

  const [resultOpen, setResultOpen] = usePersistedState<boolean>(
    "fp_result_open_v1",
    false
  );

  const prevEligibleRef = useRef<boolean>(false);
  const prevActiveRef = useRef<PillarKey>(active);

  const pillar = PILLARS[active];
  const zakatResult = active === "zakat" ? calculateZakat(z) : null;

  useEffect(() => {
    if (active !== "zakat") {
      prevActiveRef.current = active;
      return;
    }

    const switchedToZakat =
      prevActiveRef.current !== "zakat" && active === "zakat";

    prevActiveRef.current = active;

    const eligibleNow = Boolean(zakatResult?.eligible);
    const eligibleBefore = prevEligibleRef.current;

    if (!switchedToZakat && !eligibleBefore && eligibleNow) {
      setResultOpen(true);
    }

    prevEligibleRef.current = eligibleNow;
  }, [active, zakatResult?.eligible, setResultOpen]);

  const TRAY_SPACER_HEIGHT = 360;

  const resetForm = () => {
    setZ({
      cash: "",
      bank: "",

      goldGrams: "",
      goldRate: "",
      goldKarat: "22k",
      goldCustomPurity: "",

      silverGrams: "",
      silverRate: "",

      investments: "",
      businessAssets: "",
      moneyLent: "",

      debts: "",

      nisabBasis: "silver"
    });
    setLastFetchedAt(null);
    setResultOpen(false);
  };

  const handleDownloadPDF = () => {
    if (!zakatResult) return;

    const lines = [
      `Zakat calculation (offline)`,
      `Status: ${zakatResult.eligible ? "Due" : "Not due"}`,
      `Zakat: ₹ ${formatINR(zakatResult.eligible ? zakatResult.zakat : 0)}`,
      `Net: ₹ ${formatINR(zakatResult.net)}`,
      `Nisab (${zakatResult.basis}): ₹ ${formatINR(zakatResult.nisab)}`
    ].join("\n");

    const blob = new Blob([lines], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "zakat-calculation.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (!zakatResult) return;

    const text = [
      `Zakat: ₹ ${formatINR(zakatResult.eligible ? zakatResult.zakat : 0)}`,
      `Net: ₹ ${formatINR(zakatResult.net)}`,
      `Nisab (${zakatResult.basis}): ₹ ${formatINR(zakatResult.nisab)}`,
      `Status: ${zakatResult.eligible ? "Due" : "Not due"}`
    ].join(" · ");

    try {
      // @ts-ignore
      if (navigator.share) {
        // @ts-ignore
        await navigator.share({ title: "Zakat calculation", text });
        return;
      }
    } catch {}

    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard.");
    } catch {
      window.prompt("Copy the result:", text);
    }
  };

  const basis = z.nisabBasis;
  const manualRateValue = basis === "gold" ? z.goldRate : z.silverRate;
  const manualRateLabel = basis === "gold" ? "Gold rate (₹/g)" : "Silver rate (₹/g)";

  const estimatedNisab =
    zakatResult && zakatResult.nisab > 0 ? `₹ ${formatINR(zakatResult.nisab)}` : "₹ —";

  const trayHeading = zakatResult?.breakdown?.nisabRateMissing
    ? `Add a ${zakatResult?.basis ?? basis} rate to check Nisab`
    : zakatResult?.eligible
    ? "Zakat is due"
    : "Zakat is not due";

  return (
    <main className="min-h-screen">
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
          title={active === "zakat" ? "Calculate Zakat" : pillar.title}
          subtitle={pillar.subtitle}
          icon={pillar.icon}
          hideIcon={active === "zakat"}
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
              <Card title="PRECIOUS METALS">
                <div className="space-y-3">
                  <Field
                    label="Gold (grams)"
                    suffix="g"
                    value={z.goldGrams}
                    onChange={(v) => setZ((s: any) => ({ ...s, goldGrams: v }))}
                  />

                  <div>
                    <div className="text-xs font-semibold tracking-wide text-slate-500">
                      GOLD PURITY
                    </div>

                    <div className="mt-2 grid grid-cols-4 gap-2">
                      {(["24k", "22k", "18k", "custom"] as const).map((k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setZ((s: any) => ({ ...s, goldKarat: k }))}
                          className={[
                            "rounded-xl border px-3 py-2 text-sm font-semibold transition",
                            z.goldKarat === k
                              ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                              : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                          ].join(" ")}
                        >
                          {k === "custom" ? "Custom" : k.toUpperCase()}
                        </button>
                      ))}
                    </div>

                    {z.goldKarat === "custom" && (
                      <div className="mt-3">
                        <Field
                          label="Custom purity (%)"
                          hint="Example: 91.6 for 22k, 75 for 18k"
                          suffix="%"
                          value={z.goldCustomPurity}
                          onChange={(v) =>
                            setZ((s: any) => ({ ...s, goldCustomPurity: v }))
                          }
                        />
                      </div>
                    )}

                    <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                      Jewellery value is adjusted by purity (e.g., 18k = 75%). Nisab always uses pure gold/silver.
                    </p>
                  </div>

                  <Field
                    label="Gold rate (₹/g)"
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
                    label="Silver rate (₹/g)"
                    prefix="₹"
                    value={z.silverRate}
                    onChange={(v) => setZ((s: any) => ({ ...s, silverRate: v }))}
                  />
                </div>
              </Card>

              <div style={{ height: TRAY_SPACER_HEIGHT }} />
            </div>

            <div className="fixed inset-x-0 bottom-0 z-50 pointer-events-none">
              <div
                className="container-page pb-4"
                style={{
                  paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)"
                }}
              >
                <div className="max-w-md mx-auto pointer-events-auto">
                  <div className="rounded-2xl border border-slate-200 bg-white p-3 soft-shadow">
                    {zakatResult && (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4">
                        <button
                          type="button"
                          onClick={() => setResultOpen((v) => !v)}
                          className="w-full text-left"
                          aria-expanded={resultOpen}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-[11px] tracking-widest text-emerald-800/70 font-semibold">
                                RESULT
                              </div>
                              <div className="mt-2 text-base font-semibold text-slate-900">
                                {trayHeading}
                              </div>
                              <div className="mt-1 text-xs text-slate-500">
                                {resultOpen ? "Tap to collapse" : "Tap to expand"}
                              </div>
                            </div>

                            <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700">
                              {resultOpen ? "–" : "+"}
                            </span>
                          </div>
                        </button>

                        {resultOpen && (
                          <div className="mt-4">
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <div className="text-sm text-slate-600">
                                  {zakatResult.eligible ? "Zakat to pay" : "Below Nisab"}
                                </div>
                                <div className="mt-1 text-3xl font-semibold text-emerald-900">
                                  ₹ {formatINR(zakatResult.eligible ? zakatResult.zakat : 0)}
                                </div>
                                <div className="mt-2 text-xs text-slate-600">
                                  Net: ₹ {formatINR(zakatResult.net)} · Nisab: ₹{" "}
                                  {formatINR(zakatResult.nisab)} ({zakatResult.basis})
                                </div>
                              </div>

                              <span
                                className={[
                                  "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold",
                                  zakatResult.eligible
                                    ? "border-emerald-200 bg-emerald-100 text-emerald-900"
                                    : "border-slate-200 bg-slate-100 text-slate-700"
                                ].join(" ")}
                              >
                                {zakatResult.eligible ? "Due" : "Not due"}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={handleDownloadPDF}
                        className="w-full rounded-xl bg-brand-800 hover:bg-brand-900 text-white py-3 font-semibold soft-shadow transition"
                      >
                        Download PDF
                      </button>

                      <button
                        type="button"
                        onClick={handleShare}
                        className="w-full rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 py-3 font-semibold transition"
                      >
                        Share
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={resetForm}
                      className="mt-3 w-full rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 py-3 text-sm font-semibold transition"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
