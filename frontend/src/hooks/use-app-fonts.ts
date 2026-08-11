// Loads the parent Treesh app's brand fonts (Manrope body + Special Gothic Expanded One display)
// from the Fontsource CDN, matching the parent app's typography. Falls back to system on error.
import { useFonts } from "expo-font";

const base = "https://cdn.jsdelivr.net/fontsource/fonts";

export const useAppFonts = (): readonly [boolean, Error | null] =>
  useFonts({
    "Manrope": `${base}/manrope@latest/latin-400-normal.ttf`,
    "Manrope-Bold": `${base}/manrope@latest/latin-700-normal.ttf`,
    "Manrope-Heavy": `${base}/manrope@latest/latin-800-normal.ttf`,
    "Display": `${base}/special-gothic-expanded-one@latest/latin-400-normal.ttf`,
  });
