import { Platform } from "react-native";

const accentColor = "#00AAFF";
const accentColorDim = "#0066BB";

export const Colors = {
  light: {
    text: "#FFFFFF",
    textSecondary: "#8A9BB5",
    buttonText: "#000000",
    tabIconDefault: "#4A6080",
    tabIconSelected: accentColor,
    link: accentColor,
    accent: accentColor,
    accentDim: accentColorDim,
    accentGlow: "rgba(0, 170, 255, 0.15)",
    backgroundRoot: "#0A0E18",
    backgroundDefault: "#0F1525",
    backgroundSecondary: "#151D30",
    backgroundTertiary: "#1C2740",
    border: "#1E2D45",
    userBubble: "#0D1E3A",
    assistantBubble: "#0F1525",
    error: "#FF4D6A",
    success: "#00D4AA",
    warning: "#FFB800",
    codeBg: "#060D1A",
  },
  dark: {
    text: "#FFFFFF",
    textSecondary: "#8A9BB5",
    buttonText: "#000000",
    tabIconDefault: "#4A6080",
    tabIconSelected: accentColor,
    link: accentColor,
    accent: accentColor,
    accentDim: accentColorDim,
    accentGlow: "rgba(0, 170, 255, 0.15)",
    backgroundRoot: "#0A0E18",
    backgroundDefault: "#0F1525",
    backgroundSecondary: "#151D30",
    backgroundTertiary: "#1C2740",
    border: "#1E2D45",
    userBubble: "#0D1E3A",
    assistantBubble: "#0F1525",
    error: "#FF4D6A",
    success: "#00D4AA",
    warning: "#FFB800",
    codeBg: "#060D1A",
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
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 30,
  "2xl": 40,
  "3xl": 50,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400" as const,
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
