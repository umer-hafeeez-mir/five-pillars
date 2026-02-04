export default function HelpPage() {
  return (
    <main className="min-h-screen bg-[#F7F9F8]">
      <div className="container-page py-10">
        <div className="max-w-2xl mx-auto rounded-2xl border border-slate-200 bg-white p-6 soft-shadow">
          <h1 className="text-2xl font-semibold text-slate-900">Help</h1>
          <p className="mt-2 text-sm text-slate-600">
            A quick guide to using the Five Pillars app and understanding how calculations work.
          </p>

          <div className="mt-6 space-y-8 text-sm text-slate-700 leading-relaxed">
            <section>
              <h2 className="text-base font-semibold text-slate-900">Getting started</h2>
              <ul className="mt-2 list-disc pl-5 space-y-2">
                <li>Use the homepage to explore the Five Pillars.</li>
                <li>Select a pillar to learn more or use its tools.</li>
                <li>Your progress is saved automatically on your device.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900">Using the Zakat calculator</h2>
              <p className="mt-2">
                The Zakat calculator estimates whether Zakat is due and how much to pay, based on
                the information you provide.
              </p>

              <p className="mt-3">
                <b>Net zakatable wealth</b> is calculated as:
              </p>

              <p className="mt-2 text-slate-800">
                (Cash + Bank + Gold + Silver + Investments + Business assets + Money lent) − Debts
              </p>

              <p className="mt-3">
                When your net wealth meets or exceeds the Nisab threshold, Zakat is calculated at
                <b> 2.5%</b>.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900">Nisab threshold</h2>
              <p className="mt-2">
                Nisab is the minimum amount of wealth required for Zakat to be due. You can choose
                between:
              </p>
              <ul className="mt-2 list-disc pl-5 space-y-2">
                <li>Silver basis (612.36g × silver rate)</li>
                <li>Gold basis (87.48g × gold rate)</li>
              </ul>
              <p className="mt-2">
                If a required rate is missing, the app will ask you to add it before confirming
                eligibility.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900">Privacy & data</h2>
              <p className="mt-2">
                All data is stored locally on your device. The app does not create accounts, track
                usage, or send data anywhere.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900">Disclaimer</h2>
              <p className="mt-2">
                This app provides educational estimates. For complex financial situations, consult
                a qualified scholar.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

