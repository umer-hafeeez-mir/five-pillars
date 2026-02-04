export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#F7F9F8]">
      <div className="container-page py-10">
        <div className="max-w-2xl mx-auto rounded-2xl border border-slate-200 bg-white p-6 soft-shadow">
          <h1 className="text-2xl font-semibold text-slate-900">About</h1>

          <div className="mt-4 space-y-4 text-sm text-slate-700 leading-relaxed">
            <p>
              The Five Pillars app is designed to help Muslims practice core aspects of Islam with
              clarity, calm, and confidence.
            </p>

            <p>
              It focuses on simplicity and trust — offering guidance and tools like the Zakat
              calculator without ads, tracking, or unnecessary complexity.
            </p>

            <p>
              This app is intended as a companion for learning and reflection, not as a replacement
              for scholarly guidance.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

