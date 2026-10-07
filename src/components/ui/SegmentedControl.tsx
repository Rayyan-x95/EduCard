import React from "react";
import { View, TouchableOpacity } from "react-native";
import { Typography } from "./Typography";
import { AppHaptics } from "@/lib/haptics";
import { cn } from "@/lib/cn";

export interface SegmentedOption<T extends string> {
  label: string;
  value: T;
  accessibilityLabel?: string;
}

export interface SegmentedControlProps<T extends string> {
  options: readonly SegmentedOption<T>[] | SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  return (
    <View
      className={cn(
        "flex-row bg-surface-container-low/95 p-1 rounded-2xl border border-outline-variant/80 backdrop-blur-md shadow-inner",
        className
      )}
    >
      {options.map((opt) => {
        const isActive = value === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={opt.accessibilityLabel || opt.label}
            onPress={() => {
              AppHaptics.selection();
              onChange(opt.value);
            }}
            className={cn(
              "flex-1 py-2 min-h-[44px] rounded-xl items-center justify-center transition-all web:cursor-pointer select-none active:scale-[0.98]",
              isActive
                ? "bg-surface-container-high border border-outline/30 border-t-outline/50 shadow-sm shadow-black/40"
                : "border border-transparent active:bg-surface-container-low/60"
            )}
          >
            <Typography
              variant="label-md"
              className={cn(
                "tracking-tight text-[13px]",
                isActive ? "text-primary font-bold" : "text-on-surface-variant font-medium hover:text-on-surface"
              )}
            >
              {opt.label}
            </Typography>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
