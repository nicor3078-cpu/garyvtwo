import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

interface DadsSummaryProps {
  bullets: string[];
}

export function DadsSummary({ bullets }: DadsSummaryProps) {
  const theme = Colors.dark;

  return (
    <View style={[styles.container, { borderColor: theme.accent }]}>
      <View style={styles.header}>
        <Feather name="bookmark" size={16} color={theme.accent} />
        <ThemedText style={[styles.title, { color: theme.accent }]}>
          Dad's Summary
        </ThemedText>
      </View>
      <View style={styles.bulletList}>
        {bullets.map((bullet, index) => (
          <View key={index} style={styles.bulletItem}>
            <View style={[styles.bulletDot, { backgroundColor: theme.accent }]} />
            <ThemedText style={styles.bulletText}>{bullet}</ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.lg,
    borderWidth: 2,
    borderRadius: BorderRadius.sm,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
  },
  bulletList: {
    gap: Spacing.sm,
  },
  bulletItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
});
