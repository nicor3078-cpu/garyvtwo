import React, { useState } from "react";
import { View, StyleSheet, Image, Pressable, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { DadsSummary } from "@/components/DadsSummary";
import { MarkdownText } from "@/components/MarkdownText";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

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

  const bookRegex =
    /\*\*Book Recommendation:\*\*\s*\n(.+)/i;
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

  return (
    <View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.assistantContainer,
      ]}
    >
      {!isUser ? (
        <View style={styles.avatarContainer}>
          <Image
            source={require("../../assets/images/icon.png")}
            style={styles.avatar}
            resizeMode="contain"
          />
        </View>
      ) : null}

      <View style={styles.bubbleWrapper}>
        <View
          style={[
            styles.bubble,
            isUser
              ? [
                  styles.userBubble,
                  {
                    backgroundColor: theme.userBubble,
                    borderColor: theme.accentDim,
                  },
                ]
              : [
                  styles.assistantBubble,
                  { backgroundColor: theme.assistantBubble },
                ],
          ]}
        >
          {message.imageUri ? (
            <Image
              source={{ uri: message.imageUri }}
              style={styles.attachedImage}
              resizeMode="cover"
            />
          ) : null}

          {isUser ? (
            <ThemedText style={[styles.userText, { color: theme.text }]}>
              {mainContent}
            </ThemedText>
          ) : (
            <MarkdownText content={mainContent} />
          )}

          {hasSections ? (
            <DadsSummary
              sections={{ summary, reflexions, book }}
            />
          ) : null}
        </View>

        <Pressable
          onPress={copyMessage}
          style={({ pressed }) => [
            styles.copyButton,
            { opacity: pressed ? 0.5 : 1 },
            isUser ? styles.copyButtonUser : styles.copyButtonAssistant,
          ]}
          testID={`button-copy-${message.id}`}
        >
          <Feather
            name={copied ? "check" : "copy"}
            size={12}
            color={copied ? theme.success : theme.textSecondary}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginVertical: Spacing.xs,
    alignItems: "flex-start",
  },
  userContainer: {
    justifyContent: "flex-end",
  },
  assistantContainer: {
    justifyContent: "flex-start",
  },
  avatarContainer: {
    width: 30,
    height: 30,
    marginRight: Spacing.sm,
    marginTop: Spacing.xs,
    flexShrink: 0,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: BorderRadius.full,
  },
  bubbleWrapper: {
    maxWidth: "82%",
    gap: Spacing.xs,
  },
  bubble: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  userBubble: {
    borderBottomRightRadius: Spacing.xs,
    borderWidth: 1,
  },
  assistantBubble: {
    borderBottomLeftRadius: Spacing.xs,
  },
  userText: {
    fontSize: 15,
    lineHeight: 23,
  },
  copyButton: {
    padding: Spacing.xs,
    alignSelf: "flex-start",
  },
  copyButtonUser: {
    alignSelf: "flex-end",
  },
  copyButtonAssistant: {
    alignSelf: "flex-start",
  },
  attachedImage: {
    width: "100%",
    height: 180,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
});
