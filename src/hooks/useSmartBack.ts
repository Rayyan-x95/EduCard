import { useRouter } from "expo-router";
import { useCallback } from "react";
import { AppHaptics } from "@/lib/haptics";

export function useSmartBack(fallbackRoute: string = "/(tabs)") {
  const router = useRouter();

  return useCallback(() => {
    AppHaptics.light();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(fallbackRoute as any);
    }
  }, [router, fallbackRoute]);
}
