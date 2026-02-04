"use client";

import { useEffect } from "react";

/**
 * Single Help page with named sections.
 * Smooth-scrolls to hash anchors (e.g. /help#zakat) without
 * triggering Next.js CSR bailouts.
 */
export default function HelpPage() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const hash = window.location.hash;
    if (!hash) return;

    const id = hash.replace("#", "");
    const el = document.getElementById(id);

    if (el) {
      // Allow layout to settle before scrolling
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        // accessibility: focus target section
        el.setAttribute("tabindex", "-1");
        el.focus({ preventScroll: true });
      });
    }
  }, []);

  return (
    <main className="min-h-screen bg-[#F7F9F8]">
      <div className="container-page py-10">
        <div className="max-w-3xl mx-auto rounded-2xl border border-slate-200 bg-white p-6 soft-shadow">
          <header className="mb-4">
            <h1 className="text-2xl font-semibold text-slate-900">
              Help & Guides
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Everything in one place — getting started, Zakat calculations,
              privacy, and methodology.
            </p>

            {/* Quick nav */}
            <nav className="mt-4">
              <ul className="flex flex-wrap gap-3 text-xs">
                <li><a href="#getting-started" className="text-emerald-800 font-semibold hover:underline">Getting started</a></li>
                <li><a href="#zakat" className="text-emerald-800 font-semibold hover:underline">Zakat</a></li>
                <li><a href="#nisab" className="text-emerald-800 font-semibold hover:underline">Nisab</a></li>
                <li><a href="#sources" className="text-emerald-800 font-semibold hover:underline">Sources</a></li>
                <li><a href="#privacy" className="text-emerald-800 font-semibold hover:underline">Privacy</a></li>
                <li><a href="#feedback" className="text-emerald-800 font-semibold hover:underline">Feedback</a></li>
              </ul>
            </nav>
          </header>

          <div className="mt-6 space-y-10 text-sm text-slate-700 leading-relaxed">
            <section id="getting-started" className="scroll-mt-20">
              <h2 className="text-base font-semibold text-slate-900">
                Getting started
              </h2>
              <p className="mt-2">
                Use the homepage to explore the Five Pillars or jump straight into
                Zakat. Your inputs are saved locally on your device.
              </p>
            </section>

            <section id="zakat" className="scroll-mt-20">
              <h2 className="text-base font-semibold text-slate-900">
                Zakat calculator
              </h2>
              <p className="mt-2">
                The Zakat calculator estimates whether Zakat is due and how much
                to pay based on your inputs.
              </p>

              <p className="mt-2">
                <b>Net zakatable wealth</b> =
                (Cash + Bank + Gold + Silver + Investments + Business assets +
                Money lent) − Debts
              </p>

              <p className="mt-2">
                When eligible, Zakat is calculated at <b>2.5%</b>.
              </p>
            </section>

            <section id="nisab" className="scroll-mt-20">
              <h2 className="text-base font-semibold text-slate-900">
                Nisab threshold
              </h2>
              <ul className="mt-2 list-disc pl-5 space-y-2">
                <li>Silver basis: 612.36g × silver rate</li>
                <li>Gold basis: 87.48g × gold rate</li>
              </ul>
            </section>

            <section id="sources" className="scroll-mt-20">
              <h2 className="text-base font-semibold text-slate-900">
                Sources & methodology
              </h2>
              <p className="mt-2">
                This app follows widely accepted Zakat principles and values,
                aiming for clarity and transparency rather than legal rulings.
              </p>
            </section>

            <section id="privacy" className="scroll-mt-20">
              <h2 className="text-base font-semibold text-slate-900">
                Privacy
              </h2>
              <p className="mt-2">
                All data is stored locally on your device. No accounts, no
                tracking, no analytics.
              </p>
            </section>

            <section id="feedback" className="scroll-mt-20">
              <h2 className="text-base font-semibold text-slate-900">
                Feedback
              </h2>
              <p className="mt-2">
                Share bugs, suggestions, or improvements. Feedback helps make
                the app better for everyone.
              </p>
            </section>
          </div>

          <div className="mt-8 text-xs text-slate-500">
            Tip: You can link directly to sections (e.g. <code>/help#zakat</code>)
          </div>
        </div>
      </div>
    </main>
  );
}
