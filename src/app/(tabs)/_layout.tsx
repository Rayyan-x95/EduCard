import React from "react";
import { Tabs } from "expo-router";
import { View } from "react-native";
import { Home, Users, Bell, User } from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { AppHaptics } from "@/lib/haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { queryKeys } from "@/lib/query-client";
import { NotificationsService } from "@/services/notifications";
import { useAuthStore } from "@/stores/authStore";
import { Typography } from "@/components/ui/Typography";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);

  const { data: unreadCount = 0 } = useQuery({
    queryKey: queryKeys.unreadNotificationsCount(),
    queryFn: () => NotificationsService.getUnreadCount(),
    enabled: Boolean(user?.id),
  });

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "rgba(10, 13, 16, 0.96)",
          borderTopColor: "rgba(255, 255, 255, 0.07)",
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: 6 + insets.bottom,
          paddingTop: 8,
          elevation: 8,
        },
        tabBarActiveTintColor: "#D49B35",
        tabBarInactiveTintColor: "#6D7E92",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          letterSpacing: -0.1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dispatch",
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center">
              <Home size={21} color={color} strokeWidth={focused ? 2.4 : 1.9} />
              {focused && (
                <View className="w-1 h-1 rounded-full bg-primary mt-1 shadow-sm shadow-primary/40" />
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
          title: "Guilds",
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center">
              <Users size={21} color={color} strokeWidth={focused ? 2.4 : 1.9} />
              {focused && (
                <View className="w-1 h-1 rounded-full bg-primary mt-1 shadow-sm shadow-primary/40" />
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
          href: null,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Alerts",
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center">
              <View className="relative">
                <Bell size={21} color={color} strokeWidth={focused ? 2.4 : 1.9} />
                {unreadCount > 0 && (
                  <View className="absolute -top-1.5 -right-2.5 bg-error rounded-full min-w-[16px] h-[16px] px-1 items-center justify-center border border-[#0A0D10]">
                    <Typography
                      variant="label-sm"
                      className="text-white text-[9px] font-extrabold leading-none text-center"
                    >
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </Typography>
                  </View>
                )}
              </View>
              {focused && (
                <View className="w-1 h-1 rounded-full bg-primary mt-1 shadow-sm shadow-primary/40" />
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
          title: "Dossier",
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center">
              <User size={21} color={color} strokeWidth={focused ? 2.4 : 1.9} />
              {focused && (
                <View className="w-1 h-1 rounded-full bg-primary mt-1 shadow-sm shadow-primary/40" />
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
