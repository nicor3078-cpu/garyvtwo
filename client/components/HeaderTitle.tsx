import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";

import { Colors, Fonts, Spacing } from "@/constants/theme";

interface HeaderTitleProps {
  title: string;
}

export function HeaderTitle({ title }: HeaderTitleProps) {
  const theme = Colors.dark;

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/icon.png")}
        style={styles.icon}
        resizeMode="contain"
      />
      <Text
        style={[
          styles.title,
          { color: theme.accent, fontFamily: Fonts.monoBold },
        ]}
      >
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  icon: {
    width: 26,
    height: 26,
    borderRadius: 4,
  },
  title: {
    fontSize: 17,
    letterSpacing: 0.5,
  },
});
