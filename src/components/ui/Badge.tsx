import React from "react";
import { View } from "react-native";
import clsx from "clsx";
import { Typography } from "./Typography";

export type BadgeVariant =
  | "student"
  | "alumni"
  | "professional"
  | "mentor"
  | "solved"
  | "open"
  | "topic"
  | "category"
  | "neutral";

interface BadgeProps {
  variant?: BadgeVariant;
  label: string;
  icon?: React.ReactNode;
  className?: string;
}

export function Badge({
  variant = "neutral",
  label,
  icon,
  className,
}: BadgeProps) {
  // Oxford Academic Guild Badges & Seals
  const variantStyles: Record<BadgeVariant, { container: string; text: string }> = {
    student: {
      container: "bg-surface-container-high border border-outline-variant",
      text: "text-on-surface-variant font-medium",
    },
    alumni: {
      container: "bg-primary-container border border-primary/40",
      text: "text-primary-light font-semibold",
    },
    professional: {
      container: "bg-secondary-container/50 border border-secondary/40",
      text: "text-secondary-light font-semibold",
    },
    mentor: {
      container: "bg-primary-container border border-primary/60",
      text: "text-primary-light font-bold",
    },
    solved: {
      container: "bg-tertiary-container border border-tertiary/40",
      text: "text-tertiary font-bold",
    },
    open: {
      container: "bg-surface-container-high border border-outline-variant",
      text: "text-on-surface-variant font-medium",
    },
    topic: {
      container: "bg-surface-container-high border border-outline-variant",
      text: "text-on-surface font-medium",
    },
    category: {
      container: "bg-primary-container/60 border border-primary/40 active:bg-primary-container/80",
      text: "text-primary-light font-medium",
    },
    neutral: {
      container: "bg-surface-container-low border border-outline-variant/60",
      text: "text-on-surface-variant font-medium",
    },
  };

  const current = variantStyles[variant];

  return (
    <View
      className={clsx(
        "flex-row items-center self-start rounded-full px-2.5 py-1",
        current.container,
        className
      )}
    >
      {icon && <View className="mr-1.5">{icon}</View>}
      <Typography variant="label-sm" className={clsx("tracking-normal", current.text)}>
        {label.charAt(0).toUpperCase() + label.slice(1).toLowerCase()}
      </Typography>
    </View>
  );
}
