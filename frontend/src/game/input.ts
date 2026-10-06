import { Platform } from "react-native";

// True on phones/tablets and on touchscreen laptops/desktops. False on mouse + keyboard-only computers,
// where flick and wavy notes can't be played the way they were designed.
export function hasTouchScreen(): boolean {
  if (Platform.OS !== "web" || typeof window === "undefined") return true;
  const nav: any = typeof navigator !== "undefined" ? navigator : {};
  return (nav.maxTouchPoints ?? 0) > 0 || "ontouchstart" in window || !!window.matchMedia?.("(pointer: coarse)").matches;
}
