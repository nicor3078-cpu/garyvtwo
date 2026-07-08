import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  Animated,
  Easing,
} from "react-native";
import { BlurView } from "expo-blur";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ChatBubble, Message } from "@/components/ChatBubble";
import { EmptyState } from "@/components/EmptyState";
import { Colors, Spacing, BorderRadius, Fonts } from "@/constants/theme";
import { askGary, ImageAttachment } from "@/lib/gemini";
import { getMemoryVault } from "@/lib/storage";
import { KEYS } from "@/lib/storage";
import {
  logMinistryData,
  calculateIQ,
  extractTopic,
} from "@/lib/supabase";

import { supabase } from "../../App";

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function RecalibratingIndicator({ visible }: { visible: boolean }) {
  const theme = Colors.dark;
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (!visible) {
      pulseAnim.setValue(0.3);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.recalibrating}>
      <Animated.View
        style={[
          styles.recalibIcon,
          {
            backgroundColor: theme.accent,
            opacity: pulseAnim,
          },
        ]}
      >
        <Text style={[styles.recalibIconText, { fontFamily: Fonts.monoBold }]}>
          :&gt;
        </Text>
      </Animated.View>
      <Text
        style={[
          styles.recalibText,
          { color: theme.accent, fontFamily: Fonts.mono },
        ]}
      >
        Recalibrating sensors... high traffic detected.
      </Text>
    </View>
  );
}

