export default function Card({
  title,
  children,
  variant = "default"
}: {
  title: string;
  children: React.ReactNode;
  variant?: "default" | "result";
}) {
  const isResult = variant === "result";

  return (
    <div
      className={[
        "relative max-w-md mx-auto rounded-2xl border bg-white p-5",
        isResult
          ? "border-brand-300 ring-1 ring-brand-200 bg-gradient-to-b from-brand-100/60 to-white shadow-[0_18px_45px_rgba(2,6,23,0.14)]"
          : "border-slate-200 soft-shadow"
      ].join(" ")}
    >
      {/* Left accent bar */}
      {isResult && (
        <div className="absolute left-0 top-0 h-full w-1 rounded-l-2xl bg-brand-700" />
      )}

      <div
        className={[
          "text-[11px] tracking-widest font-semibold",
          isResult ? "text-brand-900" : "text-slate-400"
        ].join(" ")}
      >
        {title}
      </div>

      <div className="mt-4">{children}</div>
    </div>
  );
}
