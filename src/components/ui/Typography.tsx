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
  // CRED High-Contrast & Neumorphic Typography Hierarchy
  "display-lg": "text-[42px] leading-[48px] font-black text-on-surface tracking-tighter font-headline",
  "headline-lg": "text-[32px] leading-[38px] font-bold text-on-surface tracking-tight font-headline",
  "headline-md": "text-[24px] leading-[30px] font-bold text-on-surface tracking-tight font-headline",
  "headline-sm": "text-[18px] leading-[24px] font-bold text-on-surface tracking-tight font-headline",
  "body-lg": "text-[16px] leading-[24px] font-medium text-on-surface font-body",
  "body-md": "text-[14px] leading-[22px] font-medium text-on-surface font-body",
  "body-sm": "text-[13px] leading-[20px] font-normal text-on-surface-variant font-body",
  "label-lg": "text-[14px] leading-[18px] font-bold text-on-surface tracking-normal font-sans",
  "label-md": "text-[12px] leading-[16px] font-bold text-on-surface tracking-[0.05em] uppercase font-sans",
  "label-sm": "text-[10px] leading-[14px] font-bold text-on-surface-variant tracking-[0.08em] uppercase font-sans",
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
