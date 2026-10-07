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
          position: "absolute",
          left: 18,
          right: 18,
          bottom: Math.max(insets.bottom, 12),
          height: 64,
          borderRadius: 32,
          backgroundColor: "rgba(15, 20, 26, 0.94)",
          borderColor: "rgba(215, 230, 250, 0.12)",
          borderWidth: 1,
          paddingHorizontal: 8,
          paddingBottom: 6,
          paddingTop: 6,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.45,
          shadowRadius: 20,
          elevation: 12,
        },
        tabBarActiveTintColor: "#D49B35",
        tabBarInactiveTintColor: "#76889B",
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          letterSpacing: -0.1,
          marginTop: -2,
        },
        tabBarItemStyle: {
          paddingVertical: 3,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dispatch",
          tabBarIcon: ({ color, focused }) => (
            <View
              className={`items-center justify-center w-12 h-7 rounded-full ${
                focused ? "bg-surface-container-high/90 border border-outline/30" : ""
              }`}
            >
              <Home size={19} color={color} strokeWidth={focused ? 2.4 : 1.9} />
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
            <View
              className={`items-center justify-center w-12 h-7 rounded-full ${
                focused ? "bg-surface-container-high/90 border border-outline/30" : ""
              }`}
            >
              <Users size={19} color={color} strokeWidth={focused ? 2.4 : 1.9} />
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
            <View
              className={`items-center justify-center w-12 h-7 rounded-full ${
                focused ? "bg-surface-container-high/90 border border-outline/30" : ""
              }`}
            >
              <View className="relative">
                <Bell size={19} color={color} strokeWidth={focused ? 2.4 : 1.9} />
                {unreadCount > 0 && (
                  <View className="absolute -top-1.5 -right-2 bg-error rounded-full min-w-[15px] h-[15px] px-1 items-center justify-center border border-[#0A0D10]">
                    <Typography
                      variant="label-sm"
                      className="text-white text-[8px] font-extrabold leading-none text-center"
                    >
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </Typography>
                  </View>
                )}
              </View>
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
            <View
              className={`items-center justify-center w-12 h-7 rounded-full ${
                focused ? "bg-surface-container-high/90 border border-outline/30" : ""
              }`}
            >
              <User size={19} color={color} strokeWidth={focused ? 2.4 : 1.9} />
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
