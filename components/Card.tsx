
export default function Card({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-md mx-auto rounded-2xl border border-slate-200 bg-white p-5 soft-shadow">
      <div className="text-[11px] tracking-widest text-slate-400 font-semibold">{title}</div>
      <div className="mt-4">{children}</div>
    </div>
  );
}
