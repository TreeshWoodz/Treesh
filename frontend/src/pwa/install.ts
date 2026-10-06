import Constants from "expo-constants";
import { useEffect, useReducer } from "react";
import { Platform } from "react-native";

// "Install as app" (PWA) support for the web build: head tags, install prompt capture, platform detection.
export type InstallMode = "prompt" | "ios" | "mac-safari" | "firefox" | "browser-menu";

const web = Platform.OS === "web" && typeof window !== "undefined";
// Static files in /public are served from the app's base URL in production builds (root in dev).
export const BASE_PATH = __DEV__ ? "" : String((Constants.expoConfig as any)?.experiments?.baseUrl || "").replace(/\/$/, "");

let deferred: any = null;
let inited = false;
const subs = new Set<() => void>();
const notify = () => subs.forEach(f => f());

function addHead(tag: "meta" | "link", attrs: Record<string, string>) {
  const key = tag === "meta" ? `meta[name="${attrs.name}"]` : `link[rel="${attrs.rel}"]`;
  if (document.head.querySelector(key)) return;
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  document.head.appendChild(el);
}

export function initPwa() {
  if (!web || inited) return; inited = true;
  addHead("link", { rel: "manifest", href: `${BASE_PATH}/manifest.json` });
  addHead("link", { rel: "apple-touch-icon", href: `${BASE_PATH}/icons/apple-touch-icon.png` });
  addHead("meta", { name: "apple-mobile-web-app-capable", content: "yes" });
  addHead("meta", { name: "mobile-web-app-capable", content: "yes" });
  addHead("meta", { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" });
  addHead("meta", { name: "apple-mobile-web-app-title", content: "Vocotap" });
  addHead("meta", { name: "theme-color", content: "#06051A" });
  window.addEventListener("beforeinstallprompt", (e: any) => { e.preventDefault(); deferred = e; notify(); });
  window.addEventListener("appinstalled", () => { deferred = null; notify(); });
  if (!__DEV__ && "serviceWorker" in navigator) navigator.serviceWorker.register(`${BASE_PATH}/sw.js`, { scope: `${BASE_PATH}/` }).catch(() => {});
}

export function isStandalone(): boolean {
  if (!web) return true;
  return !!(window.matchMedia?.("(display-mode: standalone)").matches || window.matchMedia?.("(display-mode: fullscreen)").matches || (navigator as any).standalone);
}

function detectMode(): InstallMode {
  if (deferred) return "prompt";
  const ua = navigator.userAgent || "";
  const ios = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && (navigator.maxTouchPoints || 0) > 1);
  if (ios) return "ios";
  if (/Firefox/.test(ua)) return "firefox";
  if (/Macintosh/.test(ua) && /Safari/.test(ua) && !/Chrome|Chromium|Edg|OPR/.test(ua)) return "mac-safari";
  return "browser-menu";
}

export function useInstallApp() {
  const [, force] = useReducer((x: number) => x + 1, 0);
  useEffect(() => { subs.add(force); return () => { subs.delete(force); }; }, []);
  const available = web && !isStandalone();
  return {
    available,
    mode: available ? detectMode() : ("browser-menu" as InstallMode),
    // Fires the browser's native install dialog (Chrome / Edge / Android). Returns true when accepted.
    promptInstall: async () => {
      if (!deferred) return false;
      const ev = deferred; deferred = null;
      ev.prompt();
      const choice = await ev.userChoice.catch(() => null);
      notify();
      return choice?.outcome === "accepted";
    },
  };
}
