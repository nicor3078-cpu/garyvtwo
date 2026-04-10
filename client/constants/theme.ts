import { Platform } from "react-native";

const accentColor = "#00AAFF";
const accentColorDim = "#0066BB";

export const Colors = {
  light: {
    text: "#E2E8F8",
    textSecondary: "#7A8CAF",
    buttonText: "#000000",
    tabIconDefault: "#3A5070",
    tabIconSelected: accentColor,
    link: accentColor,
    accent: accentColor,
    accentDim: accentColorDim,
    accentGlow: "rgba(0, 170, 255, 0.12)",
    backgroundRoot: "#000000",
    backgroundDefault: "#050810",
    backgroundSecondary: "#0C1220",
    backgroundTertiary: "#131B2E",
    border: "#1A2540",
    userBubble: "rgba(0, 170, 255, 0.07)",
    userBubbleBorder: "rgba(0, 170, 255, 0.22)",
    assistantBubble: "transparent",
    error: "#FF4D6A",
    success: "#00D4AA",
    warning: "#FFB800",
    codeBg: "#030508",
  },
  dark: {
    text: "#E2E8F8",
    textSecondary: "#7A8CAF",
    buttonText: "#000000",
    tabIconDefault: "#3A5070",
    tabIconSelected: accentColor,
    link: accentColor,
    accent: accentColor,
    accentDim: accentColorDim,
    accentGlow: "rgba(0, 170, 255, 0.12)",
    backgroundRoot: "#000000",
    backgroundDefault: "#050810",
    backgroundSecondary: "#0C1220",
    backgroundTertiary: "#131B2E",
    border: "#1A2540",
    userBubble: "rgba(0, 170, 255, 0.07)",
    userBubbleBorder: "rgba(0, 170, 255, 0.22)",
    assistantBubble: "transparent",
    error: "#FF4D6A",
    success: "#00D4AA",
    warning: "#FFB800",
    codeBg: "#030508",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 48,
  buttonHeight: 52,
};

export const BorderRadius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  "2xl": 36,
  "3xl": 48,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700" as const,
    fontFamily: "SpaceMono_700Bold",
  },
  h2: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "700" as const,
    fontFamily: "SpaceMono_700Bold",
  },
  h3: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700" as const,
    fontFamily: "SpaceMono_700Bold",
  },
  h4: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "700" as const,
    fontFamily: "SpaceMono_700Bold",
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "400" as const,
    fontFamily: "SpaceMono_400Regular",
  },
  small: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "400" as const,
    fontFamily: "SpaceMono_400Regular",
  },
  link: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "400" as const,
    fontFamily: "SpaceMono_400Regular",
  },
};

export const Fonts = {
  mono: "SpaceMono_400Regular",
  monoBold: "SpaceMono_700Bold",
  fallbackMono: Platform.select({
    ios: "Menlo",
    android: "monospace",
    default: "monospace",
  }),
};
