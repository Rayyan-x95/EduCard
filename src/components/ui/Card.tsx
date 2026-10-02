import React from "react";
import { View, ViewProps, Pressable } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { cn } from "@/lib/cn";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface CardProps extends ViewProps {
  onPress?: () => void;
  className?: string;
  isSolved?: boolean;
  children: React.ReactNode;
}

function PressableCard({
  onPress,
  className,
  cardStyles,
  children,
  ...props
}: CardProps & { cardStyles: string }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        // eslint-disable-next-line react-hooks/immutability
        scale.value = withSpring(0.99, { damping: 24, stiffness: 450 });
      }}
      onPressOut={() => {
        // eslint-disable-next-line react-hooks/immutability
        scale.value = withSpring(1, { damping: 24, stiffness: 450 });
      }}
      accessibilityRole="button"
      style={animatedStyle}
      className={cn(
        cardStyles,
        "active:border-primary/40 active:bg-surface-container-high/90 web:cursor-pointer web:transition-colors duration-150",
        className
      )}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
}

export function Card({ onPress, className, isSolved = false, children, ...props }: CardProps) {
  // Apple iOS / Material 3 Luxury Elevation & Depth with Glass Borders
  const cardStyles = cn(
    "rounded-2xl p-5 mb-4 shadow-md backdrop-blur-sm",
    isSolved
      ? "bg-tertiary-container/15 border border-tertiary/40 border-t-tertiary/60 shadow-tertiary/10"
      : "bg-surface-container border border-white/[0.08] border-t-white/[0.16] shadow-black/30 web:hover:border-white/[0.18]"
  );

  if (onPress) {
    return (
      <PressableCard
        onPress={onPress}
        className={className}
        cardStyles={cardStyles}
        isSolved={isSolved}
        {...props}
      >
        {children}
      </PressableCard>
    );
  }

  return (
    <View className={cn(cardStyles, className)} {...props}>
      {children}
    </View>
  );
}
