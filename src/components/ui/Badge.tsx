import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "admin" | "editor" | "reader" | "default";
  className?: string;
}

const variantClasses = {
  admin: "bg-red-100 text-red-800",
  editor: "bg-blue-100 text-blue-800",
  reader: "bg-gray-100 text-gray-800",
  default: "bg-gray-100 text-gray-800",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
