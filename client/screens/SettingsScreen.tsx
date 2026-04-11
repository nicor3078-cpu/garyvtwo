import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  Linking,
  Platform,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { Colors, Spacing, BorderRadius, Fonts } from "@/constants/theme";
import {
  getUserApiKey,
  setUserApiKey,
  clearUserApiKey,
  getMemoryVault,
  saveMemoryVault,
  MemoryVault,
} from "@/lib/storage";
import { validateApiKey } from "@/lib/gemini";

const AI_STUDIO_URL = "https://aistudio.google.com/app/apikey";

export default function SettingsScreen() {
  const theme = Colors.dark;
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();

  const [apiKey, setApiKey] = useState("");
  const [savedApiKey, setSavedApiKey] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [keyStatus, setKeyStatus] = useState<"idle" | "valid" | "invalid">("idle");

  const [memory, setMemory] = useState<MemoryVault>({
    name: "",
    birthday: "",
    interests: "",
    grade: "",
  });
  const [isSavingMemory, setIsSavingMemory] = useState(false);
  const [memorySaved, setMemorySaved] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const [key, vault] = await Promise.all([getUserApiKey(), getMemoryVault()]);
    setSavedApiKey(key);
    if (key) setApiKey(key);
    setMemory(vault);
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) return;
    setIsValidating(true);
    setKeyStatus("idle");

    const valid = await validateApiKey(apiKey.trim());
    if (valid) {
      await setUserApiKey(apiKey.trim());
      setSavedApiKey(apiKey.trim());
      setKeyStatus("valid");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else {
      setKeyStatus("invalid");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
    setIsValidating(false);
  };

  const handleClearApiKey = async () => {
    await clearUserApiKey();
    setSavedApiKey(null);
    setApiKey("");
    setKeyStatus("idle");
  };

  const handleSaveMemory = async () => {
    setIsSavingMemory(true);
    await saveMemoryVault(memory);
    setIsSavingMemory(false);
    setMemorySaved(true);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setTimeout(() => setMemorySaved(false), 2500);
  };

  const openAiStudio = () => {
    Linking.openURL(AI_STUDIO_URL);
  };

  const maskedKey = savedApiKey
    ? `${savedApiKey.slice(0, 8)}${"*".repeat(20)}${savedApiKey.slice(-4)}`
    : null;

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl,
        },
      ]}
    >
      {/* ── SOVEREIGN KEY ────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Feather name="key" size={15} color={theme.accent} />
          <Text style={[styles.sectionTitle, { color: theme.accent, fontFamily: Fonts.monoBold }]}>
            Sovereign Key
          </Text>
        </View>

        <Text style={[styles.sectionDesc, { color: theme.textSecondary, fontFamily: Fonts.mono }]}>
          Your personal Gemini API key gives you unlimited, private access to GARY. Without one, Gary is silent.
        </Text>

        {/* AI Studio link */}
        <Pressable
          onPress={openAiStudio}
          style={({ pressed }) => [styles.linkRow, { opacity: pressed ? 0.6 : 1 }]}
          testID="button-ai-studio-link"
        >
          <Feather name="external-link" size={13} color={theme.accent} />
          <Text style={[styles.linkText, { color: theme.accent, fontFamily: Fonts.mono }]}>
            Get your free key from Google AI Studio
          </Text>
        </Pressable>

        {/* Saved key badge */}
        {savedApiKey ? (
          <View
            style={[
              styles.savedKeyRow,
              {
                backgroundColor: "rgba(0, 212, 170, 0.06)",
                borderColor: theme.success,
              },
            ]}
          >
            <Feather name="check-circle" size={13} color={theme.success} />
            <Text
              style={[styles.maskedKey, { color: theme.text, fontFamily: Fonts.mono }]}
              numberOfLines={1}
            >
              {maskedKey}
            </Text>
            <Pressable
              onPress={handleClearApiKey}
              style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
              testID="button-clear-api-key"
            >
              <Feather name="trash-2" size={13} color={theme.error} />
            </Pressable>
          </View>
        ) : null}

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.backgroundSecondary,
              color: theme.text,
              borderColor:
                keyStatus === "valid"
                  ? theme.success
                  : keyStatus === "invalid"
                  ? theme.error
                  : theme.border,
              fontFamily: Fonts.mono,
            },
          ]}
          placeholder="Paste your Gemini API key..."
          placeholderTextColor={theme.textSecondary}
          value={apiKey}
          onChangeText={(t) => {
            setApiKey(t);
            setKeyStatus("idle");
          }}
          autoCapitalize="none"
          autoCorrect={false}
          testID="input-api-key"
        />

        {keyStatus === "valid" ? (
          <Text style={[styles.statusText, { color: theme.success, fontFamily: Fonts.mono }]}>
            key verified and saved
          </Text>
        ) : keyStatus === "invalid" ? (
          <Text style={[styles.statusText, { color: theme.error, fontFamily: Fonts.mono }]}>
            invalid key — double-check and retry
          </Text>
        ) : null}

        <Pressable
          onPress={handleSaveApiKey}
          disabled={isValidating || !apiKey.trim()}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor:
                apiKey.trim() && !isValidating
                  ? theme.accent
                  : theme.backgroundTertiary,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
          testID="button-save-api-key"
        >
          {isValidating ? (
            <ActivityIndicator size="small" color={theme.backgroundRoot} />
          ) : (
            <>
              <Feather
                name="check"
                size={15}
                color={
                  apiKey.trim() && !isValidating
                    ? theme.buttonText
                    : theme.textSecondary
                }
              />
              <Text
                style={[
                  styles.buttonText,
                  {
                    color:
                      apiKey.trim() && !isValidating
                        ? theme.buttonText
                        : theme.textSecondary,
                    fontFamily: Fonts.monoBold,
                  },
                ]}
              >
                validate + save key
              </Text>
            </>
          )}
        </Pressable>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      {/* ── MEMORY VAULT ─────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Feather name="user" size={15} color={theme.accent} />
          <Text style={[styles.sectionTitle, { color: theme.accent, fontFamily: Fonts.monoBold }]}>
            Memory Vault
          </Text>
        </View>
        <Text style={[styles.sectionDesc, { color: theme.textSecondary, fontFamily: Fonts.mono }]}>
          Tell Gary who you are. He'll personalize every explanation to match your level, interests, and life.
        </Text>

        <Text style={[styles.label, { color: theme.textSecondary, fontFamily: Fonts.mono }]}>
          your name
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.backgroundSecondary,
              color: theme.text,
              borderColor: theme.border,
              fontFamily: Fonts.mono,
            },
          ]}
          placeholder="e.g. Alex"
          placeholderTextColor={theme.textSecondary}
          value={memory.name}
          onChangeText={(t) => setMemory((m) => ({ ...m, name: t }))}
          testID="input-name"
        />

        <Text style={[styles.label, { color: theme.textSecondary, fontFamily: Fonts.mono }]}>
          grade / level
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.backgroundSecondary,
              color: theme.text,
              borderColor: theme.border,
              fontFamily: Fonts.mono,
            },
          ]}
          placeholder="e.g. Grade 10, University Year 2, Self-taught"
          placeholderTextColor={theme.textSecondary}
          value={memory.grade}
          onChangeText={(t) => setMemory((m) => ({ ...m, grade: t }))}
          testID="input-grade"
        />

        <Text style={[styles.label, { color: theme.textSecondary, fontFamily: Fonts.mono }]}>
          birthday (optional)
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.backgroundSecondary,
              color: theme.text,
              borderColor: theme.border,
              fontFamily: Fonts.mono,
            },
          ]}
          placeholder="e.g. March 15"
          placeholderTextColor={theme.textSecondary}
          value={memory.birthday}
          onChangeText={(t) => setMemory((m) => ({ ...m, birthday: t }))}
          testID="input-birthday"
        />

        <Text style={[styles.label, { color: theme.textSecondary, fontFamily: Fonts.mono }]}>
          interests & hobbies
        </Text>
        <TextInput
          style={[
            styles.input,
            styles.multilineInput,
            {
              backgroundColor: theme.backgroundSecondary,
              color: theme.text,
              borderColor: theme.border,
              fontFamily: Fonts.mono,
            },
          ]}
          placeholder="e.g. basketball, gaming, music production..."
          placeholderTextColor={theme.textSecondary}
          value={memory.interests}
          onChangeText={(t) => setMemory((m) => ({ ...m, interests: t }))}
          multiline
          numberOfLines={3}
          testID="input-interests"
        />

        <Pressable
          onPress={handleSaveMemory}
          disabled={isSavingMemory}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: memorySaved ? theme.success : theme.accent,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
          testID="button-save-memory"
        >
          {isSavingMemory ? (
            <ActivityIndicator size="small" color={theme.backgroundRoot} />
          ) : (
            <>
              <Feather
                name={memorySaved ? "check" : "save"}
                size={15}
                color={theme.buttonText}
              />
              <Text
                style={[
                  styles.buttonText,
                  { color: theme.buttonText, fontFamily: Fonts.monoBold },
                ]}
              >
                {memorySaved ? "saved to vault" : "save to memory vault"}
              </Text>
            </>
          )}
        </Pressable>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      {/* ── ABOUT ────────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Feather name="terminal" size={15} color={theme.textSecondary} />
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.textSecondary, fontFamily: Fonts.monoBold },
            ]}
          >
            About Gary
          </Text>
        </View>
        <Text style={[styles.aboutText, { color: theme.textSecondary, fontFamily: Fonts.mono }]}>
          GARY is an elite polymath mentor powered by the Feynman Technique. Every answer ends with a Dad's Summary, Reflexion Questions, and a Book Recommendation.
        </Text>
        <Text style={[styles.aboutText, { color: theme.textSecondary, fontFamily: Fonts.mono }]}>
          Powered by Google Gemini (model: dynamic via remote config).
        </Text>
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  section: {
    gap: Spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 13,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  sectionDesc: {
    fontSize: 13,
    lineHeight: 21,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  linkText: {
    fontSize: 13,
    textDecorationLine: "underline",
  },
  label: {
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: -Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 13,
    minHeight: 46,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    height: 46,
    borderRadius: BorderRadius.xs,
  },
  buttonText: {
    fontSize: 13,
  },
  savedKeyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: BorderRadius.xs,
    padding: Spacing.md,
  },
  maskedKey: {
    flex: 1,
    fontSize: 12,
  },
  statusText: {
    fontSize: 12,
    marginTop: -Spacing.xs,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.xl,
    opacity: 0.3,
  },
  aboutText: {
    fontSize: 13,
    lineHeight: 21,
  },
  backgroundTertiary: {},
});
