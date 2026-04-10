import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";

import { DadsSummary } from "@/components/DadsSummary";
import { MarkdownText } from "@/components/MarkdownText";
import { Colors, Spacing, BorderRadius, Fonts } from "@/constants/theme";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  imageUri?: string;
}

interface ChatBubbleProps {
  message: Message;
}

interface ParsedSections {
  mainContent: string;
  summary: string[];
  reflexions: string[];
  book: string;
}

function parseGaryResponse(content: string): ParsedSections {
  let mainContent = content;
  let summary: string[] = [];
  let reflexions: string[] = [];
  let book = "";

  const summaryRegex =
    /\*\*Dad['']?s Summary:\*\*\s*\n((?:[-•]\s*.+\n?)+)/i;
  const summaryMatch = mainContent.match(summaryRegex);
  if (summaryMatch) {
    mainContent = mainContent.slice(0, summaryMatch.index).trim();
    summary = summaryMatch[1]
      .split("\n")
      .map((l) => l.replace(/^[-•]\s*/, "").trim())
      .filter((l) => l.length > 0)
      .slice(0, 3);
  }

  const reflexionRegex =
    /\*\*Reflexion Questions:\*\*\s*\n((?:\d+\.\s*.+\n?)+)/i;
  const reflexionMatch = content.match(reflexionRegex);
  if (reflexionMatch) {
    reflexions = reflexionMatch[1]
      .split("\n")
      .map((l) => l.replace(/^\d+\.\s*/, "").trim())
      .filter((l) => l.length > 0)
      .slice(0, 3);
  }

  const bookRegex = /\*\*Book Recommendation:\*\*\s*\n(.+)/i;
  const bookMatch = content.match(bookRegex);
  if (bookMatch) {
    book = bookMatch[1].trim();
  }

  if (!summaryMatch) {
    const fallbackSummaryRegex =
      /(?:Dad['']?s Summary:?)\s*\n((?:[-•]\s*.+\n?)+)/i;
    const fallback = content.match(fallbackSummaryRegex);
    if (fallback) {
      mainContent = content.slice(0, fallback.index).trim();
      summary = fallback[1]
        .split("\n")
        .map((l) => l.replace(/^[-•]\s*/, "").trim())
        .filter((l) => l.length > 0)
        .slice(0, 3);
    }
  }

  return { mainContent, summary, reflexions, book };
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const theme = Colors.dark;
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const { mainContent, summary, reflexions, book } = isUser
    ? { mainContent: message.content, summary: [], reflexions: [], book: "" }
    : parseGaryResponse(message.content);

  const hasSections =
    summary.length > 0 || reflexions.length > 0 || book.length > 0;

  const copyMessage = async () => {
    await Clipboard.setStringAsync(message.content);
    setCopied(true);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUser) {
    return (
      <View style={styles.userRow}>
        <View
          style={[
            styles.userBubble,
            {
              backgroundColor: theme.userBubble,
              borderColor: theme.userBubbleBorder,
            },
          ]}
        >
          {message.imageUri ? (
            <Image
              source={{ uri: message.imageUri }}
              style={styles.attachedImage}
              resizeMode="cover"
            />
          ) : null}
          <Text
            style={[
              styles.userText,
              {
                color: theme.text,
                fontFamily: Fonts.mono,
              },
            ]}
          >
            {mainContent}
          </Text>
        </View>
        <Pressable
          onPress={copyMessage}
          style={({ pressed }) => [styles.copyBtn, { opacity: pressed ? 0.4 : 0.6 }]}
          testID={`button-copy-${message.id}`}
        >
          <Feather
            name={copied ? "check" : "copy"}
            size={11}
            color={copied ? theme.success : theme.textSecondary}
          />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.assistantRow}>
      <View style={styles.avatarCol}>
        <Image
          source={require("../../assets/images/icon.png")}
          style={styles.avatar}
          resizeMode="contain"
        />
      </View>

      <View style={styles.assistantContent}>
        <View
          style={[
            styles.assistantBubble,
            { borderLeftColor: theme.accent },
          ]}
        >
          {message.imageUri ? (
            <Image
              source={{ uri: message.imageUri }}
              style={styles.attachedImage}
              resizeMode="cover"
            />
          ) : null}
          <MarkdownText content={mainContent} />
          {hasSections ? (
            <DadsSummary sections={{ summary, reflexions, book }} />
          ) : null}
        </View>

        <Pressable
          onPress={copyMessage}
          style={({ pressed }) => [styles.copyBtn, { opacity: pressed ? 0.4 : 0.6 }]}
          testID={`button-copy-${message.id}`}
        >
          <Feather
            name={copied ? "check" : "copy"}
            size={11}
            color={copied ? theme.success : theme.textSecondary}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  userRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "flex-end",
    gap: Spacing.xs,
    marginVertical: 12,
    paddingLeft: 40,
  },
  userBubble: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    maxWidth: "85%",
  },
  userText: {
    fontSize: 14,
    lineHeight: 22,
  },
  assistantRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginVertical: 12,
    gap: Spacing.sm,
  },
  avatarCol: {
    width: 26,
    height: 26,
    flexShrink: 0,
    marginTop: 2,
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: BorderRadius.xs,
  },
  assistantContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  assistantBubble: {
    borderLeftWidth: 2,
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  copyBtn: {
    alignSelf: "flex-start",
    padding: Spacing.xs,
  },
  attachedImage: {
    width: "100%",
    height: 160,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
});
