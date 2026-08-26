import React, { useEffect, useState } from "react";
import { Animated, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Network from "expo-network";
import { Typography } from "./Typography";
import { WifiOff } from "lucide-react-native";
import { useUIStore } from "@/stores/uiStore";

/**
 * Connectivity indicator. expo-network on SDK 52 does not expose an
 * event listener (addNetworkStateListener arrives in SDK 54), so we use a
 * lightweight periodic check. Replace with the listener after upgrading.
 */
const POLL_INTERVAL_MS = 15_000;

export function OfflineBanner() {
  const { isOffline, setOffline } = useUIStore();
  const [fadeAnim] = useState(new Animated.Value(0));
  const insets = useSafeAreaInsets();

  useEffect(() => {
    let isMounted = true;

    const checkNetwork = async () => {
      try {
        const state = await Network.getNetworkStateAsync();
        if (isMounted) {
          setOffline(Boolean(!state.isConnected || !state.isInternetReachable));
        }
      } catch {
        // Unreachable — keep last known state.
      }
    };

    void checkNetwork();
    const interval = setInterval(checkNetwork, POLL_INTERVAL_MS);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [setOffline]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isOffline ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOffline, fadeAnim]);

  if (!isOffline) return null;

  // Rendered as an overlay pinned to the top of the safe area so its
  // appearance never shifts app content downward.
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: insets.top,
        left: 0,
        right: 0,
        zIndex: 1000,
      }}
    >
      <Animated.View
        accessibilityLiveRegion="polite"
        accessibilityRole="alert"
        style={{ opacity: fadeAnim }}
        className="bg-error-container border-b border-error px-4 py-2 flex-row items-center justify-center space-x-2"
      >
        <WifiOff size={16} color="#ffb4ab" />
        <Typography variant="label-sm" className="text-on-error-container font-semibold text-center">
          No Internet Connection
        </Typography>
      </Animated.View>
    </View>
  );
}
