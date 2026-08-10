import { Song } from "./types";

// Public metadata visible at treesh.app/content/songs. Audio remains on Treesh.
export const TREESH_CATALOG: Song[] = [
  ["bankrupt", "Bankrupt (Freestyle)", "Black Barbie", "#0DE6D2"],
  ["rippin", "Rippin' and Runnin'", "PerfekTenz", "#CCFF00"],
  ["pink-sides", "PINK SIDES", "Unique Carter", "#FF5E00"],
  ["shake-it", "Shake It Some Mo", "Chelly Banqz", "#FF0055"],
  ["never-rock", "NEVER (Rock Version)", "SAVIONCE", "#9B5CFF"],
  ["prettywise", "PRETTYWISE", "Chelly Banqz", "#0DE6D2"],
  ["heart-hood", "Heart of the Hood", "London Llaflare", "#FF5E00"],
  ["pink-feds", "PINK FEDS", "Unique Carter", "#FF0055"],
  ["traphouse", "Traphouse", "Unique Carter x Lil Quan x Chino", "#CCFF00"],
  ["monster", "MONSTER", "Chelly Banqz", "#9B5CFF"],
  ["happy-home", "Happy At Home", "Palo", "#0DE6D2"],
  ["seasons", "Seasons", "GHumble x London Llaflare", "#FF5E00"],
].map(([id, title, artist, accent]) => ({ id, title, artist, accent, source: "treesh" } as Song));

export const TREESH_URL = "https://treesh.app/content/songs";
