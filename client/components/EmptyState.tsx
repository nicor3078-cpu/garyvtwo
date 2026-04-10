import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Colors, Spacing, Fonts } from "@/constants/theme";

interface EmptyStateProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
}

export function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  const theme = Colors.dark;

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/icon.png")}
        style={styles.image}
        resizeMode="contain"
      />
      <Text
        style={[
          styles.title,
          { color: theme.accent, fontFamily: Fonts.monoBold },
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.subtitle,
          { color: theme.textSecondary, fontFamily: Fonts.mono },
        ]}
      >
        {subtitle}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing["3xl"],
    paddingVertical: Spacing["4xl"],
    gap: Spacing.md,
  },
  image: {
    width: 56,
    height: 56,
    marginBottom: Spacing.sm,
    opacity: 0.8,
  },
  title: {
    fontSize: 15,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 20,
    opacity: 0.8,
  },
});
