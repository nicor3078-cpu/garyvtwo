import React from "react";
import { Text, View, StyleSheet, Platform } from "react-native";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

interface MarkdownTextProps {
  content: string;
  style?: object;
}

type Segment =
  | { type: "text"; value: string }
  | { type: "bold"; value: string }
  | { type: "italic"; value: string }
  | { type: "bolditalic"; value: string }
  | { type: "code"; value: string };

function parseInline(text: string): Segment[] {
  const segments: Segment[] = [];
  const regex = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`)/gs;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    if (match[2] !== undefined) {
      segments.push({ type: "bolditalic", value: match[2] });
    } else if (match[3] !== undefined) {
      segments.push({ type: "bold", value: match[3] });
    } else if (match[4] !== undefined) {
      segments.push({ type: "italic", value: match[4] });
    } else if (match[5] !== undefined) {
      segments.push({ type: "code", value: match[5] });
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", value: text.slice(lastIndex) });
  }

  return segments;
}

function renderInlineSegments(segments: Segment[], theme: typeof Colors.dark) {
  return segments.map((seg, i) => {
    switch (seg.type) {
      case "bold":
        return (
          <Text key={i} style={{ fontWeight: "700", color: theme.text }}>
            {seg.value}
          </Text>
        );
      case "italic":
        return (
          <Text key={i} style={{ fontStyle: "italic", color: theme.text }}>
            {seg.value}
          </Text>
        );
      case "bolditalic":
        return (
          <Text
            key={i}
            style={{ fontWeight: "700", fontStyle: "italic", color: theme.text }}
          >
            {seg.value}
          </Text>
        );
      case "code":
        return (
          <Text
            key={i}
            style={{
              fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
              backgroundColor: theme.codeBg,
              color: theme.accent,
              fontSize: 13,
              paddingHorizontal: 4,
              borderRadius: 4,
            }}
          >
            {seg.value}
          </Text>
        );
      default:
        return (
          <Text key={i} style={{ color: theme.text }}>
            {seg.value}
          </Text>
        );
    }
  });
}

interface BlockElement {
  type:
    | "paragraph"
    | "h1"
    | "h2"
    | "h3"
    | "bullet"
    | "numbered"
    | "codeblock"
    | "divider";
  content: string;
  level?: number;
}

function parseBlocks(text: string): BlockElement[] {
  const lines = text.split("\n");
  const blocks: BlockElement[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        inCodeBlock = false;
        blocks.push({ type: "codeblock", content: codeLines.join("\n") });
        codeLines = [];
      } else {
        inCodeBlock = true;
      }
      i++;
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      i++;
      continue;
    }

    if (line.trim() === "---" || line.trim() === "***" || line.trim() === "___") {
      blocks.push({ type: "divider", content: "" });
      i++;
      continue;
    }

    if (line.startsWith("### ")) {
      blocks.push({ type: "h3", content: line.slice(4) });
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      blocks.push({ type: "h2", content: line.slice(3) });
      i++;
      continue;
    }
    if (line.startsWith("# ")) {
      blocks.push({ type: "h1", content: line.slice(2) });
      i++;
      continue;
    }

    const bulletMatch = line.match(/^(\s*)[-*+]\s+(.+)/);
    if (bulletMatch) {
      blocks.push({ type: "bullet", content: bulletMatch[2] });
      i++;
      continue;
    }

    const numberedMatch = line.match(/^\d+\.\s+(.+)/);
    if (numberedMatch) {
      const num = line.match(/^(\d+)\./)?.[1] || "1";
      blocks.push({ type: "numbered", content: numberedMatch[1], level: parseInt(num) });
      i++;
      continue;
    }

    if (line.trim().length === 0) {
      i++;
      continue;
    }

    blocks.push({ type: "paragraph", content: line });
    i++;
  }

  if (inCodeBlock && codeLines.length > 0) {
    blocks.push({ type: "codeblock", content: codeLines.join("\n") });
  }

  return blocks;
}

export function MarkdownText({ content, style }: MarkdownTextProps) {
  const theme = Colors.dark;
  const blocks = parseBlocks(content);

  return (
    <View>
      {blocks.map((block, idx) => {
        switch (block.type) {
          case "h1":
            return (
              <Text
                key={idx}
                style={[styles.h1, { color: theme.text }, style]}
              >
                {renderInlineSegments(parseInline(block.content), theme)}
              </Text>
            );
          case "h2":
            return (
              <Text
                key={idx}
                style={[styles.h2, { color: theme.text }, style]}
              >
                {renderInlineSegments(parseInline(block.content), theme)}
              </Text>
            );
          case "h3":
            return (
              <Text
                key={idx}
                style={[styles.h3, { color: theme.accent }, style]}
              >
                {renderInlineSegments(parseInline(block.content), theme)}
              </Text>
            );
          case "bullet":
            return (
              <View key={idx} style={styles.bulletRow}>
                <View
                  style={[styles.bulletDot, { backgroundColor: theme.accent }]}
                />
                <Text style={[styles.paragraph, { color: theme.text, flex: 1 }, style]}>
                  {renderInlineSegments(parseInline(block.content), theme)}
                </Text>
              </View>
            );
          case "numbered":
            return (
              <View key={idx} style={styles.bulletRow}>
                <Text style={[styles.numberedLabel, { color: theme.accent }]}>
                  {block.level}.
                </Text>
                <Text style={[styles.paragraph, { color: theme.text, flex: 1 }, style]}>
                  {renderInlineSegments(parseInline(block.content), theme)}
                </Text>
              </View>
            );
          case "codeblock":
            return (
              <View
                key={idx}
                style={[styles.codeBlock, { backgroundColor: theme.codeBg, borderColor: theme.border }]}
              >
                <Text
                  style={[
                    styles.codeText,
                    {
                      color: theme.accent,
                      fontFamily: Platform.select({
                        ios: "Menlo",
                        android: "monospace",
                        default: "monospace",
                      }),
                    },
                  ]}
                >
                  {block.content}
                </Text>
              </View>
            );
          case "divider":
            return (
              <View
                key={idx}
                style={[styles.divider, { backgroundColor: theme.border }]}
              />
            );
          default:
            return (
              <Text
                key={idx}
                style={[styles.paragraph, { color: theme.text }, style]}
              >
                {renderInlineSegments(parseInline(block.content), theme)}
              </Text>
            );
        }
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  h1: {
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 30,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  h2: {
    fontSize: 19,
    fontWeight: "700",
    lineHeight: 26,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  h3: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 24,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 23,
    marginBottom: Spacing.xs,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
    paddingLeft: Spacing.xs,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    flexShrink: 0,
  },
  numberedLabel: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 23,
    minWidth: 20,
    flexShrink: 0,
  },
  codeBlock: {
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    padding: Spacing.md,
    marginVertical: Spacing.sm,
  },
  codeText: {
    fontSize: 13,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.md,
    opacity: 0.4,
  },
});
