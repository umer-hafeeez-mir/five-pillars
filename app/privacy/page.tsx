export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#F7F9F8]">
      <div className="container-page py-10">
        <div className="max-w-2xl mx-auto rounded-2xl border border-slate-200 bg-white p-6 soft-shadow">
          <h1 className="text-2xl font-semibold text-slate-900">Privacy</h1>

          <div className="mt-4 space-y-4 text-sm text-slate-700 leading-relaxed">
            <p>
              Your privacy is respected by design.
            </p>

            <p>
              All information entered into this app is stored locally on your device so you don’t
              lose progress between visits.
            </p>

            <p>
              The app does not use accounts, analytics, cookies, or third-party tracking.
            </p>

            <p>
              Data is never transmitted unless you explicitly choose to share results.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

