// components/hajj/data/now.ts

export type NowLocation = "Mina" | "Arafat" | "Muzdalifah" | "Haram";

export const NOW_LOCATIONS: NowLocation[] = [
  "Mina",
  "Arafat",
  "Muzdalifah",
  "Haram"
];

export type NowGuide = {
  title: string;
  summary?: string;
  steps: string[];
  focus: string[];
  reminders: string[];
};

export const NOW_GUIDES: Record<NowLocation, NowGuide> = {
  Mina: {
    title: "Mina — What to do right now",
    summary:
      "If you’re in Mina, focus on staying organized, praying on time, and preparing for the next movement.",
    steps: [
      "Confirm your tent and group location",
      "Pray on time (shortened, not combined unless instructed)",
      "Keep water and essentials accessible",
      "Rest when possible"
    ],
    focus: [
      "Recite Talbiyah frequently",
      "Stay patient and calm",
      "Avoid arguments and distractions"
    ],
    reminders: [
      "Keep belongings light and secure",
      "Follow your group schedule",
      "Stay hydrated"
    ]
  },

  Arafat: {
    title: "Arafat — What to do right now",
    summary:
      "This is the heart of Hajj. Standing in Arafat is mandatory for a valid Hajj.",
    steps: [
      "Remain within the boundaries of Arafat",
      "Pray Dhuhr and Asr (combined/shortened per guidance)",
      "Spend time in dua and remembrance",
      "Avoid unnecessary movement"
    ],
    focus: [
      "Make sincere personal duas",
      "Seek forgiveness and mercy",
      "Stay present and focused"
    ],
    reminders: [
      "You do NOT need to be on Jabal al-Rahmah",
      "Do not leave before sunset",
      "Protect yourself from heat"
    ]
  },

  Muzdalifah: {
    title: "Muzdalifah — What to do right now",
    summary:
      "After sunset, rest here briefly and prepare for the next day’s rituals.",
    steps: [
      "Pray Maghrib and Isha together",
      "Rest or sleep if possible",
      "Collect pebbles if safe",
      "Pray Fajr and make brief dua"
    ],
    focus: [
      "Prioritize safety",
      "Follow group guidance",
      "Conserve energy"
    ],
    reminders: [
      "Even a short stay is sufficient",
      "Avoid risky areas",
      "Keep warm at night"
    ]
  },

  Haram: {
    title: "Masjid al-Haram — What to do right now",
    summary:
      "Move calmly and stay focused on your rituals.",
    steps: [
      "Choose less crowded routes",
      "Keep your group meeting point in mind",
      "If doing Tawaf, avoid pushing",
      "If doing Sa’i, pace yourself"
    ],
    focus: [
      "Maintain khushu’ (presence)",
      "Be gentle with others",
      "Avoid distractions"
    ],
    reminders: [
      "Use upper levels if ground floor is crowded",
      "Keep phone charged",
      "Carry water"
    ]
  }
};
