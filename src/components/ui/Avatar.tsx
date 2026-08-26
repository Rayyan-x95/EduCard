import React from "react";
import { View, Text } from "react-native";
import { Image } from "expo-image";
import clsx from "clsx";
import { UserStatusEnum } from "@/types/database";

interface AvatarProps {
  uri?: string | null;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  role?: UserStatusEnum;
  isVerified?: boolean;
  className?: string;
}

export function Avatar({
  uri,
  name,
  size = "md",
  role = "undergraduate",
  isVerified = false,
  className,
}: AvatarProps) {
  const sizeStyles = {
    sm: "w-8 h-8 rounded-full",
    md: "w-10 h-10 rounded-full",
    lg: "w-14 h-14 rounded-full",
    xl: "w-20 h-20 rounded-full",
  };

  const textSizes = {
    sm: "text-[11px] font-bold",
    md: "text-[13px] font-bold",
    lg: "text-lg font-bold",
    xl: "text-2xl font-bold",
  };

  // Apple & Material Role Status Rings
  const getRoleRingClass = (r: UserStatusEnum) => {
    switch (r) {
      case "alumni":
        return "border-2 border-primary shadow-sm shadow-primary/30";
      case "mentor":
      case "professional":
        return "border-2 border-secondary shadow-sm shadow-secondary/30";
      default:
        return "border-2 border-outline-variant/60";
    }
  };

  const getInitials = (n: string) => {
    return n
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2) || "EC";
  };

  return (
    <View
      className={clsx("relative", className)}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View className={clsx("rounded-full p-0.5", getRoleRingClass(role))}>
        {uri ? (
          <Image
            source={{ uri }}
            className={clsx(sizeStyles[size], "bg-surface-container-high")}
          />
        ) : (
          <View
            className={clsx(
              sizeStyles[size],
              "bg-surface-container-highest border border-white/[0.08] items-center justify-center shadow-inner"
            )}
          >
            <Text className={clsx("text-primary-light font-bold tracking-tight", textSizes[size])}>
              {getInitials(name || "Edu Card")}
            </Text>
          </View>
        )}
      </View>
      {isVerified && (
        <View className="absolute -bottom-0.5 -right-0.5 bg-tertiary rounded-full w-4 h-4 items-center justify-center border-2 border-surface shadow-sm">
          <Text className="text-[#022C22] text-[9px] font-black leading-none">✓</Text>
        </View>
      )}
    </View>
  );
}
