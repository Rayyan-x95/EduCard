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
  // Apple & Material Luminous Pill Badges
  const variantStyles: Record<BadgeVariant, { container: string; text: string }> = {
    student: {
      container: "bg-surface-container-high/90 border border-outline-variant/60",
      text: "text-on-surface-variant font-medium",
    },
    alumni: {
      container: "bg-primary-container/40 border border-primary/40",
      text: "text-primary font-semibold",
    },
    professional: {
      container: "bg-secondary-container/40 border border-secondary/40",
      text: "text-secondary font-semibold",
    },
    mentor: {
      container: "bg-secondary-container/60 border border-secondary/60",
      text: "text-secondary-light font-bold",
    },
    solved: {
      container: "bg-tertiary-container/50 border border-tertiary/60",
      text: "text-tertiary font-bold",
    },
    open: {
      container: "bg-surface-container-high/80 border border-outline-variant/50",
      text: "text-on-surface-variant font-medium",
    },
    topic: {
      container: "bg-surface-container-highest/80 border border-outline-variant/40",
      text: "text-on-surface font-medium",
    },
    category: {
      container: "bg-primary-container/30 border border-primary/50 active:bg-primary-container/50",
      text: "text-primary font-semibold",
    },
    neutral: {
      container: "bg-surface-container-low border border-outline-variant/40",
      text: "text-on-surface-variant font-medium",
    },
  };

  const current = variantStyles[variant];

  return (
    <View
      className={clsx(
        "flex-row items-center self-start rounded-full px-2.5 py-1 space-x-1.5",
        current.container,
        className
      )}
    >
      {icon && <View className="mr-1">{icon}</View>}
      <Typography variant="label-sm" className={clsx("tracking-normal lowercase first-letter:capitalize", current.text)}>
        {label}
      </Typography>
    </View>
  );
}
