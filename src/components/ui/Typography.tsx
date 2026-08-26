import React from "react";
import { Text, TextProps } from "react-native";
import clsx from "clsx";

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
  | "label-sm"
  // Legacy aliases
  | "h1"
  | "h2"
  | "h3"
  | "body"
  | "caption"
  | "subtitle";

interface TypographyProps extends TextProps {
  variant?: TypographyVariant;
  className?: string;
  children: React.ReactNode;
}

export function Typography({
  variant = "body-md",
  className,
  children,
  ...props
}: TypographyProps) {
  const variantStyles: Record<TypographyVariant, string> = {
    // Apple SF / Material 3 Typographic Scale
    "display-lg": "text-[36px] leading-[44px] font-extrabold text-on-surface tracking-tight",
    "headline-lg": "text-[28px] leading-[34px] font-bold text-on-surface tracking-tight",
    "headline-md": "text-[22px] leading-[28px] font-bold text-on-surface tracking-tight",
    "headline-sm": "text-[18px] leading-[24px] font-semibold text-on-surface tracking-tight",
    "body-lg": "text-[17px] leading-[26px] font-normal text-on-surface",
    "body-md": "text-[15px] leading-[23px] font-normal text-on-surface",
    "body-sm": "text-[13px] leading-[19px] font-normal text-on-surface-variant",
    "label-lg": "text-[15px] leading-[20px] font-semibold text-on-surface tracking-wide",
    "label-md": "text-[13px] leading-[18px] font-semibold text-on-surface tracking-wide",
    "label-sm": "text-[11px] leading-[15px] font-medium text-on-surface-variant tracking-wider uppercase",
    
    // Semantic mappings
    h1: "text-[28px] leading-[34px] font-bold text-on-surface tracking-tight",
    h2: "text-[22px] leading-[28px] font-bold text-on-surface tracking-tight",
    h3: "text-[18px] leading-[24px] font-semibold text-on-surface",
    subtitle: "text-[15px] leading-[22px] font-medium text-on-surface-variant",
    body: "text-[15px] leading-[23px] font-normal text-on-surface",
    caption: "text-[12px] leading-[16px] font-medium text-on-surface-variant",
  };

  return (
    <Text
      className={clsx(variantStyles[variant], className)}
      {...props}
    >
      {children}
    </Text>
  );
}
