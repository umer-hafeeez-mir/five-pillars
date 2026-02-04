"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Single Help page with named sections.
 * Smooth-scrolls to anchors when navigated to with a hash (e.g. /help#about).
 */

export default function HelpPage() {
  // Next.js App Router helpers (client component)
  // usePathname + useSearchParams allow us to respond to hash changes.
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Scroll to the hash target when the route changes or when arrived with a fragment.
    // We run this in a useEffect so it fires on client navigation.
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (!hash) return;

    const id = hash.replace("#", "");
    const el = document.getElementById(id);
    if (el) {
      // prefer smooth behavior
      el.scrollIntoView({ behavior: "smooth", block: "start" });

      // set focus for keyboard & screen reader users
      (el as HTMLElement).setAttribute("tabindex", "-1");
      (el as HTMLElement).focus({ preventScroll: true });
    }
  }, [pathname, searchParams?.toString()]);

  return (
    <main className="min-h-screen bg-[#F7F9F8]">
      <div className="container-page py-10">
        <div className="max-w-3xl mx-auto rounded-2xl border border-slate-200 bg-white p-6 soft-shadow">
          <header className="mb-4">
            <h1 className="text-2xl font-semibold text-slate-900">Help & Guides</h1>
            <p className="mt-2 text-sm text-slate-600">
              Everything in one place — getting started, how Zakat is calculated, privacy, and how to give feedback.
            </p>

            <nav className="mt-4">
              <ul className="flex flex-wrap gap-3 text-xs">
                <li>
                  <a className="text-emerald-800 font-semibold hover:underline" href="#getting-started">
                    Getting started
                  </a>
                </li>
                <li>
                  <a className="text-emerald-800 font-semibold hover:underline" href="#zakat">
                    Zakat calculator
                  </a>
                </li>
                <li>
                  <a className="text-emerald-800 font-semibold hover:underline" href="#nisab">
                    Nisab
                  </a>
                </li>
                <li>
                  <a className="text-emerald-800 font-semibold hover:underline" href="#privacy">
                    Privacy
                  </a>
                </li>
                <li>
                  <a className="text-emerald-800 font-semibold hover:underline" href="#sources">
                    Sources & methodology
                  </a>
                </li>
                <li>
                  <a className="text-emerald-800 font-semibold hover:underline" href="#feedback">
                    Feedback
                  </a>
                </li>
              </ul>
            </nav>
          </header>

          <div className="mt-6 space-y-10 text-sm text-slate-700 leading-relaxed">
            <section id="getting-started" className="scroll-mt-20">
              <h2 className="text-base font-semibold text-slate-900">Getting started</h2>
              <p className="mt-2">
                Use the homepage to explore the Five Pillars or jump straight into any pillar using the grid.
                Your inputs are saved locally so you don’t lose progress.
              </p>
              <ul className="mt-3 list-disc pl-5 space-y-2">
                <li>Tap a card to open the pillar-specific tools and learning content.</li>
                <li>Use the Home icon (top-left) to return to this landing view.</li>
                <li>Links in the footer navigate to these sections directly (e.g. About → /help#about).</li>
              </ul>
            </section>

            <section id="zakat" className="scroll-mt-20">
              <h2 className="text-base font-semibold text-slate-900">Zakat calculator</h2>
              <p className="mt-2">
                The Zakat tool estimates whether Zakat is due and calculates the amount. It is an educational tool — consult a scholar for complex cases.
              </p>

              <div className="mt-3">
                <h3 className="font-semibold text-slate-900">What it includes</h3>
                <ul className="mt-2 list-disc pl-5 space-y-2">
                  <li>Cash, bank balances</li>
                  <li>Gold & silver (entered as grams + rate)</li>
                  <li>Investments, business assets, money lent</li>
                  <li>Minus: short term debts & liabilities</li>
                </ul>
              </div>

              <div className="mt-3">
                <h3 className="font-semibold text-slate-900">How Zakat is calculated</h3>
                <p className="mt-2">
                  <b>Net zakatable wealth</b> = (Cash + Bank + Gold + Silver + Investments + Business assets + Money lent) − Debts.
                </p>
                <p className="mt-2">
                  When net wealth ≥ Nisab, <b>Zakat = 2.5%</b> of the net zakatable wealth.
                </p>
              </div>

              <div className="mt-3">
                <h3 className="font-semibold text-slate-900">Result tray</h3>
                <p className="mt-2">
                  The bottom tray summarizes whether Zakat is due, shows the estimated Zakat, and provides quick actions (Download / Share / Reset).
                </p>
              </div>
            </section>

            <section id="nisab" className="scroll-mt-20">
              <h2 className="text-base font-semibold text-slate-900">Nisab threshold</h2>
              <p className="mt-2">
                Nisab is the minimum threshold for Zakat. You can choose the basis:
              </p>
              <ul className="mt-2 list-disc pl-5 space-y-2">
                <li><b>Silver basis</b>: 612.36g × silver rate</li>
                <li><b>Gold basis</b>: 87.48g × gold rate</li>
              </ul>
              <p className="mt-2">If a required market rate is missing, we’ll ask you to provide it before confirming eligibility.</p>
            </section>

            <section id="sources" className="scroll-mt-20">
              <h2 className="text-base font-semibold text-slate-900">Sources & methodology</h2>
              <p className="mt-2">
                This app uses commonly accepted nisab values and a 2.5% Zakat rate. It aims for transparency and clarity rather than issuing religious rulings.
              </p>

              <ul className="mt-3 list-disc pl-5 space-y-2">
                <li><b>Nisab values:</b> Gold 87.48 g, Silver 612.36 g</li>
                <li><b>Rate:</b> Zakat = 2.5% of net zakatable wealth</li>
                <li><b>Net wealth:</b> liquid assets + precious metals + investments + business assets + money owed − debts</li>
              </ul>

              <p className="mt-2">Different schools may have differing opinions — consult your preferred scholar when in doubt.</p>
            </section>

            <section id="about" className="scroll-mt-20">
              <h2 className="text-base font-semibold text-slate-900">About</h2>
              <p className="mt-2">
                The Five Pillars app is a calm, privacy-first companion for practicing core Islamic obligations. It focuses on clarity and trustworthy tools.
              </p>
            </section>

            <section id="privacy" className="scroll-mt-20">
              <h2 className="text-base font-semibold text-slate-900">Privacy</h2>
              <p className="mt-2">
                We store your inputs locally on your device (localStorage). No accounts, no analytics, no third-party tracking. Nothing is sent unless you explicitly share.
              </p>
            </section>

            <section id="feedback" className="scroll-mt-20">
              <h2 className="text-base font-semibold text-slate-900">Feedback</h2>
              <p className="mt-2">
                Your feedback helps improve the app. Share bugs, copy suggestions, or feature ideas. You can also email us or link a form (we can wire this up on request).
              </p>
            </section>

            <section id="faqs" className="scroll-mt-20">
              <h2 className="text-base font-semibold text-slate-900">FAQs</h2>
              <div className="mt-2 space-y-2 text-sm text-slate-700">
                <div>
                  <div className="font-semibold">Q: Is this a fatwa?</div>
                  <div>No — this is an educational tool. For legal rulings consult a qualified scholar.</div>
                </div>

                <div>
                  <div className="font-semibold">Q: Where are rates fetched from?</div>
                  <div>Rates can be entered manually or (optionally) fetched from market sources. You control what’s stored.</div>
                </div>
              </div>
            </section>
          </div>

          <div className="mt-8 text-xs text-slate-500">
            Tip: You can link to specific sections directly (e.g. <code>/help#zakat</code>).
          </div>
        </div>
      </div>
    </main>
  );
}

