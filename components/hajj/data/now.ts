// components/hajj/data/now.ts

export const NOW_LOCATIONS = ["Mina", "Arafat", "Muzdalifah", "Haram"] as const;
export type NowLocation = (typeof NOW_LOCATIONS)[number];

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
      "Confirm your group/tent location and keep your ID band on",
      "Pray on time (shorten prayers if applicable, but do not combine unless guided for your situation)",
      "Keep water + essentials accessible",
      "Rest when possible (crowds get heavy later)"
    ],
    focus: ["Recite Talbiyah frequently", "Stay patient and calm", "Avoid arguments and distractions"],
    reminders: ["Keep your belongings light and secure", "Follow your group schedule", "Hydrate regularly"]
  },

  Arafat: {
    title: "Arafat — What to do right now",
    summary:
      "This is the heart of Hajj. Use the time for du’a, repentance, and remembrance until sunset.",
    steps: [
      "Stay within the boundaries of Arafat (you do not need to be on the mount)",
      "Pray Dhuhr and Asr (often combined/shortened — follow your group/scholar guidance)",
      "Spend time in du’a and dhikr",
      "Avoid wandering unnecessarily; conserve energy"
    ],
    focus: ["Make sincere personal du’as", "Ask forgiveness and mercy", "Speak from the heart"],
    reminders: ["Do not leave Arafat before sunset", "Stay hydrated and use shade", "Keep calm in crowds"]
  },

  Muzdalifah: {
    title: "Muzdalifah — What to do right now",
    summary:
      "After sunset, you’ll rest here briefly, pray Maghrib & Isha together, and prepare pebbles for Rami.",
    steps: [
      "Pray Maghrib and Isha together (often shortened — follow guidance)",
      "Collect 49 or 70 pebbles for Rami",
      "Rest/sleep if possible",
      "Pray Fajr, then make du’a briefly"
    ],
    focus: ["Prioritize safety", "Follow your group leader", "Keep your essentials with you"],
    reminders: ["Even a short stay can fulfill the requirement", "Avoid risky areas", "Keep warm at night"]
  },

  Haram: {
    title: "Masjid al-Haram — What to do right now",
    summary:
      "If you’re at the Haram, move calmly, keep your group in view, and plan your Tawaf/Sa’i timing.",
    steps: [
      "Choose a less crowded entry/route if possible",
      "Keep your group meeting point in mind",
      "If doing Tawaf: pace yourself and avoid pushing",
      "If doing Sa’i: keep steady pace, take breaks as needed"
    ],
    focus: ["Maintain khushu’ (presence)", "Avoid distractions", "Be gentle with others"],
    reminders: ["Use upper levels if ground is too crowded", "Keep phone charged", "Carry water"]
  }
};
