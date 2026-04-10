import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  FlatList,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "@/components/ThemedText";
import { ChatBubble, Message } from "@/components/ChatBubble";
import { EmptyState } from "@/components/EmptyState";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { askGary, ImageAttachment } from "@/lib/gemini";
import { KEYS } from "@/lib/storage";

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const theme = Colors.dark;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<{
    uri: string;
    base64: string;
    mimeType: string;
  } | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useFocusEffect(
    useCallback(() => {
      loadCurrentConversation();
    }, [])
  );

  const loadCurrentConversation = async () => {
    try {
      const currentId = await AsyncStorage.getItem(KEYS.CURRENT_CONVERSATION);
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
      const data = await AsyncStorage.getItem(KEYS.CONVERSATIONS);
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
        convId = generateId();
        setConversationId(convId);
        await AsyncStorage.setItem(KEYS.CURRENT_CONVERSATION, convId);
      }

      const existingIndex = conversations.findIndex((c) => c.id === convId);
      const conversation: Conversation = {
        id: convId,
        title: title || extractTitle(msgs),
        messages: msgs,
        createdAt:
          existingIndex >= 0 ? conversations[existingIndex].createdAt : Date.now(),
      };

      if (existingIndex >= 0) {
        conversations[existingIndex] = conversation;
      } else {
        conversations.unshift(conversation);
      }

      await AsyncStorage.setItem(KEYS.CONVERSATIONS, JSON.stringify(conversations));
    } catch (error) {
      console.error("Error saving conversation:", error);
    }
  };

  const extractTitle = (msgs: Message[]): string => {
    const firstUserMessage = msgs.find((m) => m.role === "user");
    if (firstUserMessage) {
      return (
        firstUserMessage.content.slice(0, 60) +
        (firstUserMessage.content.length > 60 ? "..." : "")
      );
    }
    return "New Conversation";
  };

  const startNewConversation = async () => {
    abortRef.current?.abort();
    setMessages([]);
    setConversationId(null);
    setPendingImage(null);
    setInputText("");
    setIsLoading(false);
    await AsyncStorage.removeItem(KEYS.CURRENT_CONVERSATION);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const base64 = asset.base64 || "";
      const mimeType = asset.mimeType || "image/jpeg";
      setPendingImage({ uri: asset.uri, base64, mimeType });
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const sendMessage = async () => {
    if ((!inputText.trim() && !pendingImage) || isLoading) return;

    abortRef.current = new AbortController();

    const imageAttachment: ImageAttachment | undefined = pendingImage
      ? { base64: pendingImage.base64, mimeType: pendingImage.mimeType }
      : undefined;

    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: inputText.trim() || "What can you tell me about this image?",
      timestamp: Date.now(),
      imageUri: pendingImage?.uri,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText("");
    setPendingImage(null);
    setIsLoading(true);
    setRetryCount(0);

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      const responseText = await askGary(
        userMessage.content,
        newMessages.slice(-12).map((m) => ({
          role: m.role,
          content: m.content,
        })),
        imageAttachment,
        abortRef.current.signal
      );

      const assistantMessage: Message = {
        id: generateId(),
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
    } catch (error: any) {
      if (error?.name === "AbortError" || error?.message === "Request cancelled") {
        setIsLoading(false);
        return;
      }

      const errorMessage: Message = {
        id: generateId(),
        role: "assistant",
        content:
          "Something went wrong on my end. Check your connection and try again. I'm not going anywhere.",
        timestamp: Date.now(),
      };
      const updatedMessages = [...newMessages, errorMessage];
      setMessages(updatedMessages);
      await saveConversation(updatedMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelRequest = () => {
    abortRef.current?.abort();
    setIsLoading(false);
  };

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => <ChatBubble message={item} />,
    []
  );

  const keyExtractor = useCallback((item: Message) => item.id, []);

  const canSend = (inputText.trim().length > 0 || pendingImage !== null) && !isLoading;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      <View style={[styles.headerActions, { top: headerHeight + Spacing.sm }]}>
        <Pressable
          onPress={startNewConversation}
          style={({ pressed }) => [
            styles.headerBtn,
            {
              backgroundColor: theme.backgroundSecondary,
              borderColor: theme.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          testID="button-new-chat"
        >
          <Feather name="plus" size={15} color={theme.accent} />
          <ThemedText style={[styles.headerBtnText, { color: theme.accent }]}>
            New
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
            title="Ask GARY anything"
            subtitle="Your wise, fatherly AI tutor explains complex topics simply using the Feynman Technique. No question limit."
          />
        }
        ListFooterComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.accent} />
              <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
                GARY is thinking...
              </ThemedText>
              <Pressable
                onPress={cancelRequest}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.5 : 1,
                  padding: Spacing.xs,
                })}
                testID="button-cancel"
              >
                <Feather name="x" size={14} color={theme.textSecondary} />
              </Pressable>
            </View>
          ) : null
        }
      />

      {pendingImage ? (
        <View
          style={[
            styles.imagePreviewBar,
            { backgroundColor: theme.backgroundSecondary, borderTopColor: theme.border },
          ]}
        >
          <Feather name="image" size={14} color={theme.accent} />
          <ThemedText
            style={[styles.imagePreviewText, { color: theme.textSecondary }]}
          >
            Image attached
          </ThemedText>
          <Pressable
            onPress={() => setPendingImage(null)}
            style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
            testID="button-remove-image"
          >
            <Feather name="x" size={14} color={theme.error} />
          </Pressable>
        </View>
      ) : null}

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
        <Pressable
          onPress={pickImage}
          style={({ pressed }) => [
            styles.iconBtn,
            {
              backgroundColor: theme.backgroundSecondary,
              opacity: pressed ? 0.6 : 1,
            },
          ]}
          testID="button-pick-image"
        >
          <Feather name="image" size={18} color={theme.textSecondary} />
        </Pressable>

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.backgroundSecondary,
              color: theme.text,
              borderColor: theme.border,
            },
          ]}
          placeholder="Ask GARY anything..."
          placeholderTextColor={theme.textSecondary}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={4000}
          testID="input-message"
          onSubmitEditing={Platform.OS === "web" ? sendMessage : undefined}
        />

        <Pressable
          onPress={sendMessage}
          disabled={!canSend}
          style={({ pressed }) => [
            styles.sendButton,
            {
              backgroundColor: canSend ? theme.accent : theme.backgroundTertiary,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
          testID="button-send"
        >
          <Feather
            name="send"
            size={18}
            color={canSend ? theme.buttonText : theme.textSecondary}
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
  headerActions: {
    position: "absolute",
    right: Spacing.lg,
    zIndex: 10,
    flexDirection: "row",
    gap: Spacing.sm,
  },
  headerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
  },
  headerBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  messageList: {
    flexGrow: 1,
    paddingHorizontal: Spacing.md,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  loadingText: {
    fontSize: 13,
  },
  imagePreviewBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
  },
  imagePreviewText: {
    flex: 1,
    fontSize: 13,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 15,
    borderWidth: 1,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});
