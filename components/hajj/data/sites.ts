// components/hajj/data/sites.ts
export type LatLng = { lat: number; lng: number };

export type HajjSite = {
  id: "haram" | "mina" | "arafat" | "muzdalifah" | "jamarat";
  title: string;
  hint: string;
  coords: LatLng;
};

export const HAJJ_SITES: HajjSite[] = [
  {
    id: "haram",
    title: "Haram (Masjid al-Haram)",
    hint: "Makkah — Tawaf / Sa’i / Umrah",
    coords: { lat: 21.42249, lng: 39.82619 }
  },
  {
    id: "mina",
    title: "Mina",
    hint: "Camps — Days 8, 10–13",
    coords: { lat: 21.41333, lng: 39.89383 }
  },
  {
    id: "arafat",
    title: "Arafat",
    hint: "Day 9 — Standing at Arafah",
    coords: { lat: 21.355, lng: 39.98444 }
  },
  {
    id: "muzdalifah",
    title: "Muzdalifah",
    hint: "Night of Day 9 — Pebbles / rest",
    coords: { lat: 21.3925, lng: 39.95111 }
  },
  {
    id: "jamarat",
    title: "Jamarat",
    hint: "Rami — stoning",
    coords: { lat: 21.41917, lng: 39.87472 }
  }
];

