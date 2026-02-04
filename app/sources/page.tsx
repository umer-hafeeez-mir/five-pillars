export default function SourcesPage() {
  return (
    <main className="min-h-screen bg-[#F7F9F8]">
      <div className="container-page py-10">
        <div className="max-w-2xl mx-auto rounded-2xl border border-slate-200 bg-white p-6 soft-shadow">
          <h1 className="text-2xl font-semibold text-slate-900">
            Sources & methodology
          </h1>

          <div className="mt-4 space-y-4 text-sm text-slate-700 leading-relaxed">
            <p>
              Zakat calculations in this app follow widely accepted principles from classical
              Islamic jurisprudence.
            </p>

            <p>
              <b>Nisab values:</b>
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Gold: 87.48 grams</li>
              <li>Silver: 612.36 grams</li>
            </ul>

            <p>
              Net zakatable wealth includes liquid assets, precious metals, investments, business
              assets, and money owed to you, minus short-term debts.
            </p>

            <p>
              Zakat is calculated at a rate of <b>2.5%</b> when net wealth meets or exceeds Nisab.
            </p>

            <p>
              Differences of scholarly opinion exist. This app aims to be broadly compatible and
              transparent rather than prescriptive.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

