import { Stack, router } from "expo-router";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import * as SplashScreen from "expo-splash-screen";
import * as Linking from "expo-linking";
import { useEffect, useState } from "react";
import { LogBox, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { LoadingScreen } from "@/src/components/LoadingScreen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import { useAppFonts } from "@/src/hooks/use-app-fonts";
import { AppStateProvider, useAppState } from "@/src/game/AppState";
import { StarlitesProvider, useStarlites } from "@/src/game/starlites";
import { colors, fonts, neonGlow } from "@/src/game/theme";
import { NeonBackground } from "@/src/components/ui";


// Disable logbox errors etc so that users can see the app
// and agent works as expected.
LogBox.ignoreAllLogs(true)

// Keep the native splash visible from cold start until icon fonts register.
// Required because @expo/vector-icons' componentDidMount fallback fires
// Font.loadAsync against a broken vendor path if any <Icon> mounts before
// the family is registered - which throws on Android Expo Go.
SplashScreen.preventAutoHideAsync();

// Kill all text selection, image dragging, callouts and tap highlights on web at
// RUNTIME. The dev preview (Metro) does NOT apply app/+html.tsx, so injecting here
// is the only thing that actually reaches the running app.
function useNoWebSelection() {
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    const style = document.createElement("style");
    style.setAttribute("data-vocotap-noselect", "1");
    style.innerHTML = `
      html, body, #root, #root * , *::before, *::after {
        -webkit-user-select: none !important; -moz-user-select: none !important;
        -ms-user-select: none !important; user-select: none !important;
        -webkit-touch-callout: none !important; -webkit-tap-highlight-color: rgba(0,0,0,0) !important;
        -webkit-user-drag: none !important; user-drag: none !important;
      }
      img { -webkit-user-drag: none !important; user-drag: none !important; pointer-events: none !important; }
      input, textarea, [contenteditable="true"] { -webkit-user-select: text !important; user-select: text !important; }
    `;
    document.head.appendChild(style);
    const allowText = (t: any) => t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
    const onSelect = (e: any) => { if (!allowText(e.target)) e.preventDefault(); };
    const onDrag = (e: any) => e.preventDefault();
    const onContext = (e: any) => e.preventDefault();
    document.addEventListener("selectstart", onSelect, true);
    document.addEventListener("dragstart", onDrag, true);
    document.addEventListener("contextmenu", onContext, true);
    return () => {
      document.removeEventListener("selectstart", onSelect, true);
      document.removeEventListener("dragstart", onDrag, true);
      document.removeEventListener("contextmenu", onContext, true);
      style.remove();
    };
  }, []);
}

export default function RootLayout() {
  const [loaded, error] = useIconFonts();
  const [textLoaded, textError] = useAppFonts();
  useNoWebSelection();

  useEffect(() => {
    if ((loaded || error) && (textLoaded || textError)) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error, textLoaded, textError]);

  // If the CDN is unreachable we fall through on error rather than wedging
  // the app - icons/fonts will fall back, but the app still boots.
  if ((!loaded && !error) || (!textLoaded && !textError)) return null;

  return <GestureHandlerRootView style={{ flex: 1 }}><SafeAreaProvider><StarlitesProvider><AppStateProvider><StatusBar style="light" /><ThemeProvider value={NAV_THEME}><AppStack /></ThemeProvider></AppStateProvider></StarlitesProvider></SafeAreaProvider></GestureHandlerRootView>;
}

const NAV_THEME = { ...DarkTheme, colors: { ...DarkTheme.colors, background: "transparent", card: "transparent" } };

function AppStack() {
  const { toast, dismissToast } = useStarlites();
  const { ready, importChartFromCode } = useAppState();
  const [booting, setBooting] = useState(true);

  // Deep-link chart import: opening a shared vocotap:// link (or any URL carrying a VOCO1- code)
  // imports the chart and drops the player into the Customs library.
  useEffect(() => {
    if (!ready) return;
    let done = false;
    const handle = async (url: string | null) => {
      if (!url || done || !url.includes("VOCO1-")) return;
      done = true;
      try { const chart = await importChartFromCode(url); if (chart) router.push("/library"); } catch {}
    };
    Linking.getInitialURL().then(handle).catch(() => {});
    const sub = Linking.addEventListener("url", e => { done = false; handle(e.url); });
    return () => sub.remove();
  }, [ready, importChartFromCode]);

  return <View style={styles.root}>
    <NeonBackground />
    <Stack screenOptions={{ headerShown: false, animation: "fade", contentStyle: { backgroundColor: "transparent" } }} />
    {toast && <Pressable testID="starlites-toast" onPress={dismissToast} style={styles.toast}>
      <Text style={styles.toastAmount}>+{toast.amount} Starlites</Text><Text style={styles.toastReason}>{toast.reason}</Text>
    </Pressable>}
    {booting && <LoadingScreen onFinish={() => setBooting(false)} />}
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  toast: { position: "absolute", top: 58, alignSelf: "center", width: "86%", maxWidth: 420, paddingVertical: 13, paddingHorizontal: 18, borderRadius: 14, backgroundColor: "rgba(14,11,38,0.97)", borderWidth: 1.5, borderColor: colors.gold, ...neonGlow(colors.gold, 14, 0.5) },
  toastAmount: { color: colors.gold, fontFamily: fonts.arcadeBlack, fontSize: 15, textAlign: "center", letterSpacing: 1 }, toastReason: { color: colors.text, fontSize: 12, marginTop: 2, textAlign: "center" },
});
