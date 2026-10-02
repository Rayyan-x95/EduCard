import React from "react";
import { Tabs, useRouter } from "expo-router";
import { View, TouchableOpacity } from "react-native";
import { Home, Users, Plus, Bell, User } from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { AppHaptics } from "@/lib/haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { queryKeys } from "@/lib/query-client";
import { NotificationsService } from "@/services/notifications";
import { useAuthStore } from "@/stores/authStore";
import { Typography } from "@/components/ui/Typography";

export default function TabLayout() {
  const router = useRouter();
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
          backgroundColor: "rgba(11, 15, 18, 0.95)",
          borderTopColor: "rgba(255, 255, 255, 0.08)",
          borderTopWidth: 1,
          height: 64 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 8,
          elevation: 12,
        },
        tabBarActiveTintColor: "#818CF8",
        tabBarInactiveTintColor: "#64748B",
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
            <View className="w-12 h-12 rounded-full bg-primary items-center justify-center -mt-4 border-2 border-primary-light/50 shadow-xl shadow-primary/45 web:cursor-pointer select-none active:scale-95 transition-transform">
              <Plus size={24} color="#0F172A" strokeWidth={2.8} />
            </View>
          ),
          tabBarButton: (props) => (
            <TouchableOpacity
              {...(props as any)}
              activeOpacity={0.82}
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
              <View className="relative">
                <Bell size={22} color={color} strokeWidth={focused ? 2.4 : 2} />
                {unreadCount > 0 && (
                  <View className="absolute -top-1.5 -right-2.5 bg-error rounded-full min-w-[17px] h-[17px] px-1 items-center justify-center border border-[#0D1115]">
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
