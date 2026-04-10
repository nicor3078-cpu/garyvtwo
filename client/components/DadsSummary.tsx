import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";

import { Colors, Spacing, BorderRadius, Fonts } from "@/constants/theme";

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
  const [copiedSummary, setCopiedSummary] = useState(false);

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    setCopiedSummary(true);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setTimeout(() => setCopiedSummary(false), 2000);
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
              borderLeftColor: theme.accent,
              backgroundColor: theme.accentGlow,
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.titleRow}>
              <Feather name="bookmark" size={12} color={theme.accent} />
              <Text
                style={[
                  styles.sectionLabel,
                  { color: theme.accent, fontFamily: Fonts.monoBold },
                ]}
              >
                DAD'S SUMMARY
              </Text>
            </View>
            <Pressable
              onPress={() =>
                copyToClipboard(
                  sections.summary.map((b) => `- ${b}`).join("\n")
                )
              }
              style={({ pressed }) => ({ opacity: pressed ? 0.4 : 0.7 })}
              testID="button-copy-summary"
            >
              <Feather
                name={copiedSummary ? "check" : "copy"}
                size={11}
                color={copiedSummary ? theme.success : theme.textSecondary}
              />
            </Pressable>
          </View>
          <View style={styles.list}>
            {sections.summary.map((bullet, index) => (
              <View key={index} style={styles.listItem}>
                <Text
                  style={[
                    styles.listBullet,
                    { color: theme.accent, fontFamily: Fonts.monoBold },
                  ]}
                >
                  _
                </Text>
                <Text
                  style={[
                    styles.listText,
                    { color: theme.text, fontFamily: Fonts.mono },
                  ]}
                >
                  {bullet}
                </Text>
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
              borderLeftColor: theme.success,
              backgroundColor: "rgba(0, 212, 170, 0.06)",
            },
          ]}
        >
          <View style={styles.titleRow}>
            <Feather name="zap" size={12} color={theme.success} />
            <Text
              style={[
                styles.sectionLabel,
                { color: theme.success, fontFamily: Fonts.monoBold },
              ]}
            >
              REFLEXION
            </Text>
          </View>
          <View style={styles.list}>
            {sections.reflexions.map((q, index) => (
              <View key={index} style={styles.listItem}>
                <Text
                  style={[
                    styles.listBullet,
                    { color: theme.success, fontFamily: Fonts.monoBold },
                  ]}
                >
                  {index + 1}.
                </Text>
                <Text
                  style={[
                    styles.listText,
                    { color: theme.text, fontFamily: Fonts.mono },
                  ]}
                >
                  {q}
                </Text>
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
              borderLeftColor: theme.warning,
              backgroundColor: "rgba(255, 184, 0, 0.06)",
            },
          ]}
        >
          <View style={styles.titleRow}>
            <Feather name="book" size={12} color={theme.warning} />
            <Text
              style={[
                styles.sectionLabel,
                { color: theme.warning, fontFamily: Fonts.monoBold },
              ]}
            >
              READ
            </Text>
          </View>
          <Text
            style={[
              styles.bookText,
              { color: theme.text, fontFamily: Fonts.mono },
            ]}
          >
            {sections.book}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  section: {
    borderLeftWidth: 2,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.xs,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 1.2,
  },
  list: {
    gap: 6,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  listBullet: {
    fontSize: 12,
    lineHeight: 20,
    flexShrink: 0,
    minWidth: 16,
  },
  listText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  bookText: {
    fontSize: 13,
    lineHeight: 20,
    fontStyle: "italic",
  },
});
