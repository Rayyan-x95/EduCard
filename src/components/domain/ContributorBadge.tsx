import { Badge, BadgeVariant } from "@/components/ui/Badge";
import { UserStatusEnum } from "@/types/database";

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
          label: "Scholar",
        };
    }
  };

  const { variant, label } = getBadgeConfig();

  return (
    <Badge
      variant={variant}
      label={isVerified ? `✓ ${label}` : label}
      className={className}
    />
  );
}
