import React from "react";
import { Image, StyleSheet, Text, View, ViewStyle } from "react-native";
import { colors, fonts, rgba } from "@/src/game/theme";

export function Avatar({ avatar, nickname, size = 40, style }: { avatar: string | null; nickname: string; size?: number; style?: ViewStyle }) {
  const dimension = { width: size, height: size, borderRadius: size / 2 };
  return <View style={[styles.wrap, dimension, style]}>
    {avatar ? <Image source={{ uri: avatar }} style={[dimension, styles.image]} resizeMode="cover" /> : <Text style={[styles.initial, { fontSize: size * 0.42 }]}>{(nickname || "T").charAt(0).toUpperCase()}</Text>}
  </View>;
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center", overflow: "hidden", backgroundColor: rgba(0.18), borderWidth: 1, borderColor: colors.border },
  image: { width: "100%", height: "100%" },
  initial: { color: colors.text, fontFamily: fonts.heavy },
});
