
"use client";

import { useEffect, useMemo, useState } from "react";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIOS() {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  const nav: any = window.navigator;
  const iosStandalone = !!nav.standalone;
  const otherStandalone = window.matchMedia?.("(display-mode: standalone)")?.matches;
  return iosStandalone || otherStandalone;
}

export default function InstallBanner() {
  const [bip, setBip] = useState<BIPEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const show = useMemo(() => {
    if (dismissed) return false;
    if (isStandalone()) return false;
    return true;
  }, [dismissed]);

  useEffect(() => {
    const key = "fp_install_banner_dismissed_v1";
    setDismissed(localStorage.getItem(key) === "1");

    const handler = (e: Event) => {
      e.preventDefault();
      setBip(e as BIPEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!show) return null;

  const dismiss = () => {
    localStorage.setItem("fp_install_banner_dismissed_v1", "1");
    setDismissed(true);
  };

  const doInstall = async () => {
    if (!bip) return;
    await bip.prompt();
    const choice = await bip.userChoice;
    if (choice.outcome === "accepted") dismiss();
  };

  return (
    <div className="fixed left-0 right-0 bottom-3 z-50 px-3">
      <div className="max-w-md mx-auto rounded-2xl border border-slate-200 bg-white soft-shadow p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">Install for offline use</div>
            <div className="text-xs text-slate-500 mt-1">
              Works privately on your device after install.
              {isIOS() && !bip ? (
                <>
                  {" "}
                  On iPhone/iPad: tap <b>Share</b> → <b>Add to Home Screen</b>.
                </>
              ) : null}
            </div>
          </div>

          <button
            onClick={dismiss}
            className="text-slate-400 hover:text-slate-600 text-lg leading-none"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>

        <div className="mt-3 flex gap-2">
          {bip ? (
            <button
              onClick={doInstall}
              className="flex-1 rounded-xl bg-brand-800 hover:bg-brand-900 text-white py-2 text-sm font-medium"
            >
              Install
            </button>
          ) : (
            <button
              onClick={dismiss}
              className="flex-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 py-2 text-sm font-medium"
            >
              Got it
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