function LoadingDots({ isImage }: { isImage: boolean }) {
  const theme = Colors.dark;
  const dotAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(dotAnim, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const opacity1 = dotAnim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0.2, 1, 0.2],
  });
  const opacity2 = dotAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.2, 1, 0.2],
  });
  const opacity3 = dotAnim.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0.2, 1, 0.2],
  });

  return (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingLeft}>
        <View
          style={[styles.loadingDots, { borderLeftColor: theme.accent }]}
        >
          <Animated.Text
            style={[
              styles.dot,
              { color: theme.accent, opacity: opacity1 },
            ]}
          >
            .
          </Animated.Text>
          <Animated.Text
            style={[
              styles.dot,
              { color: theme.accent, opacity: opacity2 },
            ]}
          >
            .
          </Animated.Text>
          <Animated.Text
            style={[
              styles.dot,
              { color: theme.accent, opacity: opacity3 },
            ]}
          >
            .
          </Animated.Text>
        </View>
        {isImage ? (
          <Text
            style={[
              styles.loadingLabel,
              { color: theme.textSecondary, fontFamily: Fonts.mono },
            ]}
          >
            analyzing image
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const theme = Colors.dark;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [hasImageRequest, setHasImageRequest] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<{
    uri: string;
    base64: string;
    mimeType: string;
  } | null>(null);
  const [noKeyError, setNoKeyError] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useFocusEffect(
    useCallback(() => {
      loadCurrentConversation();
      setNoKeyError(false);
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
          existingIndex >= 0
            ? conversations[existingIndex].createdAt
            : Date.now(),
      };

      if (existingIndex >= 0) {
        conversations[existingIndex] = conversation;
      } else {
        conversations.unshift(conversation);
      }

      await AsyncStorage.setItem(
        KEYS.CONVERSATIONS,
        JSON.stringify(conversations)
      );
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
    setIsRetrying(false);
    setHasImageRequest(false);
    setNoKeyError(false);
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

    setNoKeyError(false);
    abortRef.current = new AbortController();

    const imageAttachment: ImageAttachment | undefined = pendingImage
      ? { base64: pendingImage.base64, mimeType: pendingImage.mimeType }
      : undefined;

    const hasImg = !!pendingImage;

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
    setHasImageRequest(hasImg);
    setIsRetrying(false);

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
        abortRef.current.signal,
        (attempt, reason) => {
          if (reason === "rate_limit") {
            setIsRetrying(true);
          }
        }
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

      // Ministry logging
      const iqScore = calculateIQ(responseText);
      const topic = extractTopic(userMessage.content);
      const vault = await getMemoryVault();
            const { data: dbData, error: dbError } = await supabase
        .from('student_metrics') 
        .insert([
          { 
            student_name: vault.name || "Anonymous",
            topic: topic, 
            logic_score: iqScore,
          }
        ]);

      if (dbError) {
        console.error("Direct logging error:", dbError.message);
      }


      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error: any) {
      if (
        error?.name === "AbortError" ||
        error?.message === "Request cancelled"
      ) {
        setIsLoading(false);
        setIsRetrying(false);
        return;
      }

      if (error?.message === "NO_API_KEY") {
        setNoKeyError(true);
        const keyMsg: Message = {
          id: generateId(),
          role: "assistant",
          content:
            "To use GARY, you need a free Gemini API key. Head to the Settings tab and paste your key from **aistudio.google.com/app/apikey** — it's free and takes 30 seconds.",
          timestamp: Date.now(),
        };
        const updatedMessages = [...newMessages, keyMsg];
        setMessages(updatedMessages);
        setIsLoading(false);
        setIsRetrying(false);
        return;
      }

      const errorMessage: Message = {
        id: generateId(),
        role: "assistant",
        content:
          "Connection issue. Check your signal and try again — I'm still here.",
        timestamp: Date.now(),
      };
      const updatedMessages = [...newMessages, errorMessage];
      setMessages(updatedMessages);
      await saveConversation(updatedMessages);
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
      setHasImageRequest(false);
    }
  };

  const cancelRequest = () => {
    abortRef.current?.abort();
    setIsLoading(false);
    setIsRetrying(false);
  };

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => <ChatBubble message={item} />,
    []
  );

  const keyExtractor = useCallback((item: Message) => item.id, []);

  const canSend =
    (inputText.trim().length > 0 || pendingImage !== null) && !isLoading;

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
              borderColor: "rgba(0, 170, 255, 0.25)",
              backgroundColor: "rgba(0, 170, 255, 0.05)",
              opacity: pressed ? 0.6 : 1,
            },
          ]}
          testID="button-new-chat"
        >
          <Feather name="plus" size={13} color={theme.accent} />
          <Text
            style={[
              styles.headerBtnText,
              { color: theme.accent, fontFamily: Fonts.monoBold },
            ]}
          >
            new
          </Text>
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
            icon="terminal"
            title="// ask gary anything"
            subtitle="Feynman Technique. No limits. Every answer ends with a Summary, Reflexion Questions, and a Book."
          />
        }
        ListFooterComponent={
          isLoading ? (
            <View style={styles.loadingWrapper}>
              <RecalibratingIndicator visible={isRetrying} />
              <LoadingDots isImage={hasImageRequest && !isRetrying} />
              <Pressable
                onPress={cancelRequest}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.4 : 0.6,
                  padding: Spacing.xs,
                  marginLeft: Spacing.sm,
                })}
                testID="button-cancel"
              >
                <Feather name="x-circle" size={14} color={theme.textSecondary} />
              </Pressable>
            </View>
          ) : null
        }
      />

      {pendingImage ? (
        <View
          style={[
            styles.imagePreviewBar,
            {
              backgroundColor: theme.backgroundSecondary,
              borderTopColor: "rgba(0, 170, 255, 0.12)",
            },
          ]}
        >
          <Feather name="image" size={13} color={theme.accent} />
          <Text
            style={[
              styles.imagePreviewText,
              { color: theme.textSecondary, fontFamily: Fonts.mono },
            ]}
          >
            image attached — ready to analyze
          </Text>
          <Pressable
            onPress={() => setPendingImage(null)}
            style={({ pressed }) => ({ opacity: pressed ? 0.4 : 1 })}
            testID="button-remove-image"
          >
            <Feather name="x" size={13} color={theme.error} />
          </Pressable>
        </View>
      ) : null}

      <View style={styles.inputWrapper}>
        {Platform.OS === "ios" ? (
          <BlurView
            intensity={80}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        <View
          style={[
            styles.inputContainer,
            {
              paddingBottom: tabBarHeight + insets.bottom + Spacing.sm,
              backgroundColor:
                Platform.OS === "ios"
                  ? "transparent"
                  : "rgba(3, 5, 12, 0.95)",
              borderTopColor: "rgba(0, 170, 255, 0.12)",
            },
          ]}
        >
          <Pressable
            onPress={pickImage}
            style={({ pressed }) => [
              styles.iconBtn,
              {
                borderColor: "rgba(0, 170, 255, 0.18)",
                backgroundColor: "rgba(0, 170, 255, 0.04)",
                opacity: pressed ? 0.5 : 1,
              },
            ]}
            testID="button-pick-image"
          >
            <Feather name="image" size={16} color={theme.textSecondary} />
          </Pressable>

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: "rgba(10, 15, 28, 0.85)",
                color: theme.text,
                borderColor: "rgba(0, 170, 255, 0.15)",
                fontFamily: Fonts.mono,
              },
            ]}
            placeholder="// type here..."
            placeholderTextColor={theme.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={4000}
            testID="input-message"
          />

          <Pressable
            onPress={sendMessage}
            disabled={!canSend}
            style={({ pressed }) => [
              styles.sendButton,
              {
                backgroundColor: canSend
                  ? theme.accent
                  : "rgba(0, 170, 255, 0.06)",
                borderColor: canSend
                  ? theme.accent
                  : "rgba(0, 170, 255, 0.15)",
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            testID="button-send"
          >
            <Feather
              name="send"
              size={16}
              color={canSend ? theme.buttonText : theme.textSecondary}
            />
          </Pressable>
        </View>
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
    paddingVertical: 6,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
  },
  headerBtnText: {
    fontSize: 12,
    letterSpacing: 0.5,
  },
  messageList: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
  },
  loadingWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.lg,
    paddingLeft: Spacing.lg,
    gap: Spacing.xs,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  loadingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  loadingDots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    borderLeftWidth: 2,
    paddingLeft: Spacing.md,
  },
  dot: {
    fontSize: 22,
    lineHeight: 26,
    fontFamily: "SpaceMono_700Bold",
  },
  loadingLabel: {
    fontSize: 12,
    opacity: 0.8,
  },
  recalibrating: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  recalibIcon: {
    width: 26,
    height: 26,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  recalibIconText: {
    fontSize: 11,
    color: "#000000",
  },
  recalibText: {
    fontSize: 12,
    flex: 1,
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
    fontSize: 12,
  },
  inputWrapper: {
    position: "relative",
    overflow: "hidden",
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 170, 255, 0.12)",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginBottom: 1,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 110,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    lineHeight: 20,
    borderWidth: 1,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginBottom: 1,
  },
});
