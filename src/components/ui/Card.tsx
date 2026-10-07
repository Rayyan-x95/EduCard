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
        "active:border-primary/40 active:bg-surface-container-high web:cursor-pointer web:transition-all duration-150",
        className
      )}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
}

export function Card({ onPress, className, isSolved = false, children, ...props }: CardProps) {
  // Oxford Editorial Dignified Card with Tactile Archival Depth
  const cardStyles = cn(
    "rounded-2xl p-5 mb-3.5",
    isSolved
      ? "bg-tertiary-container border border-tertiary/30 border-t-tertiary/50 shadow-sm shadow-black/30"
      : "bg-surface-container border border-outline-variant border-t-outline/20 shadow-sm shadow-black/40 web:hover:border-outline"
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
