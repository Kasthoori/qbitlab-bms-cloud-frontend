import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

type BmsSectionHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function BmsSectionHeader({
  title,
  subtitle,
  action,
  className,
}: BmsSectionHeaderProps) {
  return (
    <div
      className={cn(
        "mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between",
        className
      )}
    >
      <div>
        <h2 className="bms-title">{title}</h2>
        {subtitle && <p className="bms-subtitle mt-1">{subtitle}</p>}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}