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
          ? "border-teal-300 ring-1 ring-teal-200 bg-gradient-to-b from-teal-50/80 to-white shadow-[0_18px_45px_rgba(20,184,166,0.14)]"
          : "border-slate-200 soft-shadow"
      ].join(" ")}
    >
      {/* Left accent bar */}
      {isResult && (
        <div className="absolute left-0 top-0 h-full w-1 rounded-l-2xl bg-gradient-to-b from-teal-500 to-cyan-500" />
      )}

      <div
        className={[
          "text-[11px] tracking-widest font-semibold",
          isResult ? "text-teal-900" : "text-slate-400"
        ].join(" ")}
      >
        {title}
      </div>

      <div className="mt-4">{children}</div>
    </div>
  );
}
