"use client";

import { useState } from "react";

export default function Accordion({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="max-w-md mx-auto rounded-2xl border border-slate-200 bg-white soft-shadow overflow-hidden">
      <button
        onClick={() => setOpen((s) => !s)}
        className="w-full flex items-center justify-between px-5 py-4 text-sm text-slate-700"
      >
        <span>{title}</span>
        <span className="text-slate-400">{open ? "▴" : "▾"}</span>
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

