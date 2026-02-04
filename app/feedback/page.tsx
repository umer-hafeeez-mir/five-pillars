export default function FeedbackPage() {
  return (
    <main className="min-h-screen bg-[#F7F9F8]">
      <div className="container-page py-10">
        <div className="max-w-2xl mx-auto rounded-2xl border border-slate-200 bg-white p-6 soft-shadow">
          <h1 className="text-2xl font-semibold text-slate-900">Feedback</h1>

          <div className="mt-4 space-y-4 text-sm text-slate-700 leading-relaxed">
            <p>
              Feedback helps improve the app and ensure it stays useful and accurate.
            </p>

            <p>
              You can share:
            </p>

            <ul className="list-disc pl-5 space-y-2">
              <li>Bug reports</li>
              <li>Copy or clarity suggestions</li>
              <li>Feature ideas</li>
            </ul>

            <p>
              You can later connect this page to an email address or feedback form.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

