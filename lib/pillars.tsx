export const PILLARS = { ... }

import React from "react";
import HajjHome from "@/components/hajj/HajjHome";

export type PillarKey = "shahada" | "salah" | "zakat" | "sawm" | "hajj";

export const PILLARS_ORDER: PillarKey[] = ["shahada", "salah", "zakat", "sawm", "hajj"];

export const PILLARS: Record<
  PillarKey,
  {
    tab: string;
    tabHint: string;
    icon: string;
    title: string;
    subtitle: string;
    blocks: { title: string; content: React.ReactNode }[];
  }
> = {
  shahada: {
    tab: "Shahada",
    tabHint: "Faith",
    icon: "heart",
    title: "Shahada",
    subtitle: "Declaration of Faith",
    blocks: [
      {
        title: "DECLARATION",
        content: (
          <div className="text-center space-y-3">
            <div className="text-2xl leading-relaxed" dir="rtl">
              أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ اللهِ
            </div>
            <div className="text-sm text-slate-600 italic">
              “I bear witness that there is no deity but Allah, and I bear witness that Muhammad is the Messenger of Allah.”
            </div>
          </div>
        )
      },
      {
        title: "THE FIRST PILLAR",
        content: (
          <p className="text-sm text-slate-600 leading-relaxed">
            The Shahada is the foundational declaration of Islamic faith. It affirms the oneness of Allah and the
            prophethood of Muhammad (peace be upon him).
          </p>
        )
      },
      {
        title: "SIGNIFICANCE",
        content: (
          <p className="text-sm text-slate-600 leading-relaxed">
            Reciting the Shahada sincerely with understanding and conviction is the first step to entering Islam. It is
            also reaffirmed in daily worship.
          </p>
        )
      }
    ]
  },

  salah: {
    tab: "Salah",
    tabHint: "Prayer",
    icon: "clock",
    title: "Salah",
    subtitle: "The Five Daily Prayers",
    blocks: [
      {
        title: "DAILY PRAYERS",
        content: (
          <div className="divide-y divide-slate-200">
            {[
              ["Fajr", "Before sunrise", "Dawn"],
              ["Dhuhr", "After the sun passes its zenith", "Midday"],
              ["Asr", "Late afternoon", "Afternoon"],
              ["Maghrib", "Just after sunset", "Sunset"],
              ["Isha", "After twilight disappears", "Night"]
            ].map(([name, desc, tag]) => (
              <div key={name} className="py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{name}</div>
                  <div className="text-xs text-slate-500">{desc}</div>
                </div>
                <div className="text-xs font-medium text-brand-800">{tag}</div>
              </div>
            ))}
          </div>
        )
      },
      {
        title: "THE SECOND PILLAR",
        content: (
          <p className="text-sm text-slate-600 leading-relaxed">
            Salah is performed five times daily. It connects the worshipper directly with Allah through recitation,
            bowing, and prostration.
          </p>
        )
      },
      {
        title: "PREPARATION",
        content: (
          <p className="text-sm text-slate-600 leading-relaxed">
            Before prayer, Muslims perform wudu (ablution) and pray facing the Qibla (direction of the Kaaba).
          </p>
        )
      }
    ]
  },

  zakat: {
    tab: "Zakat",
    tabHint: "Charity",
    icon: "crescent",
    title: "Calculate Zakat",
    subtitle: "Purification of Wealth",
    blocks: [{ title: "INFO", content: null }]
  },

  sawm: {
    tab: "Sawm",
    tabHint: "Fasting",
    icon: "moon",
    title: "Sawm",
    subtitle: "Fasting During Ramadan",
    blocks: [
      {
        title: "FASTING SCHEDULE",
        content: (
          <div className="divide-y divide-slate-200">
            {[
              ["Suhoor", "Pre-dawn meal", "Before Fajr"],
              ["Fasting Period", "Abstain from food, drink, and other needs", "Dawn to Sunset"],
              ["Iftar", "Breaking the fast", "At Maghrib"]
            ].map(([name, desc, tag]) => (
              <div key={name} className="py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{name}</div>
                  <div className="text-xs text-slate-500">{desc}</div>
                </div>
                <div className="text-xs font-medium text-brand-800">{tag}</div>
              </div>
            ))}
          </div>
        )
      },
      {
        title: "THE FOURTH PILLAR",
        content: (
          <p className="text-sm text-slate-600 leading-relaxed">
            During Ramadan, Muslims fast from dawn until sunset. Fasting teaches self-discipline, empathy, and gratitude.
          </p>
        )
      },
      {
        title: "EXEMPTIONS",
        content: (
          <p className="text-sm text-slate-600 leading-relaxed">
            Those who are ill, traveling, elderly, pregnant, breastfeeding, or menstruating may be exempt. Missed fasts
            can be made up later or compensated through fidya, depending on circumstances.
          </p>
        )
      }
    ]
  },

  hajj: {
    tab: "Hajj",
    tabHint: "Pilgrimage",
    icon: "pin",
    title: "Hajj",
    subtitle: "Pilgrimage to Mecca",
    blocks: [
      {
        title: "HAJJ GUIDE",
        content: <HajjHome />
      }
    ]
  }
};
