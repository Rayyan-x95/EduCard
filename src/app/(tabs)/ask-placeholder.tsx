import { View } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import React from "react";

/**
 * Ask tab placeholder. The tab bar overrides the press handler to push the
 * question composer modal directly (see (tabs)/_layout.tsx), so this screen
 * only renders if someone deep-links to /(tabs)/ask-placeholder — in which
 * case we immediately route them onward.
 */
export default function AskPlaceholderScreen() {
  const router = useRouter();

  useFocusEffect(
    React.useCallback(() => {
      // Small delay lets the tab transition settle before pushing the modal.
      const t = setTimeout(() => {
        router.push("/question/new" as any);
      }, 50);
      return () => clearTimeout(t);
    }, [router])
  );

  return <View className="flex-1 bg-surface" />;
}
