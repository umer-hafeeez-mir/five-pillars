export default function Card({
  title,
  children,
  variant = "default"
}: {
  title: string;
  children: React.ReactNode;
  variant?: "default" | "highlight";
}) {
  const base =
    "max-w-md mx-auto rounded-2xl border bg-white p-5 soft-shadow";

  const styles =
    variant === "highlight"
      ? "border-brand-200 bg-brand-50"
      : "border-slate-200";

  const titleStyles =
    variant === "highlight"
      ? "text-brand-900"
      : "text-slate-400";

  return (
    <div className={[base, styles].join(" ")}>
      <div
        className={[
          "text-[11px] tracking-widest font-semibold",
          titleStyles
        ].join(" ")}
      >
        {title}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}
