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
import { askGary } from "@/lib/gemini";

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

interface DailyQuestionCount {
  date: string;
  count: number;
}

const STORAGE_KEY = "gary_conversations";
const CURRENT_CONVERSATION_KEY = "gary_current_conversation";
const DAILY_QUESTIONS_KEY = "gary_daily_questions";
const MAX_DAILY_QUESTIONS = 10;

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const theme = Colors.dark;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [questionsRemaining, setQuestionsRemaining] = useState(MAX_DAILY_QUESTIONS);
  const flatListRef = useRef<FlatList>(null);

  useFocusEffect(
    useCallback(() => {
      loadCurrentConversation();
      loadDailyQuestionCount();
    }, [])
  );

  const getTodayDateString = (): string => {
    // Use local device time for reset logic
    // Reset happens at 3:00 AM local time, so before 3 AM counts as previous day
    const now = new Date();
    const hours = now.getHours();
    
    // If before 3 AM, treat as previous day for reset purposes
    if (hours < 3) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday.toLocaleDateString();
    }
    
    return now.toLocaleDateString();
  };

  const loadDailyQuestionCount = async () => {
    try {
      const data = await AsyncStorage.getItem(DAILY_QUESTIONS_KEY);
      if (data) {
        const parsed: DailyQuestionCount = JSON.parse(data);
        if (parsed.date === getTodayDateString()) {
          setQuestionsRemaining(MAX_DAILY_QUESTIONS - parsed.count);
        } else {
          setQuestionsRemaining(MAX_DAILY_QUESTIONS);
          await AsyncStorage.setItem(
            DAILY_QUESTIONS_KEY,
            JSON.stringify({ date: getTodayDateString(), count: 0 })
          );
        }
      } else {
        setQuestionsRemaining(MAX_DAILY_QUESTIONS);
      }
    } catch (error) {
      console.error("Error loading daily question count:", error);
    }
  };

  const incrementDailyQuestionCount = async (): Promise<boolean> => {
    try {
      const data = await AsyncStorage.getItem(DAILY_QUESTIONS_KEY);
      let current: DailyQuestionCount = { date: getTodayDateString(), count: 0 };
      
      if (data) {
        const parsed: DailyQuestionCount = JSON.parse(data);
        if (parsed.date === getTodayDateString()) {
          current = parsed;
        }
      }

      if (current.count >= MAX_DAILY_QUESTIONS) {
        return false;
      }

      current.count += 1;
      await AsyncStorage.setItem(DAILY_QUESTIONS_KEY, JSON.stringify(current));
      setQuestionsRemaining(MAX_DAILY_QUESTIONS - current.count);
      return true;
    } catch (error) {
      console.error("Error incrementing question count:", error);
      return true;
    }
  };

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

    const canAsk = await incrementDailyQuestionCount();
    
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

    if (!canAsk) {
      const limitMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Kid, no more questions until tomorrow! You've used up all 10 of your daily questions. Get some rest and come back fresh tomorrow - I'll be here waiting to help you learn more!\n\n**Dad's Summary:**\n- You've reached your daily limit of 10 questions\n- Questions reset at midnight\n- Come back tomorrow for more learning!",
        timestamp: Date.now(),
      };
      const updatedMessages = [...newMessages, limitMessage];
      setMessages(updatedMessages);
      await saveConversation(updatedMessages);
      setIsLoading(false);
      return;
    }

    try {
      const responseText = await askGary(
        userMessage.content,
        newMessages.slice(-10).map((m) => ({
          role: m.role,
          content: m.content,
        }))
      );
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseText,
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
      <View style={[styles.headerButtons, { top: headerHeight + Spacing.sm }]}>
        <View style={[styles.questionsCounter, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name="help-circle" size={14} color={questionsRemaining > 0 ? theme.accent : theme.error} />
          <ThemedText style={[styles.questionsCounterText, { color: questionsRemaining > 0 ? theme.accent : theme.error }]}>
            {questionsRemaining} left today
          </ThemedText>
        </View>
        <Pressable
          onPress={shareApp}
          style={({ pressed }) => [
            styles.shareButton,
            { 
              opacity: pressed ? 0.7 : 1,
              borderColor: theme.accent,
            },
          ]}
          testID="button-share"
        >
          <Feather name="share-2" size={16} color={theme.accent} />
          <ThemedText style={[styles.shareButtonText, { color: theme.accent }]}>
            Share
          </ThemedText>
        </Pressable>
      </View>

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
            paddingBottom: headerHeight + Spacing["4xl"],
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
          placeholder={questionsRemaining > 0 ? "Ask GARY anything..." : "No questions left today..."}
          placeholderTextColor={theme.textSecondary}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={2000}
          editable={questionsRemaining > 0}
          testID="input-message"
        />
        <Pressable
          onPress={sendMessage}
          disabled={!inputText.trim() || isLoading || questionsRemaining <= 0}
          style={({ pressed }) => [
            styles.sendButton,
            {
              backgroundColor: inputText.trim() && !isLoading && questionsRemaining > 0 ? theme.accent : theme.backgroundTertiary,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
          testID="button-send"
        >
          <Feather
            name="send"
            size={20}
            color={inputText.trim() && !isLoading && questionsRemaining > 0 ? theme.buttonText : theme.textSecondary}
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
  headerButtons: {
    position: "absolute",
    right: Spacing.lg,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  questionsCounter: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
  },
  questionsCounterText: {
    fontSize: 12,
    fontWeight: "600",
  },
  shareButton: {
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
