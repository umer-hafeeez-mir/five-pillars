"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";

type Section = {
  id: string;
  title: string;
  body: React.ReactNode;
};

function Chevron({ open }: { open: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={[
        "inline-flex h-9 w-9 items-center justify-center rounded-full border transition",
        "border-slate-200 bg-white text-slate-700",
        open ? "rotate-180" : "rotate-0"
      ].join(" ")}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function CollapsibleSection({
  title,
  open,
  onToggle,
  children
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white soft-shadow overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={[
          "w-full text-left px-5 py-4",
          "flex items-center justify-between gap-4",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
          "transition"
        ].join(" ")}
      >
        <div className="text-base sm:text-lg font-semibold text-slate-900">{title}</div>
        <Chevron open={open} />
      </button>

      <div
        className={[
          "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        ].join(" ")}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5 pt-0 text-sm text-slate-700 leading-relaxed">{children}</div>
        </div>
      </div>
    </div>
  );
}

function Hr() {
  return <div className="my-3 h-px bg-slate-200/70" />;
}

function Callout({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4">
      <div className="text-xs font-semibold tracking-widest text-emerald-900/70">{title}</div>
      <div className="mt-2 text-sm text-slate-700 leading-relaxed">{children}</div>
    </div>
  );
}

export default function HelpPage() {
  // Accordion behavior: only one open at a time
  const sections: Section[] = useMemo(
    () => [
      {
        id: "getting-started",
        title: "1) Getting Started",
        body: (
          <>
            <div className="text-slate-600">
              <b>Five Pillars</b> is a simple companion app that helps you learn about the Five Pillars of Islam—and
              estimate Zakat based on the values you enter.
            </div>

            <Callout title="WHAT THIS APP DOES">
              <ul className="list-disc pl-5 space-y-1">
                <li>A simple, modern companion app to help you learn the Five Pillars of Islam—in clear, bite-sized sections.</li>
                <li>Helps you calculate Zakat using either a step-by-step Guided Flow or a faster Power Users mode.</li>
                <li>Explains the key events and rituals during Hajj, so you know what happens, when, and why it matters.</li>
                <li>Provides a curated collection of duas for daily life and for Hajj, with quick access when you need them most.</li>
                <li>Keeps your experience private and lightweight—no login required, and your entered values stay on your device (until you reset).</li>
              </ul>
            </Callout>
           <Callout title="PRIVACY">
              <ul className="list-disc pl-5 space-y-1">
                <li>Your entries are stored <b>only on your device</b> (local storage) so you don’t lose progress.</li>
                <li>No login required. No tracking.</li>
                <li>Using <b>Reset</b> clears stored inputs for this app on your device.</li>
              </ul>
            </Callout>

            <Hr />

            <div className="text-sm font-semibold text-slate-900">Add to Home Screen</div>
            <div className="mt-1 text-slate-600">
              Install the app on your phone for a more “native” feel.
            </div>

            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-900">iPhone / iPad (Safari)</div>
              <ol className="mt-2 list-decimal pl-5 space-y-1 text-slate-700">
                <li>Open the app in <b>Safari</b>.</li>
                <li>Tap the <b>Share</b> icon (square with arrow).</li>
                <li>Tap <b>Add to Home Screen</b>.</li>
                <li>Rename if you want, then tap <b>Add</b>.</li>
              </ol>
            </div>

            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-900">Android (Chrome)</div>
              <ol className="mt-2 list-decimal pl-5 space-y-1 text-slate-700">
                <li>Open the app in <b>Chrome</b>.</li>
                <li>Tap the <b>⋮</b> menu (top-right).</li>
                <li>Tap <b>Add to Home screen</b> or <b>Install app</b>.</li>
                <li>Confirm <b>Add / Install</b>.</li>
              </ol>
            </div>

            <div className="mt-3 text-xs text-slate-500">
              If you don’t see the option: try the correct browser (Safari on iOS, Chrome on Android) and refresh once.
            </div>
          </>
        )
      },
      {
        id: "shahada",
        title: "2) Shahada",
        body: (
          <>
            <div className="text-slate-600">
              <b>Shahada</b> is the declaration of faith and the foundation of Islam.
            </div>

            <Callout title="YOU’LL FIND">
              <ul className="list-disc pl-5 space-y-1">
                <li>What the Shahada means</li>
                <li>Why it matters</li>
                <li>How it connects to the other pillars</li>
              </ul>
            </Callout>

            <div className="mt-3 text-slate-600">
              <b>Key idea:</b> The Shahada is the core belief that shapes everything else—Salah, Zakat, Sawm, and Hajj.
            </div>
          </>
        )
      },
      {
        id: "salah",
        title: "3) Salah",
        body: (
          <>
            <div className="text-slate-600">
              <b>Salah</b> is the daily prayer—an anchor for faith, discipline, and connection.
            </div>

            <Callout title="YOU’LL FIND">
              <ul className="list-disc pl-5 space-y-1">
                <li>What Salah is</li>
                <li>Why it is performed daily</li>
                <li>How it shapes routine and mindfulness</li>
              </ul>
            </Callout>

            <div className="mt-3 text-slate-600">
              If you’re learning, focus first on <b>consistency and intention</b>—perfection comes with time.
            </div>
          </>
        )
      },
      {
        id: "zakat",
        title: "4) Zakat",
        body: (
          <>
            <div className="text-slate-600">
              <b>Zakat</b> is an annual obligation on eligible wealth, meant to purify wealth and support those in need.
              This app helps you estimate:
              <ul className="mt-2 list-disc pl-5 space-y-1">
                <li>Your net zakatable wealth</li>
                <li>Whether you meet <b>Nisab</b></li>
                <li>An estimated Zakat amount (2.5%) when applicable</li>
              </ul>
            </div>

            <Hr />

            <div className="text-sm font-semibold text-slate-900">What is Nisab?</div>
            <div className="mt-1 text-slate-600">
              <b>Nisab</b> is the minimum threshold that determines whether Zakat is due. You can choose your basis:
              <ul className="mt-2 list-disc pl-5 space-y-1">
                <li><b>Silver Nisab</b> (612.36g)</li>
                <li><b>Gold Nisab</b> (87.48g)</li>
              </ul>
            </div>

            <Callout title="IMPORTANT ABOUT RATES">
              <ul className="list-disc pl-5 space-y-1">
                <li>If your Nisab basis is <b>Gold</b>, the <b>gold rate</b> is required to calculate Nisab.</li>
                <li>If your Nisab basis is <b>Silver</b>, the <b>silver rate</b> is required to calculate Nisab.</li>
                <li>You can enter rates manually or use the app’s auto-fill option (if available).</li>
              </ul>
            </Callout>

            <Hr />

            <div className="text-sm font-semibold text-slate-900">How Zakat is calculated</div>
            <div className="mt-1 text-slate-600">
              <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                <div>
                  <b>Net zakatable wealth</b> =
                </div>
                <div className="mt-1">
                  (Cash + Bank + Gold + Silver + Investments + Business assets + Money lent) − Debts
                </div>
                <div className="mt-3">
                  Zakat is <b>due</b> if Net ≥ <b>Nisab</b>
                </div>
                <div className="mt-1">
                  If due, estimated Zakat = <b>2.5% × Net</b>
                </div>
              </div>
            </div>

            <Hr />

            <div className="text-sm font-semibold text-slate-900">Guided Flow</div>
            <div className="mt-1 text-slate-600">
              Guided Flow is step-by-step and designed to feel calm and easy.
            </div>
            <ul className="mt-2 list-disc pl-5 space-y-1 text-slate-700">
              <li>Choose Nisab (silver or gold)</li>
              <li>Add today’s rate (required based on your Nisab choice)</li>
              <li>Cash & bank</li>
              <li>Do you own gold? (Yes/No)</li>
              <li>Gold & silver (gold can be toggled on/off inline)</li>
              <li>Other assets</li>
              <li>Deductions → Calculate</li>
            </ul>

            <div className="mt-3 text-slate-600">
              Use Guided Flow if you want to ensure you don’t miss anything.
            </div>

            <Hr />

            <div className="text-sm font-semibold text-slate-900">Power Users</div>
            <div className="mt-1 text-slate-600">
              Power Users mode lets you enter everything quickly using expandable sections.
            </div>
            <ul className="mt-2 list-disc pl-5 space-y-1 text-slate-700">
              <li>Nisab & Eligibility</li>
              <li>Cash & Bank</li>
              <li>Gold & Silver</li>
              <li>Other Assets</li>
              <li>Deductions</li>
            </ul>

            <div className="mt-3 text-slate-600">
              Use Power Users if you already have your totals and rates ready.
            </div>

            <Hr />

            <div className="text-sm font-semibold text-slate-900">Summary screen</div>
            <div className="mt-1 text-slate-600">
              The summary shows:
              <ul className="mt-2 list-disc pl-5 space-y-1">
                <li>Zakat amount (or “not due”)</li>
                <li>Net wealth</li>
                <li>Nisab threshold and basis</li>
                <li>A breakdown of what was included</li>
              </ul>
            </div>
          </>
        )
      },
      {
        id: "sawm",
        title: "5) Sawm",
        body: (
          <>
            <div className="text-slate-600">
              <b>Sawm</b> refers to fasting in Ramadan—an act of worship, discipline, and empathy.
            </div>

            <Callout title="YOU’LL FIND">
              <ul className="list-disc pl-5 space-y-1">
                <li>What Sawm is</li>
                <li>The purpose and spirit behind fasting</li>
                <li>A simple overview of what fasting involves</li>
              </ul>
            </Callout>

            <div className="mt-3 text-slate-600">
              <b>Key idea:</b> Sawm isn’t only about food—it’s about self-control, gratitude, and character.
            </div>
          </>
        )
      },
      {
        id: "hajj",
        title: "6) Hajj",
        body: (
          <>
            <div className="text-slate-600">
              <b>Hajj</b> is the pilgrimage to Makkah—an obligation once in a lifetime for those who are physically and
              financially able.
            </div>

            <Callout title="YOU’LL FIND">
              <ul className="list-disc pl-5 space-y-1">
                <li>The meaning and purpose of Hajj</li>
                <li>A structured overview of the journey</li>
                <li>Guidance for what each tab/screen covers</li>
              </ul>
            </Callout>

            <Hr />

            <div className="text-sm font-semibold text-slate-900">How to read the Hajj screens</div>
            <div className="mt-1 text-slate-600">
              For each sub-screen, we keep it consistent:
              <ul className="mt-2 list-disc pl-5 space-y-1">
                <li>What it is</li>
                <li>Why it matters</li>
                <li>What you should do</li>
                <li>Common confusion points</li>
                <li>A quick tip</li>
              </ul>
            </div>
          </>
        )
      },
      {
  id: "feedback",
  title: "7) Feedback",
  body: (
    <>
      <div className="text-slate-600">
        Want to suggest an improvement, report a bug, or request a feature?
      </div>

      <Callout title="THE BEST KIND OF FEEDBACK">
        <ul className="list-disc pl-5 space-y-1">
          <li>What you were trying to do</li>
          <li>What you expected to happen</li>
          <li>What actually happened</li>
          <li>A screenshot (if possible)</li>
        </ul>
      </Callout>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {/* Primary feedback action */}
        <a
          href="mailto:umerhafeez.mir@outlook.com?subject=Five%20Pillars%20App%20Feedback"
          className="inline-flex items-center justify-center rounded-xl
                     bg-emerald-800 hover:bg-emerald-900
                     text-white px-4 py-2 text-sm font-semibold
                     transition shadow-sm"
        >
          Send feedback via email
        </a>

        {/* Secondary hint */}
        <span className="text-xs text-slate-500">
        
        </span>
      </div>
    </>
  )
},{
        id: "about",
        title: "8) About",
        body: (
          <>
            <div className="text-slate-600">
              Built by <b>Umer Hafeez Mir</b>.
            </div>

            <Callout title="WHY THIS APP EXISTS">
              <div>
                A calm, modern way to learn the Five Pillars—and make Zakat estimation feel simple, transparent, and
                approachable.
              </div>
            </Callout>

            <Callout title="DESIGN PRINCIPLES">
              <ul className="list-disc pl-5 space-y-1">
                <li><b>Human language</b> over formal jargon</li>
                <li><b>Clarity</b> over complexity</li>
                <li><b>Privacy first</b> (your data stays on your device)</li>
                <li><b>Guided when you want it</b>, fast when you need it</li>
              </ul>
            </Callout>

            <div className="mt-3 text-slate-600">
              If you find something confusing, that’s on the app—not on you. Feedback helps make it better for everyone.
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link
                href="/"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition"
              >
                Back to app
              </Link>
              <Link
                href="/help#getting-started"
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-100 transition"
              >
                Getting started
              </Link>
            </div>
          </>
        )
      }
    ],
    []
  );

  const [openId, setOpenId] = useState<string>("");

  return (
    <main className="min-h-screen bg-[#F7F9F8]">
      <div className="h-px bg-slate-200/70" />

      <div className="container-page pt-10 pb-14">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold tracking-widest text-slate-500">
              HELP
            </div>

            <h1 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
              Help Documentation
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Tap a section to expand.
            </p>
          </div>

          <div className="mt-8 space-y-4">
            {sections.map((s) => (
              <div key={s.id} id={s.id}>
                <CollapsibleSection
                  title={s.title}
                  open={openId === s.id}
                  onToggle={() => setOpenId((curr) => (curr === s.id ? "" : s.id))}
                >
                  {s.body}
                </CollapsibleSection>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center text-xs text-slate-500">
            Tip: You can bookmark specific sections using URLs like{" "}
            <span className="font-mono">/help#zakat</span>
          </div>
        </div>
      </div>
    </main>
  );
}
