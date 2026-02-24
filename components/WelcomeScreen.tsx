"use client";

import React from "react";

export type WelcomeAnnouncement = {
  title?: string;
  message?: string;
  /** Optional: e.g. "New in 1.2" or "Update available" */
  badge?: string;
};

type WelcomeScreenProps = {
  onContinue: () => void;
  /** Optional announcement/update to show (e.g. release notes, notification). When set, the main content area shows this instead of default tagline. */
  announcement?: WelcomeAnnouncement | null;
  /** Optional custom content slot for richer announcements (overrides announcement title/message when provided). */
  children?: React.ReactNode;
  /** Button label. Default: "Continue" */
  buttonLabel?: "Continue" | "Explore";
};

export default function WelcomeScreen({
  onContinue,
  announcement,
  children,
  buttonLabel = "Continue",
}: WelcomeScreenProps) {
  // Ensure boolean value + allow proper TS narrowing
  const hasAnnouncement = Boolean(
    announcement?.title || announcement?.message || announcement?.badge
  );

  const showCustomContent = Boolean(children);

  return (
    <div
      className="min-h-screen min-h-[100dvh] flex flex-col bg-white relative overflow-hidden"
      role="region"
      aria-label="Welcome"
    >
      {/* Opaque gradient overlay — app colors, no transparency so nothing shows through */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-teal-100 via-cyan-50 to-teal-200 pointer-events-none"
        aria-hidden
      />
      <div className="relative flex flex-col flex-1 items-center justify-center px-6 pt-12 pb-10 text-center">
        {/* Title only — no icon, no Early Access */}
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-1">
          Five Pillars
        </h1>
        <p className="text-sm text-teal-800/90 mb-8">of Islam</p>

        {/* Welcome message / announcement slot */}
        <div className="w-full max-w-lg mx-auto mb-8 min-h-[64px] flex flex-col justify-center">
          {showCustomContent ? (
            <div className="text-slate-700 leading-relaxed">{children}</div>
          ) : announcement && hasAnnouncement ? (
            <div className="rounded-2xl border border-teal-200 bg-white/80 backdrop-blur px-5 py-4 text-left shadow-sm">
              {announcement.badge && (
                <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-teal-600 bg-teal-100 px-2 py-0.5 rounded-full mb-2">
                  {announcement.badge}
                </span>
              )}
              {announcement.title && (
                <h2 className="text-lg font-semibold text-slate-900">
                  {announcement.title}
                </h2>
              )}
              {announcement.message && (
                <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                  {announcement.message}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3 text-slate-700">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
                Experience Islam with clarity and calm.
              </h2>
              <p className="text-sm sm:text-base leading-relaxed">
                Your companion in learning, understanding, and strengthening
                your foundation in Islam.
              </p>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="w-full max-w-sm mx-auto mt-auto pt-4">
          <p className="text-sm text-teal-800/90 mb-4">Ready to begin?</p>
          <button
            type="button"
            onClick={onContinue}
            className="w-full min-h-[52px] px-6 py-3.5 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold text-base shadow-lg shadow-teal-900/20 hover:shadow-xl transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-50 active:scale-[0.98]"
            aria-label={buttonLabel}
          >
            {buttonLabel} →
          </button>
          <p className="mt-4 text-[10px] text-slate-600">
            An educational companion — not a religious verdict.
          </p>
        </div>
      </div>
    </div>
  );
}
