import React, { useState } from "react";
import {
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  View,
} from "react-native";
import clsx from "clsx";
import { Typography } from "./Typography";

interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export function TextInput({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className,
  containerClassName,
  accessibilityLabel,
  onFocus,
  onBlur,
  ...props
}: TextInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className={clsx("w-full mb-4", containerClassName)}>
      {label && (
        <Typography
          variant="label-md"
          className="text-on-surface font-semibold mb-2"
        >
          {label}
        </Typography>
      )}
      <View
        className={clsx(
          "flex-row items-center bg-surface-container-low border rounded-xl px-4 min-h-[50px] transition-all",
          error
            ? "border-error bg-error-container/10"
            : isFocused
            ? "border-primary bg-surface-container shadow-sm shadow-primary/20"
            : "border-outline-variant/60"
        )}
      >
        {leftIcon && <View className="mr-3" aria-hidden>{leftIcon}</View>}
        <RNTextInput
          className={clsx("flex-1 text-on-surface text-base py-3 font-body", className)}
          placeholderTextColor="#64748B"
          selectionColor="#818CF8"
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityHint={error ?? helperText}
          aria-invalid={Boolean(error)}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
        {rightIcon && <View className="ml-3">{rightIcon}</View>}
      </View>
      {error ? (
        <Typography variant="label-sm" className="text-error mt-1.5 font-medium">
          {error}
        </Typography>
      ) : helperText ? (
        <Typography variant="label-sm" className="text-on-surface-variant/70 mt-1.5">
          {helperText}
        </Typography>
      ) : null}
    </View>
  );
}
