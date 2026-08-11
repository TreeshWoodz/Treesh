import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { LogBox, Pressable, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import { useAppFonts } from "@/src/hooks/use-app-fonts";
import { AppStateProvider } from "@/src/game/AppState";
import { StarlitesProvider, useStarlites } from "@/src/game/starlites";
import { colors } from "@/src/game/theme";


// Disable logbox errors etc so that users can see the app
// and agent works as expected.
LogBox.ignoreAllLogs(true)

// Keep the native splash visible from cold start until icon fonts register.
// Required because @expo/vector-icons' componentDidMount fallback fires
// Font.loadAsync against a broken vendor path if any <Icon> mounts before
// the family is registered - which throws on Android Expo Go.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useIconFonts();
  const [textLoaded, textError] = useAppFonts();

  useEffect(() => {
    if ((loaded || error) && (textLoaded || textError)) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error, textLoaded, textError]);

  // If the CDN is unreachable we fall through on error rather than wedging
  // the app - icons/fonts will fall back, but the app still boots.
  if ((!loaded && !error) || (!textLoaded && !textError)) return null;

  return <SafeAreaProvider><StarlitesProvider><AppStateProvider><StatusBar style="light" /><AppStack /></AppStateProvider></StarlitesProvider></SafeAreaProvider>;
}

function AppStack() {
  const { toast, dismissToast } = useStarlites();
  return <View style={styles.root}>
    <Stack screenOptions={{ headerShown: false, animation: "fade", contentStyle: { backgroundColor: colors.bg } }} />
    {toast && <Pressable testID="starlites-toast" onPress={dismissToast} style={styles.toast}>
      <Text style={styles.toastAmount}>+{toast.amount} Starlites</Text><Text style={styles.toastReason}>{toast.reason}</Text>
    </Pressable>}
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  toast: { position: "absolute", top: 58, alignSelf: "center", width: "86%", maxWidth: 420, paddingVertical: 13, paddingHorizontal: 18, borderRadius: 18, backgroundColor: "#251F10", borderWidth: 1, borderColor: "rgba(147,40,255,0.45)" },
  toastAmount: { color: colors.gold, fontWeight: "900", fontSize: 15, textAlign: "center" }, toastReason: { color: colors.text, fontSize: 12, marginTop: 2, textAlign: "center" },
});
