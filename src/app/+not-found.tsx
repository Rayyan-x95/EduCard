import { View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Typography } from "@/components/ui/Typography";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AppHaptics } from "@/lib/haptics";
import { Compass } from "lucide-react-native";

export default function NotFoundScreen() {
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-1 items-center justify-center px-6">
        <Card className="p-8 items-center border border-outline-variant/60 shadow-lg max-w-[420px] w-full">
          <View className="w-16 h-16 rounded-2xl bg-primary-container/30 border border-primary/30 items-center justify-center mb-4">
            <Compass size={32} color="#818CF8" />
          </View>
          <Typography variant="headline-md" className="text-on-surface text-center font-bold mb-2">
            Page not found
          </Typography>
          <Typography variant="body-md" className="text-on-surface-variant text-center leading-relaxed mb-6">
            This link may be broken, the page was removed, or you followed an outdated bookmark.
          </Typography>
          <Button
            variant="primary"
            size="md"
            onPress={() => {
              AppHaptics.light();
              router.replace("/(tabs)" as any);
            }}
          >
            Go to Feed
          </Button>
        </Card>
      </View>
    </SafeAreaView>
  );
}
