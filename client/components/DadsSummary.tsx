import React from "react";
import { View, StyleSheet, Pressable, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

interface ParsedSections {
  summary: string[];
  reflexions: string[];
  book: string;
}

interface DadsSummaryProps {
  sections: ParsedSections;
}

export function DadsSummary({ sections }: DadsSummaryProps) {
  const theme = Colors.dark;

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const hasSummary = sections.summary.length > 0;
  const hasReflexions = sections.reflexions.length > 0;
  const hasBook = sections.book.length > 0;

  if (!hasSummary && !hasReflexions && !hasBook) return null;

  return (
    <View style={styles.wrapper}>
      {hasSummary ? (
        <View
          style={[
            styles.section,
            {
              backgroundColor: theme.accentGlow,
              borderColor: theme.accent,
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Feather name="bookmark" size={15} color={theme.accent} />
              <ThemedText style={[styles.sectionTitle, { color: theme.accent }]}>
                Dad's Summary
              </ThemedText>
            </View>
            <Pressable
              onPress={() =>
                copyToClipboard(sections.summary.map((b) => `- ${b}`).join("\n"))
              }
              style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
              testID="button-copy-summary"
            >
              <Feather name="copy" size={14} color={theme.textSecondary} />
            </Pressable>
          </View>
          <View style={styles.bulletList}>
            {sections.summary.map((bullet, index) => (
              <View key={index} style={styles.bulletItem}>
                <View
                  style={[styles.bulletDot, { backgroundColor: theme.accent }]}
                />
                <ThemedText style={[styles.bulletText, { color: theme.text }]}>
                  {bullet}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {hasReflexions ? (
        <View
          style={[
            styles.section,
            {
              backgroundColor: "rgba(0, 212, 170, 0.08)",
              borderColor: theme.success,
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Feather name="zap" size={15} color={theme.success} />
              <ThemedText
                style={[styles.sectionTitle, { color: theme.success }]}
              >
                Reflexion Questions
              </ThemedText>
            </View>
          </View>
          <View style={styles.bulletList}>
            {sections.reflexions.map((q, index) => (
              <View key={index} style={styles.bulletItem}>
                <ThemedText
                  style={[styles.numberedLabel, { color: theme.success }]}
                >
                  {index + 1}.
                </ThemedText>
                <ThemedText style={[styles.bulletText, { color: theme.text }]}>
                  {q}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {hasBook ? (
        <View
          style={[
            styles.section,
            {
              backgroundColor: "rgba(255, 184, 0, 0.08)",
              borderColor: theme.warning,
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Feather name="book" size={15} color={theme.warning} />
              <ThemedText
                style={[styles.sectionTitle, { color: theme.warning }]}
              >
                Book Recommendation
              </ThemedText>
            </View>
          </View>
          <ThemedText style={[styles.bookText, { color: theme.text }]}>
            {sections.book}
          </ThemedText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  section: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  bulletList: {
    gap: Spacing.xs,
  },
  bulletItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 9,
    flexShrink: 0,
  },
  numberedLabel: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 22,
    minWidth: 18,
    flexShrink: 0,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
  },
  bookText: {
    fontSize: 14,
    lineHeight: 22,
    fontStyle: "italic",
  },
});
