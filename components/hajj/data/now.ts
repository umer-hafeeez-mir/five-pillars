
// components/hajj/data/now.ts

export const NOW_LOCATIONS = ["Mina", "Arafat", "Muzdalifah", "Haram"] as const;
export type NowLocation = (typeof NOW_LOCATIONS)[number];
