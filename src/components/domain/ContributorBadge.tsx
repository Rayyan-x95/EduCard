import { Badge, BadgeVariant } from "@/components/ui/Badge";
import { UserStatusEnum } from "@/types/database";
import { Check } from "lucide-react-native";

interface ContributorBadgeProps {
  status: UserStatusEnum;
  isVerified?: boolean;
  institution?: string | null;
  className?: string;
}

export function ContributorBadge({
  status,
  isVerified = false,
  institution,
  className,
}: ContributorBadgeProps) {
  const getBadgeConfig = (): { variant: BadgeVariant; label: string } => {
    switch (status) {
      case "undergraduate":
        return {
          variant: "student",
          label: institution ? `Student @ ${institution}` : "Student",
        };
      case "alumni":
        return {
          variant: "alumni",
          label: institution ? `Alumni @ ${institution}` : "Alumni",
        };
      case "professional":
        return {
          variant: "professional",
          label: institution ? `Professional • ${institution}` : "Professional",
        };
      case "mentor":
        return {
          variant: "mentor",
          label: "Verified Mentor",
        };
      case "postgraduate":
        return {
          variant: "student",
          label: institution ? `Postgrad @ ${institution}` : "Postgrad",
        };
      default:
        return {
          variant: "neutral",
          label: "Member",
        };
    }
  };

  const { variant, label } = getBadgeConfig();

  return (
    <Badge
      variant={variant}
      label={label}
      icon={
        isVerified ? (
          <Check
            size={11}
            color={variant === "mentor" ? "#D8B4FE" : "#34D399"}
            strokeWidth={2.8}
          />
        ) : undefined
      }
      className={className}
    />
  );
}
