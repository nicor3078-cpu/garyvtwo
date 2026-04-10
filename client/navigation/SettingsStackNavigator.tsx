import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet } from "react-native";

import SettingsScreen from "@/screens/SettingsScreen";
import { Colors } from "@/constants/theme";

export type SettingsStackParamList = {
  Settings: undefined;
};

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export default function SettingsStackNavigator() {
  const theme = Colors.dark;

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: Platform.select({
            ios: "transparent",
            default: theme.backgroundRoot,
          }),
        } as any,
        headerTransparent: Platform.OS === "ios",
        headerBackground:
          Platform.OS === "ios"
            ? () => (
                <BlurView
                  intensity={80}
                  tint="dark"
                  style={StyleSheet.absoluteFill}
                />
              )
            : undefined,
        headerTintColor: theme.text,
        headerTitleStyle: {
          color: theme.text,
          fontWeight: "700",
          fontSize: 17,
        },
        contentStyle: { backgroundColor: theme.backgroundRoot },
      }}
    >
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: "Settings" }}
      />
    </Stack.Navigator>
  );
}
