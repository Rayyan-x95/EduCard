import React from "react";
import { Tabs } from "expo-router";
import { View, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
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
          alignSelf: "center",
          left: 16,
          right: 16,
          bottom: Math.max(insets.bottom, 24),
          height: 64,
          borderRadius: 32,
          backgroundColor: "rgba(18, 18, 18, 0.45)", // Glass dark overlay
          borderColor: "rgba(255, 255, 255, 0.12)",
          borderWidth: 1.5,
          paddingHorizontal: 12,
          paddingBottom: 6,
          paddingTop: 6,
          elevation: 0,
          overflow: "hidden", // Keep the blur inside the border radius
        },
        tabBarBackground: () => (
          <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
        ),
        tabBarActiveTintColor: "#FFFFFF",
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
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <View
              className={`items-center justify-center w-12 h-8 rounded-full transition-colors ${
                focused ? "bg-[#00FF9D]" : ""
              }`}
            >
              <Home size={19} color={focused ? "#000000" : color} strokeWidth={focused ? 2.5 : 2} />
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
          title: "Communities",
          tabBarIcon: ({ color, focused }) => (
            <View
              className={`items-center justify-center w-12 h-8 rounded-full transition-colors ${
                focused ? "bg-[#00FF9D]" : ""
              }`}
            >
              <Users size={19} color={focused ? "#000000" : color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
        listeners={{
          tabPress: () => AppHaptics.light(),
        }}
      />

      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notifications",
          tabBarIcon: ({ color, focused }) => (
            <View
              className={`items-center justify-center w-12 h-8 rounded-full transition-colors ${
                focused ? "bg-[#00FF9D]" : ""
              }`}
            >
              <View className="relative">
                <Bell size={19} color={focused ? "#000000" : color} strokeWidth={focused ? 2.5 : 2} />
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
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <View
              className={`items-center justify-center w-12 h-8 rounded-full transition-colors ${
                focused ? "bg-[#00FF9D]" : ""
              }`}
            >
              <User size={19} color={focused ? "#000000" : color} strokeWidth={focused ? 2.5 : 2} />
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
