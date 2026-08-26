import React from "react";
import { Tabs, useRouter } from "expo-router";
import { View, TouchableOpacity } from "react-native";
import { Home, Users, Plus, Bell, User } from "lucide-react-native";
import { AppHaptics } from "@/lib/haptics";

export default function TabLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0D1115",
          borderTopColor: "rgba(255, 255, 255, 0.08)",
          borderTopWidth: 1,
          height: 66,
          paddingBottom: 10,
          paddingTop: 8,
          elevation: 8,
        },
        tabBarActiveTintColor: "#818CF8",
        tabBarInactiveTintColor: "#64748B",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          letterSpacing: 0.1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center">
              <Home size={22} color={color} strokeWidth={focused ? 2.4 : 2} />
              {focused && (
                <View className="w-1.5 h-1.5 rounded-full bg-primary mt-1 shadow-sm shadow-primary" />
              )}
            </View>
          ),
        }}
        listeners={{
          tabPress: () => AppHaptics.light(),
        }}
      />
      <Tabs.Screen
        name="communities"
        options={{
          title: "Spaces",
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center">
              <Users size={22} color={color} strokeWidth={focused ? 2.4 : 2} />
              {focused && (
                <View className="w-1.5 h-1.5 rounded-full bg-primary mt-1 shadow-sm shadow-primary" />
              )}
            </View>
          ),
        }}
        listeners={{
          tabPress: () => AppHaptics.light(),
        }}
      />
      <Tabs.Screen
        name="ask-placeholder"
        options={{
          title: "Ask",
          tabBarIcon: () => (
            <View className="w-12 h-12 rounded-full bg-primary items-center justify-center -mt-4 border-2 border-primary-light/40 shadow-lg shadow-primary/40">
              <Plus size={24} color="#0F172A" strokeWidth={2.8} />
            </View>
          ),
          tabBarButton: (props) => (
            <TouchableOpacity
              {...(props as any)}
              activeOpacity={0.85}
              onPress={() => {
                AppHaptics.medium();
                router.push("/question/new" as any);
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Alerts",
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center">
              <Bell size={22} color={color} strokeWidth={focused ? 2.4 : 2} />
              {focused && (
                <View className="w-1.5 h-1.5 rounded-full bg-primary mt-1 shadow-sm shadow-primary" />
              )}
            </View>
          ),
        }}
        listeners={{
          tabPress: () => AppHaptics.light(),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center">
              <User size={22} color={color} strokeWidth={focused ? 2.4 : 2} />
              {focused && (
                <View className="w-1.5 h-1.5 rounded-full bg-primary mt-1 shadow-sm shadow-primary" />
              )}
            </View>
          ),
        }}
        listeners={{
          tabPress: () => AppHaptics.light(),
        }}
      />
    </Tabs>
  );
}
