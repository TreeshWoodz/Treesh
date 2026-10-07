import { createContext, useContext } from "react";

export const SKINS = [
  { id: "classic", name: "Classic", level: 1, desc: "The original Sonoko deck." },
  { id: "neon", name: "Neon Night", level: 3, desc: "Glowing outlines on midnight cards." },
  { id: "retro", name: "Retro Arcade", level: 5, desc: "Chunky borders and hard 8-bit shadows." },
  { id: "gold", name: "Gilded", level: 8, desc: "Gold-trimmed premium cards." },
  { id: "treesh", name: "Treesh Leaf", level: 12, desc: "The studio's own forest deck." },
];

export const THEMES = [
  { id: "arcade", name: "Arcade", level: 1, desc: "Dark grid with neon glow." },
  { id: "midnight", name: "Midnight", level: 2, desc: "Starry deep-blue sky." },
  { id: "sunset", name: "Sunset Strip", level: 4, desc: "Warm dusk over the boardwalk." },
  { id: "forest", name: "Forest Floor", level: 6, desc: "Treesh green canopy." },
  { id: "ocean", name: "Deep Ocean", level: 9, desc: "Bioluminescent depths." },
];

export const SkinContext = createContext("classic");
export const useSkin = () => useContext(SkinContext);
