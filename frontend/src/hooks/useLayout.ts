import { useWindowDimensions } from "react-native";

export const DESKTOP_MIN = 960;

// Responsive breakpoint shared by every screen: desktop = wide web/tablet windows.
export function useLayout() {
  const { width, height } = useWindowDimensions();
  return { width, height, desktop: width >= DESKTOP_MIN };
}
