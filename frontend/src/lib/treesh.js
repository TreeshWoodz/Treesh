import { useEffect, useState } from "react";

const read = (k) => {
  try {
    return JSON.parse(localStorage.getItem(k));
  } catch {
    return null;
  }
};

const resolveAvatar = (a) => {
  if (!a || typeof a !== "string") return "";
  if (/^(https?:|data:image)/.test(a)) return a;
  try {
    return new URL(a, `${window.location.origin}/`).href;
  } catch {
    return "";
  }
};

export function treeshAccount() {
  const prof = read("treesh_profile");
  if (!prof) return null;
  let signedIn = false;
  try {
    signedIn = Object.keys(localStorage).some((k) => /^sb-.+-auth-token$/.test(k));
  } catch {
    /* storage blocked */
  }
  return {
    nickname: prof.nickname || "Treesh Fan",
    username: prof.username || "",
    avatar: resolveAvatar(prof.avatarUrl || prof.avatar),
    bio: prof.bio || "",
    signedIn,
    treeshStars: read("treesh_stars")?.points || 0,
  };
}

export const treeshDisplayName = (t) => (t ? (t.username ? `@${t.username}` : t.nickname) : "");

export function useTreesh() {
  const [acc, setAcc] = useState(treeshAccount);
  useEffect(() => {
    const h = (e) => {
      if (!e.key || /^(treesh_profile|treesh_stars|sb-)/.test(e.key)) setAcc(treeshAccount());
    };
    const f = () => setAcc(treeshAccount());
    window.addEventListener("storage", h);
    window.addEventListener("focus", f);
    return () => {
      window.removeEventListener("storage", h);
      window.removeEventListener("focus", f);
    };
  }, []);
  return acc;
}
