import React from "react";
import { View, StyleSheet, Image } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { DadsSummary } from "@/components/DadsSummary";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface ChatBubbleProps {
  message: Message;
}

function parseDadsSummary(content: string): { mainContent: string; bullets: string[] | null } {
  const summaryRegex = /(?:\*\*)?Dad['']?s Summary(?:\*\*)?:?\s*[\n]*((?:[-•*]\s*.+[\n]*)+)/i;
  const match = content.match(summaryRegex);
  
  if (match) {
    const mainContent = content.slice(0, match.index).trim();
    const bulletText = match[1];
    const bullets = bulletText
      .split(/[\n]+/)
      .map((line) => line.replace(/^[-•*]\s*/, "").trim())
      .filter((line) => line.length > 0)
      .slice(0, 3);
    
    return { mainContent, bullets: bullets.length > 0 ? bullets : null };
  }
  
  return { mainContent: content, bullets: null };
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const theme = Colors.dark;
  const isUser = message.role === "user";

  const { mainContent, bullets } = isUser
    ? { mainContent: message.content, bullets: null }
    : parseDadsSummary(message.content);

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}>
      {!isUser ? (
        <View style={styles.avatarContainer}>
          <Image
            source={require("../../assets/images/icon.png")}
            style={styles.avatar}
            resizeMode="contain"
          />
        </View>
      ) : null}
      <View
        style={[
          styles.bubble,
          isUser
            ? [styles.userBubble, { backgroundColor: theme.userBubble }]
            : [styles.assistantBubble, { backgroundColor: theme.assistantBubble }],
        ]}
      >
        <ThemedText style={styles.messageText}>{mainContent}</ThemedText>
        {bullets ? <DadsSummary bullets={bullets} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginVertical: Spacing.xs,
  },
  userContainer: {
    justifyContent: "flex-end",
  },
  assistantContainer: {
    justifyContent: "flex-start",
  },
  avatarContainer: {
    width: 32,
    height: 32,
    marginRight: Spacing.sm,
    marginTop: Spacing.xs,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
  },
  bubble: {
    maxWidth: "80%",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  userBubble: {
    borderBottomRightRadius: Spacing.xs,
  },
  assistantBubble: {
    borderBottomLeftRadius: Spacing.xs,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
  },
});
