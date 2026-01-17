import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import MainTabNavigator from "@/navigation/MainTabNavigator";
import TopicDetailScreen from "@/screens/TopicDetailScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

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

export type RootStackParamList = {
  Main: undefined;
  TopicDetail: { conversation: Conversation };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions({ transparent: false });

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Main"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TopicDetail"
        component={TopicDetailScreen}
        options={({ route }) => ({
          title: route.params.conversation.title.slice(0, 25) + (route.params.conversation.title.length > 25 ? "..." : ""),
        })}
      />
    </Stack.Navigator>
  );
}
