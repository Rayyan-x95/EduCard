import React, { useEffect, useState } from "react";
import { Animated, View, StyleProp, ViewStyle } from "react-native";
import { Card } from "./Card";

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({
  width = "100%",
  height = 20,
  borderRadius = 10,
  className = "",
  style,
}: SkeletonProps) {
  // Render-stable Animated.Value via lazy useState — the react-hooks/refs
  // rule (correctly) flags reading .current of a ref during render.
  const [opacity] = useState(() => new Animated.Value(0.25));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.65,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.25,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height: height as any,
          borderRadius,
          opacity,
        },
        style,
      ]}
      className={`bg-surface-container-highest ${className}`}
    />
  );
}

export function QuestionCardSkeleton() {
  return (
    <Card className="mb-4 p-5 bg-surface-container border-outline-variant/40">
      {/* Author Header Skeleton */}
      <View className="flex-row items-center space-x-3 mb-4">
        <Skeleton width={40} height={40} borderRadius={20} />
        <View className="flex-1 space-y-1.5">
          <Skeleton width="45%" height={14} borderRadius={6} />
          <Skeleton width="30%" height={10} borderRadius={4} className="opacity-70" />
        </View>
        <Skeleton width={80} height={22} borderRadius={999} />
      </View>

      {/* Body Skeleton */}
      <View className="space-y-2.5 mb-5">
        <Skeleton width="85%" height={20} borderRadius={8} />
        <Skeleton width="100%" height={14} borderRadius={6} />
        <Skeleton width="90%" height={14} borderRadius={6} />
        <Skeleton width="60%" height={14} borderRadius={6} />
      </View>

      {/* Actions Skeleton */}
      <View className="flex-row items-center justify-between pt-3.5 border-t border-outline-variant/30">
        <View className="flex-row items-center space-x-3">
          <Skeleton width={75} height={28} borderRadius={999} />
          <Skeleton width={55} height={28} borderRadius={999} />
        </View>
        <Skeleton width={50} height={14} borderRadius={4} />
      </View>
    </Card>
  );
}
