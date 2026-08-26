import React from "react";
import { View, ViewProps, TouchableOpacity } from "react-native";
import clsx from "clsx";

interface CardProps extends ViewProps {
  onPress?: () => void;
  className?: string;
  isSolved?: boolean;
  children: React.ReactNode;
}

export function Card({ onPress, className, isSolved = false, children, ...props }: CardProps) {
  // Apple iOS / Material 3 Elevation & Depth
  const cardStyles = clsx(
    "rounded-2xl p-5 mb-4 shadow-sm",
    isSolved
      ? "bg-tertiary-container/15 border border-tertiary/40 shadow-tertiary/10"
      : "bg-surface-container border border-outline-variant/60 shadow-black/20"
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.88}
        accessibilityRole="button"
        className={clsx(
          cardStyles,
          "active:border-primary/40 active:bg-surface-container-high",
          className
        )}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View className={clsx(cardStyles, className)} {...props}>
      {children}
    </View>
  );
}
