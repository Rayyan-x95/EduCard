import React from "react";
import {
  Pressable,
  PressableProps,
  ActivityIndicator,
  View,
} from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import clsx from "clsx";
import { Typography } from "./Typography";
import { AppHaptics } from "@/lib/haptics";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ButtonProps extends PressableProps {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "solved";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  enableHaptics?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  leftIcon,
  rightIcon,
  children,
  className,
  disabled,
  enableHaptics = true,
  onPress,
  ...props
}: ButtonProps) {
  const baseStyles = "flex-row items-center justify-center web:cursor-pointer select-none web:transition-all";

  const sizeStyles = {
    sm: "px-4 py-2 min-h-[40px] rounded-xl",
    md: "px-6 py-3 min-h-[50px] rounded-[18px]",
    lg: "px-8 py-4 min-h-[56px] rounded-[22px]",
  };

  const variantStyles = {
    // CRED Thick, High-Contrast Metallic Controls
    primary: "bg-primary border border-primary-light/50",
    secondary: "bg-surface-container-high border-[1.5px] border-outline-variant",
    outline: "bg-transparent border-[1.5px] border-primary/50",
    ghost: "bg-transparent",
    danger: "bg-error-container/30 border border-error/50",
    solved: "bg-tertiary-container/30 border border-tertiary/50",
  };

  const textVariantStyles = {
    primary: "text-[#000000] font-black text-center tracking-wide", // Absolute black on gold
    secondary: "text-on-surface font-bold text-center",
    outline: "text-primary font-bold text-center",
    ghost: "text-on-surface font-bold text-center",
    danger: "text-error-light font-bold text-center",
    solved: "text-tertiary font-bold text-center tracking-widest",
  };

  const handlePress = (e: any) => {
    if (enableHaptics) {
      if (variant === "primary" || variant === "danger") {
        AppHaptics.medium();
      } else {
        AppHaptics.light();
      }
    }
    onPress?.(e);
  };

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = (e: any) => {
    // eslint-disable-next-line react-hooks/immutability
    scale.value = withSpring(0.93, { damping: 18, stiffness: 400 });
    props.onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    // eslint-disable-next-line react-hooks/immutability
    scale.value = withSpring(1, { damping: 18, stiffness: 400 });
    props.onPressOut?.(e);
  };

  return (
    <AnimatedPressable
      className={clsx(
        baseStyles,
        sizeStyles[size],
        variantStyles[variant],
        (disabled || loading) && "opacity-50",
        className
      )}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled || loading), busy: loading }}
      accessibilityLabel={
        typeof children === "string" ? `${children}${loading ? " (loading)" : ""}` : undefined
      }
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={animatedStyle}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#181003" : "#D49B35"} size="small" />
      ) : (
        <View className="flex-row items-center justify-center">
          {leftIcon && <View className="mr-2">{leftIcon}</View>}
          <Typography
            variant={size === "sm" ? "label-md" : "label-lg"}
            className={textVariantStyles[variant]}
          >
            {children}
          </Typography>
          {rightIcon && <View className="ml-2">{rightIcon}</View>}
        </View>
      )}
    </AnimatedPressable>
  );
}
