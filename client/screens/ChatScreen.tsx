import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  FlatList,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  Share,
  ActivityIndicator,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "@/components/ThemedText";
import { ChatBubble } from "@/components/ChatBubble";
import { EmptyState } from "@/components/EmptyState";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";

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
const CURRENT_CONVERSATION_KEY = "gary_current_conversation";

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const theme = Colors.dark;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useFocusEffect(
    useCallback(() => {
      loadCurrentConversation();
    }, [])
  );

  const loadCurrentConversation = async () => {
    try {
      const currentId = await AsyncStorage.getItem(CURRENT_CONVERSATION_KEY);
      if (currentId) {
        const conversations = await loadConversations();
        const conversation = conversations.find((c) => c.id === currentId);
        if (conversation) {
          setConversationId(conversation.id);
          setMessages(conversation.messages);
          return;
        }
      }
      // No current conversation, start fresh
      setConversationId(null);
      setMessages([]);
    } catch (error) {
      console.error("Error loading conversation:", error);
    }
  };

  const loadConversations = async (): Promise<Conversation[]> => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  const saveConversation = async (msgs: Message[], title?: string) => {
    try {
      const conversations = await loadConversations();
      let convId = conversationId;
      
      if (!convId) {
        convId = Date.now().toString();
        setConversationId(convId);
        await AsyncStorage.setItem(CURRENT_CONVERSATION_KEY, convId);
      }

      const existingIndex = conversations.findIndex((c) => c.id === convId);
      const conversation: Conversation = {
        id: convId,
        title: title || extractTitle(msgs),
        messages: msgs,
        createdAt: existingIndex >= 0 ? conversations[existingIndex].createdAt : Date.now(),
      };

      if (existingIndex >= 0) {
        conversations[existingIndex] = conversation;
      } else {
        conversations.unshift(conversation);
      }

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch (error) {
      console.error("Error saving conversation:", error);
    }
  };

  const extractTitle = (msgs: Message[]): string => {
    const firstUserMessage = msgs.find((m) => m.role === "user");
    if (firstUserMessage) {
      return firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? "..." : "");
    }
    return "New Conversation";
  };

  const shareApp = async () => {
    try {
      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      const shareUrl = domain ? `https://${domain}` : "https://replit.com";
      await Share.share({
        message: `Check out GARY: The Subject Decoder! Your personal AI tutor that explains complex subjects in simple terms. Download here: ${shareUrl}`,
        title: "GARY: The Subject Decoder",
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputText.trim(),
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText("");
    setIsLoading(true);

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      const response = await apiRequest("POST", "/api/chat", {
        message: userMessage.content,
        history: newMessages.slice(-10).map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: Date.now(),
      };

      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);
      await saveConversation(updatedMessages);

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I apologize, but I encountered an error. Please try again in a moment.",
        timestamp: Date.now(),
      };
      const updatedMessages = [...newMessages, errorMessage];
      setMessages(updatedMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => (
      <ChatBubble message={item} />
    ),
    []
  );

  const keyExtractor = useCallback((item: Message) => item.id, []);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      <Pressable
        onPress={shareApp}
        style={({ pressed }) => [
          styles.shareButton,
          { 
            top: headerHeight + Spacing.sm,
            opacity: pressed ? 0.7 : 1,
            borderColor: theme.accent,
          },
        ]}
        testID="button-share"
      >
        <Feather name="share-2" size={16} color={theme.accent} />
        <ThemedText style={[styles.shareButtonText, { color: theme.accent }]}>
          Share App
        </ThemedText>
      </Pressable>

      <FlatList
        ref={flatListRef}
        data={messages.length > 0 ? [...messages].reverse() : []}
        renderItem={renderMessage}
        keyExtractor={keyExtractor}
        inverted={messages.length > 0}
        contentContainerStyle={[
          styles.messageList,
          {
            paddingTop: tabBarHeight + Spacing.lg,
            paddingBottom: headerHeight + Spacing["3xl"],
          },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        ListEmptyComponent={
          <EmptyState
            icon="book-open"
            title="Ask GARY about any subject"
            subtitle="Your wise, fatherly tutor is here to explain complex topics in simple terms using the Feynman Technique."
          />
        }
        ListFooterComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.accent} />
              <ThemedText style={styles.loadingText}>GARY is thinking...</ThemedText>
            </View>
          ) : null
        }
      />

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.backgroundDefault,
            paddingBottom: insets.bottom + Spacing.sm,
            borderTopColor: theme.border,
          },
        ]}
      >
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.backgroundSecondary,
              color: theme.text,
            },
          ]}
          placeholder="Ask GARY anything..."
          placeholderTextColor={theme.textSecondary}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={2000}
          testID="input-message"
        />
        <Pressable
          onPress={sendMessage}
          disabled={!inputText.trim() || isLoading}
          style={({ pressed }) => [
            styles.sendButton,
            {
              backgroundColor: inputText.trim() && !isLoading ? theme.accent : theme.backgroundTertiary,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
          testID="button-send"
        >
          <Feather
            name="send"
            size={20}
            color={inputText.trim() && !isLoading ? theme.buttonText : theme.textSecondary}
          />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  shareButton: {
    position: "absolute",
    right: Spacing.lg,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  messageList: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  loadingText: {
    fontSize: 14,
    opacity: 0.7,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
});
