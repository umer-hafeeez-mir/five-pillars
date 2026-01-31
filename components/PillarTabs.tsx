return (
  <nav className="border-b border-slate-200">
    <ul className="flex justify-center gap-6 sm:gap-10">
      {PILLARS_ORDER.map((k) => {
        const isActive = k === active;
        const p = PILLARS[k];

        return (
          <li key={k} className="relative">
            <button
              onClick={() => onChange(k)}
              className={[
                "group pb-3 transition-all",
                "text-center",
                isActive
                  ? "text-brand-900 font-semibold scale-105"
                  : "text-slate-500 hover:text-slate-700"
              ].join(" ")}
            >
              <div className="text-sm">{p.tab}</div>
              <div className="text-[11px] mt-0.5 opacity-80">
                {p.tabHint}
              </div>

              {/* underline */}
              <span
                className={[
                  "absolute left-0 -bottom-[1px] h-[3px] rounded-full transition-all",
                  isActive
                    ? "w-full bg-brand-800 shadow-[0_0_8px_rgba(24,90,56,0.35)]"
                    : "w-0 bg-transparent group-hover:w-full group-hover:bg-slate-300"
                ].join(" ")}
              />
            </button>
          </li>
        );
      })}
    </ul>
  </nav>
);
