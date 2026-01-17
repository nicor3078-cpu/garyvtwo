import React, { useState, useCallback } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "@/components/ThemedText";
import { EmptyState } from "@/components/EmptyState";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

const STORAGE_KEY = "gary_conversations";

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const theme = Colors.dark;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [])
  );

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = data ? JSON.parse(data) : [];
      setConversations(parsed);
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  const getPreview = (messages: Message[]): string => {
    const firstMessage = messages.find((m) => m.role === "user");
    if (firstMessage) {
      return firstMessage.content.slice(0, 80) + (firstMessage.content.length > 80 ? "..." : "");
    }
    return "No messages";
  };

  const openConversation = (conversation: Conversation) => {
    navigation.navigate("TopicDetail", { conversation });
  };

  const renderItem = useCallback(
    ({ item }: { item: Conversation }) => (
      <Pressable
        onPress={() => openConversation(item)}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: theme.backgroundDefault,
            opacity: pressed ? 0.8 : 1,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          },
        ]}
        testID={`history-item-${item.id}`}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="book-open" size={18} color={theme.accent} />
          </View>
          <View style={styles.cardContent}>
            <ThemedText style={styles.cardTitle} numberOfLines={1}>
              {item.title}
            </ThemedText>
            <ThemedText style={[styles.cardPreview, { color: theme.textSecondary }]} numberOfLines={2}>
              {getPreview(item.messages)}
            </ThemedText>
          </View>
        </View>
        <View style={styles.cardFooter}>
          <ThemedText style={[styles.cardDate, { color: theme.textSecondary }]}>
            {formatDate(item.createdAt)}
          </ThemedText>
          <ThemedText style={[styles.messageCount, { color: theme.textSecondary }]}>
            {item.messages.length} messages
          </ThemedText>
        </View>
      </Pressable>
    ),
    [theme, navigation]
  );

  const keyExtractor = useCallback((item: Conversation) => item.id, []);

  return (
    <FlatList
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.listContent,
        {
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl,
        },
      ]}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
      data={conversations}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ListEmptyComponent={
        !isLoading ? (
          <EmptyState
            icon="clock"
            title="No topics yet"
            subtitle="Start a conversation with GARY to see your history here."
          />
        ) : null
      }
      ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    flexGrow: 1,
  },
  card: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
  cardHeader: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  cardPreview: {
    fontSize: 14,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  cardDate: {
    fontSize: 12,
  },
  messageCount: {
    fontSize: 12,
  },
});
