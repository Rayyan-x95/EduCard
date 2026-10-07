import React from "react";
import { TouchableOpacity, GestureResponderEvent } from "react-native";
import { ThumbsUp } from "lucide-react-native";
import { Typography } from "@/components/ui/Typography";
import { AppHaptics } from "@/lib/haptics";
import { cn } from "@/lib/cn";

export interface HelpfulChipProps {
  count: number;
  isHelpful?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  label?: string;
  accessibilityLabel?: string;
  className?: string;
}

export const HelpfulChip = React.memo(function HelpfulChip({
  count,
  isHelpful = false,
  disabled = false,
  onPress,
  label,
  accessibilityLabel,
  className,
}: HelpfulChipProps) {
  const handlePress = (e: GestureResponderEvent) => {
    e.stopPropagation();
    AppHaptics.medium();
    onPress?.();
  };

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={
        accessibilityLabel || `Mark helpful, ${count} marks`
      }
      accessibilityState={{ selected: Boolean(isHelpful), disabled }}
      disabled={disabled}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      onPress={handlePress}
      className={cn(
        "flex-row items-center gap-x-1.5 px-3.5 py-1.5 min-h-[40px] rounded-full border web:cursor-pointer select-none active:scale-[0.96] transition-all duration-150",
        disabled
          ? "bg-surface-container-high/40 border-outline-variant/30 opacity-60"
          : isHelpful
          ? "bg-primary-container border-primary/60 shadow-sm shadow-black/30"
          : "bg-surface-container-high border-outline-variant active:bg-surface-container-highest",
        className
      )}
    >
      <ThumbsUp
        size={14}
        color={disabled ? "#4E5D6E" : isHelpful ? "#D49B35" : "#A3B3C4"}
        fill={!disabled && isHelpful ? "#D49B35" : "none"}
      />
      <Typography
        variant="label-md"
        className={cn(
          "tracking-tight",
          disabled
            ? "text-on-surface-muted font-medium"
            : isHelpful
            ? "text-primary-light font-bold"
            : "text-on-surface-variant font-medium"
        )}
      >
        {label ? `${label} (${count})` : count}
      </Typography>
    </TouchableOpacity>
  );
});
