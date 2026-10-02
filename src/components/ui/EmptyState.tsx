import React from "react";
import { View } from "react-native";
import { Card } from "./Card";
import { Typography } from "./Typography";
import { Button } from "./Button";
import { cn } from "@/lib/cn";

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <Card
      className={cn(
        "p-8 items-center justify-center my-6 bg-surface-container border border-outline-variant/60 shadow-lg shadow-black/30",
        className
      )}
    >
      <View className="w-16 h-16 rounded-2xl bg-primary-container/30 border border-primary/30 items-center justify-center mb-4 shadow-sm shadow-primary/20">
        {icon}
      </View>
      <Typography
        variant="headline-md"
        className="text-lg text-on-surface text-center mb-1.5 font-bold"
      >
        {title}
      </Typography>
      <Typography
        variant="body-md"
        className="text-on-surface-variant text-center max-w-[280px] mb-6 leading-relaxed"
      >
        {description}
      </Typography>
      {actionLabel && onAction && (
        <Button variant="primary" size="md" onPress={onAction}>
          {actionLabel}
        </Button>
      )}
    </Card>
  );
}
