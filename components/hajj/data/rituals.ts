// components/hajj/data/rituals.ts
export type RitualDay = {
  id: number;
  short: string; // short day label e.g., "Day 8"
  title: string; // full title e.g., "Day 8 – Mina"
  subtitle?: string; // e.g., "Yawm at-Tarwiyah"
  summary: string;
  todo: string[]; // what to do today (ordered)
  focus: string[]; // focus points
  reminders?: string[]; // helpful reminders
  next?: string; // what's coming next
  night?: {
    title: string;
    summary?: string;
    todo?: string[];
    reminder?: string;
  } | null;
};

export const RITUALS_DAYS: RitualDay[] = [
  {
    id: 8,
    short: "Day 8",
    title: "Day 8 – Mina",
    subtitle: "Yawm at-Tarwiyah",
    summary:
      "Today marks the beginning of the core Hajj journey. Pilgrims enter the state of Ihram and travel to Mina to prepare spiritually and mentally for the Day of Arafat.",
    todo: [
      "Enter the state of Ihram (if you haven’t already)",
      "Make your intention (niyyah) for Hajj",
      "Travel to Mina",
      "Pray Dhuhr, Asr, Maghrib, Isha, and Fajr in Mina (shortened, but not combined)"
    ],
    focus: [
      "Begin reciting the Talbiyah frequently",
      "Stay patient and calm as crowds increase",
      "Avoid arguments, complaints, or distractions"
    ],
    reminders: [
      "This is a preparation day—don’t rush",
      "Rest when you can",
      "Keep your belongings light and secure"
    ],
    next: "Tomorrow is the Day of Arafat, the most important day of Hajj.",
    night: null
  },

  {
    id: 9,
    short: "Day 9",
    title: "Day 9 – Arafat",
    subtitle: "Yawm al-Arafah",
    summary:
      "This is the most important day of Hajj. Standing in Arafat is the heart of the pilgrimage. Hajj is invalid without it.",
    todo: [
      "After Fajr, travel from Mina to Arafat",
      "Remain in Arafat from Dhuhr until sunset",
      "Pray Dhuhr and Asr together (shortened)",
      "Spend the day in dua, repentance, and remembrance"
    ],
    focus: [
      "Make sincere, personal duas",
      "Ask forgiveness and mercy",
      "Speak from the heart—this is a rare moment"
    ],
    reminders: [
      "You do not need to be on the Mount of Mercy",
      "Standing anywhere within Arafat is valid",
      "Do not leave Arafat before sunset"
    ],
    next: "After sunset travel calmly to Muzdalifah and spend the night there.",
    night: {
      title: "Night — Muzdalifah",
      summary:
        "Spend the night in Muzdalifah under the open sky. Rest, collect pebbles for Rami, and pray Fajr.",
      todo: [
        "Pray Maghrib and Isha together (shortened)",
        "Rest and sleep",
        "Collect 49 or 70 pebbles for Rami (if possible)",
        "Pray Fajr and make brief dua"
      ],
      reminder: "Even a short stay fulfills the requirement — prioritize safety and follow group guidance."
    }
  },

  {
    id: 10,
    short: "Day 10",
    title: "Day 10 – Mina",
    subtitle: "Yawm an-Nahr (Day of Sacrifice)",
    summary:
      "This is a busy and blessed day. Several major rituals are completed today.",
    todo: [
      "Return to Mina",
      "Perform Rami – stone Jamrat al-Aqabah",
      "Offer your sacrifice (Qurbani)",
      "Shave or trim hair (Tahallul)",
      "Travel to Makkah to perform Tawaf al-Ifadah",
      "Perform Sa’i (if required)",
      "Return to Mina"
    ],
    focus: [
      "Move patiently—this is a long day",
      "Follow your group’s guidance",
      "Don’t panic if rituals take time"
    ],
    reminders: [
      "Order flexibility exists if needed",
      "Once hair is cut, most Ihram restrictions are lifted"
    ],
    next: "The Days of Tashreeq begin, with continued stay in Mina.",
    night: null
  },

  {
    id: 11,
    short: "Day 11",
    title: "Day 11 – Mina",
    subtitle: "First Day of Tashreeq",
    summary: "The focus today is continued remembrance and the stoning of the Jamarat.",
    todo: [
      "Remain in Mina",
      "Perform Rami on all three Jamarat: Small (Ula), Medium (Wusta), Large (Aqabah)",
      "Make dua after the first two Jamarat"
    ],
    focus: [
      "Maintain remembrance of Allah",
      "Support fellow pilgrims",
      "Stay hydrated and rest"
    ],
    reminders: ["Rami can be done anytime after Dhuhr", "Follow crowd control instructions strictly"],
    next: "Continue stoning the Jamarat; continue remembrance and rest.",
    night: null
  },

  {
    id: 12,
    short: "Day 12",
    title: "Day 12 – Mina",
    subtitle: "Second Day of Tashreeq",
    summary: "Today mirrors Day 11, with an option to leave Mina early.",
    todo: [
      "Perform Rami on all three Jamarat",
      "Decide whether to leave Mina before sunset (early departure) or stay one more night"
    ],
    focus: ["Complete rituals calmly", "Reflect on your journey so far"],
    reminders: ["Leaving early is valid", "Staying is equally rewarded"],
    next: "If you stay, one final day of Rami remains.",
    night: null
  },

  {
    id: 13,
    short: "Day 13",
    title: "Day 13 – Mina",
    subtitle: "Final Day of Tashreeq (Optional)",
    summary:
      "This is the final day for those who chose to stay an extra night.",
    todo: [
      "Perform Rami on all three Jamarat",
      "Prepare to depart Mina",
      "After Mina, return to Makkah and perform Tawaf al-Wada (Farewell Tawaf) before leaving"
    ],
    focus: ["Complete rituals calmly", "Prepare to depart with humility"],
    reminders: ["Hajj concludes with humility and gratitude", "Carry its lessons back into daily life"],
    next: "Hajj ends — plan your return and continue reflection.",
    night: null
  }
];

export const RITUALS_COMING_NEXT = [
  "Types of Hajj (Tamattu’, Qiran, Ifrad)",
  "What is Fard vs Wajib vs Sunnah (optional)",
  "Common mistakes to avoid",
  "“I’m here now — what should I do?” quick actions"
];
