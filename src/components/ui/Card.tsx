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
        scale.value = withSpring(0.96, { damping: 20, stiffness: 400 });
      }}
      onPressOut={() => {
        // eslint-disable-next-line react-hooks/immutability
        scale.value = withSpring(1, { damping: 20, stiffness: 400 });
      }}
      accessibilityRole="button"
      style={animatedStyle}
      className={cn(
        cardStyles,
        "active:border-primary/50 active:bg-surface-container-high web:cursor-pointer web:transition-all duration-150",
        className
      )}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
}

export function Card({ onPress, className, isSolved = false, children, ...props }: CardProps) {
  // CRED Neumorphic Deep Cards
  const cardStyles = cn(
    "rounded-[20px] p-6 mb-4",
    isSolved
      ? "bg-tertiary-container/30 border-[1.5px] border-tertiary/40"
      : "bg-surface-container border-[1.5px] border-outline-variant/80 web:hover:border-outline-variant"
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
