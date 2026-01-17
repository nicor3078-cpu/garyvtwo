import { Colors } from "@/constants/theme";

export function useTheme() {
  // Always use dark theme for GARY app
  const isDark = true;
  const theme = Colors.dark;

  return {
    theme,
    isDark,
  };
}
