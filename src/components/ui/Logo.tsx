import { Image, ImageStyle, StyleProp } from "react-native";

interface LogoProps {
  variant?: "full" | "simple";
  size?: "sm" | "md" | "lg" | "xl";
  width?: number;
  height?: number;
  className?: string;
  style?: StyleProp<ImageStyle>;
}

const SIZE_MAP = {
  sm: 28,
  md: 44,
  lg: 64,
  xl: 96,
};

export function Logo({
  variant = "full",
  size = "md",
  width,
  height,
  className,
  style,
}: LogoProps) {
  const dimension = width || (size ? SIZE_MAP[size] : SIZE_MAP.md);
  const h = height || dimension;

  const source =
    variant === "simple"
      ? require("@/../assets/Simple logo.png")
      : require("@/../assets/LOGO.png");

  return (
    <Image
      source={source}
      style={[{ width: dimension, height: h, resizeMode: "contain" }, style]}
      className={className}
    />
  );
}
