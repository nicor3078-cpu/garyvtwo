import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import {
  getUserApiKey,
  setUserApiKey,
  clearUserApiKey,
  getMemoryVault,
  saveMemoryVault,
  MemoryVault,
} from "@/lib/storage";
import { validateApiKey } from "@/lib/gemini";

export default function SettingsScreen() {
  const theme = Colors.dark;
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();

  const [apiKey, setApiKey] = useState("");
  const [savedApiKey, setSavedApiKey] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [keyStatus, setKeyStatus] = useState<"idle" | "valid" | "invalid">(
    "idle"
  );

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
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Feather name="key" size={16} color={theme.accent} />
          <ThemedText style={[styles.sectionTitle, { color: theme.accent }]}>
            API Key (BYOAK)
          </ThemedText>
        </View>
        <ThemedText
          style={[styles.sectionDesc, { color: theme.textSecondary }]}
        >
          Use your own Gemini API key for unlimited access. Get one free at
          aistudio.google.com. Without a custom key, GARY uses the built-in
          shared pool.
        </ThemedText>

        {savedApiKey ? (
          <View
            style={[
              styles.savedKeyRow,
              { backgroundColor: theme.backgroundSecondary, borderColor: theme.success },
            ]}
          >
            <Feather name="check-circle" size={14} color={theme.success} />
            <ThemedText
              style={[styles.maskedKey, { color: theme.text }]}
              numberOfLines={1}
            >
              {maskedKey}
            </ThemedText>
            <Pressable
              onPress={handleClearApiKey}
              style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
              testID="button-clear-api-key"
            >
              <Feather name="trash-2" size={14} color={theme.error} />
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
            },
          ]}
          placeholder="Paste your Gemini API key here..."
          placeholderTextColor={theme.textSecondary}
          value={apiKey}
          onChangeText={(t) => {
            setApiKey(t);
            setKeyStatus("idle");
          }}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry={false}
          testID="input-api-key"
        />

        {keyStatus === "valid" ? (
          <ThemedText style={[styles.statusText, { color: theme.success }]}>
            API key saved and verified!
          </ThemedText>
        ) : keyStatus === "invalid" ? (
          <ThemedText style={[styles.statusText, { color: theme.error }]}>
            Invalid key. Check it and try again.
          </ThemedText>
        ) : null}

        <Pressable
          onPress={handleSaveApiKey}
          disabled={isValidating || !apiKey.trim()}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor:
                apiKey.trim() && !isValidating ? theme.accent : theme.backgroundTertiary,
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
                name="save"
                size={16}
                color={
                  apiKey.trim() && !isValidating
                    ? theme.buttonText
                    : theme.textSecondary
                }
              />
              <ThemedText
                style={[
                  styles.buttonText,
                  {
                    color:
                      apiKey.trim() && !isValidating
                        ? theme.buttonText
                        : theme.textSecondary,
                  },
                ]}
              >
                Validate & Save Key
              </ThemedText>
            </>
          )}
        </Pressable>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Feather name="user" size={16} color={theme.accent} />
          <ThemedText style={[styles.sectionTitle, { color: theme.accent }]}>
            Memory Vault
          </ThemedText>
        </View>
        <ThemedText
          style={[styles.sectionDesc, { color: theme.textSecondary }]}
        >
          Tell GARY about yourself so he can personalize his explanations and
          examples just for you.
        </ThemedText>

        <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
          Your Name
        </ThemedText>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border },
          ]}
          placeholder="e.g. Alex"
          placeholderTextColor={theme.textSecondary}
          value={memory.name}
          onChangeText={(t) => setMemory((m) => ({ ...m, name: t }))}
          testID="input-name"
        />

        <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
          Grade / Level
        </ThemedText>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border },
          ]}
          placeholder="e.g. Grade 10, University Year 2, Self-taught"
          placeholderTextColor={theme.textSecondary}
          value={memory.grade}
          onChangeText={(t) => setMemory((m) => ({ ...m, grade: t }))}
          testID="input-grade"
        />

        <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
          Birthday (optional)
        </ThemedText>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border },
          ]}
          placeholder="e.g. March 15"
          placeholderTextColor={theme.textSecondary}
          value={memory.birthday}
          onChangeText={(t) => setMemory((m) => ({ ...m, birthday: t }))}
          testID="input-birthday"
        />

        <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
          Interests & Hobbies
        </ThemedText>
        <TextInput
          style={[
            styles.input,
            styles.multilineInput,
            { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border },
          ]}
          placeholder="e.g. basketball, gaming, music production, cooking..."
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
                size={16}
                color={theme.buttonText}
              />
              <ThemedText style={[styles.buttonText, { color: theme.buttonText }]}>
                {memorySaved ? "Saved!" : "Save to Memory Vault"}
              </ThemedText>
            </>
          )}
        </Pressable>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Feather name="info" size={16} color={theme.textSecondary} />
          <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            About GARY V2
          </ThemedText>
        </View>
        <ThemedText style={[styles.aboutText, { color: theme.textSecondary }]}>
          GARY uses the Feynman Technique to make complex subjects simple.
          Every answer includes a Dad's Summary, Reflexion Questions to test
          your understanding, and a Book Recommendation to go deeper.
        </ThemedText>
        <ThemedText style={[styles.aboutText, { color: theme.textSecondary }]}>
          Powered by Google Gemini 2.5 Flash.
        </ThemedText>
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
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  sectionDesc: {
    fontSize: 13,
    lineHeight: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: -Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 15,
    minHeight: 48,
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
    height: 48,
    borderRadius: BorderRadius.xs,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "700",
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
    fontSize: 13,
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: -Spacing.xs,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.xl,
    opacity: 0.4,
  },
  aboutText: {
    fontSize: 13,
    lineHeight: 20,
  },
});
