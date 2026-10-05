import React from "react";
import { Text, TextProps } from "react-native";
import { cn } from "@/lib/cn";

export type TypographyVariant =
  | "display-lg"
  | "headline-lg"
  | "headline-md"
  | "headline-sm"
  | "body-lg"
  | "body-md"
  | "body-sm"
  | "label-lg"
  | "label-md"
  | "label-sm";

interface TypographyProps extends TextProps {
  variant?: TypographyVariant;
  className?: string;
  children: React.ReactNode;
}

const variantStyles: Record<TypographyVariant, string> = {
  // Oxford Editorial & Academic Guild Typographic Hierarchy
  "display-lg": "text-[36px] leading-[42px] font-bold text-on-surface tracking-tight font-headline",
  "headline-lg": "text-[26px] leading-[32px] font-bold text-on-surface tracking-tight font-headline",
  "headline-md": "text-[20px] leading-[26px] font-semibold text-on-surface tracking-tight font-headline",
  "headline-sm": "text-[17px] leading-[23px] font-semibold text-on-surface tracking-tight font-headline",
  "body-lg": "text-[16px] leading-[25px] font-normal text-on-surface font-body",
  "body-md": "text-[14px] leading-[22px] font-normal text-on-surface font-body",
  "body-sm": "text-[13px] leading-[19px] font-normal text-on-surface-variant font-body",
  "label-lg": "text-[14px] leading-[19px] font-semibold text-on-surface tracking-normal font-sans",
  "label-md": "text-[12px] leading-[17px] font-semibold text-on-surface tracking-wide font-sans",
  "label-sm": "text-[11px] leading-[15px] font-medium text-on-surface-variant uppercase tracking-wider font-sans",
};

export function Typography({
  variant = "body-md",
  className,
  children,
  ...props
}: TypographyProps) {
  return (
    <Text
      className={cn(variantStyles[variant], className)}
      {...props}
    >
      {children}
    </Text>
  );
}
