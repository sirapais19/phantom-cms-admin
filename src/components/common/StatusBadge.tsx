import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  variant?: "active" | "inactive" | "draft" | "published" | "default";
  className?: string;
}

const variantClasses = {
  active: "status-active",
  inactive: "status-inactive",
  draft: "status-draft",
  published: "status-published",
  default: "bg-secondary text-secondary-foreground border border-border",
};

export function StatusBadge({
  status,
  variant = "default",
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variantClasses[variant],
        className
      )}
    >
      {status}
    </span>
  );
}
