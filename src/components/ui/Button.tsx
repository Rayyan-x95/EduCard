import React from "react";
import {
  TouchableOpacity,
  TouchableOpacityProps,
  ActivityIndicator,
  View,
} from "react-native";
import clsx from "clsx";
import { Typography } from "./Typography";
import { AppHaptics } from "@/lib/haptics";

interface ButtonProps extends TouchableOpacityProps {
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
  const baseStyles = "flex-row items-center justify-center font-semibold";

  const sizeStyles = {
    sm: "px-3.5 py-2 min-h-[40px] rounded-xl",
    md: "px-5 py-2.5 min-h-[46px] rounded-xl",
    lg: "px-6 py-3.5 min-h-[52px] rounded-2xl",
  };

  const variantStyles = {
    // Apple & Material Luminous Accents — focus:ring for web a11y
    primary: "bg-primary active:bg-primary/85 shadow-md shadow-primary/25 border border-primary-light/40 focus:ring-2 focus:ring-primary/50",
    secondary: "bg-surface-container-high active:bg-surface-container-highest border border-outline-variant/60 focus:ring-2 focus:ring-primary/30",
    outline: "bg-transparent border border-primary/50 active:bg-primary-container/25 focus:ring-2 focus:ring-primary/40",
    ghost: "bg-transparent active:bg-surface-container-high/60 focus:ring-2 focus:ring-primary/30",
    danger: "bg-error-container active:bg-error-container/80 border border-error/40 shadow-sm shadow-error/20 focus:ring-2 focus:ring-error/40",
    solved: "bg-tertiary-container active:bg-tertiary-container/80 border border-tertiary/50 shadow-sm shadow-tertiary/20 focus:ring-2 focus:ring-tertiary/40",
  };

  const textVariantStyles = {
    primary: "text-[#0F172A] font-bold text-center",
    secondary: "text-on-surface font-semibold text-center",
    outline: "text-primary font-semibold text-center",
    ghost: "text-on-surface-variant font-medium text-center",
    danger: "text-error font-bold text-center",
    solved: "text-tertiary font-bold text-center",
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

  return (
    <TouchableOpacity
      className={clsx(
        baseStyles,
        sizeStyles[size],
        variantStyles[variant],
        (disabled || loading) && "opacity-50",
        className
      )}
      disabled={disabled || loading}
      activeOpacity={0.82}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled || loading), busy: loading }}
      accessibilityLabel={
        typeof children === "string" ? `${children}${loading ? " (loading)" : ""}` : undefined
      }
      onPress={handlePress}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#0F172A" : "#818CF8"} size="small" />
      ) : (
        <View className="flex-row items-center justify-center space-x-2">
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
    </TouchableOpacity>
  );
}
