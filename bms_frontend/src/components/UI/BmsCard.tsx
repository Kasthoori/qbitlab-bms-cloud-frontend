import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

type BmsCardVariant = "section" | "glass";

type BmsCardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  variant?: BmsCardVariant;
  hover?: boolean;
};

export function BmsCard({
  children,
  variant = "glass",
  hover = false,
  className,
  ...props
}: BmsCardProps) {
  const baseClass = variant === "section" ? "bms-section" : "bms-glass-card";

  return (
    <div
      className={cn(baseClass, hover && "bms-glass-card-hover", className)}
      {...props}
    >
      {children}
    </div>
  );
}