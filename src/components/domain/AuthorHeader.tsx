import React from "react";
import { View } from "react-native";
import { Avatar } from "@/components/ui/Avatar";
import { Typography } from "@/components/ui/Typography";
import { UserStatusEnum } from "@/types/database";
import { cn } from "@/lib/cn";

export interface AuthorHeaderProps {
  displayName: string;
  avatarPath?: string | null;
  status?: UserStatusEnum;
  isVerified?: boolean;
  avatarSize?: "sm" | "md" | "lg";
  subtitle?: React.ReactNode;
  rightAccessory?: React.ReactNode;
  className?: string;
}

export const AuthorHeader = React.memo(function AuthorHeader({
  displayName,
  avatarPath,
  status = "undergraduate",
  isVerified = false,
  avatarSize = "sm",
  subtitle,
  rightAccessory,
  className,
}: AuthorHeaderProps) {
  return (
    <View className={cn("flex-row items-center justify-between mb-3.5", className)}>
      <View className="flex-row items-center gap-x-3 flex-1 mr-3">
        <Avatar
          name={displayName}
          uri={avatarPath}
          size={avatarSize}
          role={status}
          isVerified={isVerified}
        />
        <View className="flex-1">
          <Typography
            variant="label-md"
            className="text-on-surface font-semibold"
            numberOfLines={1}
          >
            {displayName}
          </Typography>
          {typeof subtitle === "string" ? (
            <Typography variant="label-sm" className="text-on-surface-variant/70 mt-0.5">
              {subtitle}
            </Typography>
          ) : (
            subtitle
          )}
        </View>
      </View>

      {rightAccessory && <View>{rightAccessory}</View>}
    </View>
  );
});
