// src/components/UI/BmsDashboardWidgetCard.tsx

import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { GripVertical, X } from "lucide-react";

import { cn } from "../../lib/cn";
import { BmsButton } from "./BmsButton";
import { BmsCard } from "./BmsCard";

export type BmsDashboardWidgetCardSize = "small" | "medium" | "wide" | "full";

type BmsDashboardWidgetCardProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "title"
> & {
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;

  size?: BmsDashboardWidgetCardSize;

  dragAttributes?: ButtonHTMLAttributes<HTMLButtonElement>;
  dragListeners?: ButtonHTMLAttributes<HTMLButtonElement>;

  onHide?: () => void;
  hideLabel?: string;
  dragLabel?: string;

  headerAction?: ReactNode;
  contentClassName?: string;
};

const iconButtonClass =
  "h-9 min-h-9 w-9 min-w-9 rounded-xl p-0 " +
  "border shadow-sm backdrop-blur-md " +
  "[&>svg]:h-4.5 [&>svg]:w-4.5 [&>svg]:shrink-0";

export function BmsDashboardWidgetCard({
  title,
  subtitle = "Drag to reorder dashboard",
  children,
  size = "medium",
  dragAttributes,
  dragListeners,
  onHide,
  hideLabel = "Hide widget",
  dragLabel = "Drag widget",
  headerAction,
  className,
  contentClassName,
  ...props
}: BmsDashboardWidgetCardProps) {
  return (
    <BmsCard
      className={cn(
        "group h-full p-5",
        size === "wide" && "xl:col-span-2",
        size === "full" && "xl:col-span-2 2xl:col-span-3",
        className
      )}
      {...props}
    >
      <div className="mb-5 border-b border-slate-700/60 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="wrap-break-word text-sm font-semibold leading-5 text-slate-100">
              {title}
            </h3>

            {subtitle && (
              <p className="mt-1 text-xs leading-5 text-slate-400">
                {subtitle}
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {headerAction}

            <BmsButton
              type="button"
              variant="ghost"
              size="sm"
              aria-label={dragLabel}
              title={dragLabel}
              className={cn(
                iconButtonClass,
                "cursor-grab border-cyan-300/25 bg-cyan-400/10 text-cyan-100",
                "hover:border-cyan-300/60 hover:bg-cyan-400/20 hover:text-white",
                "active:cursor-grabbing"
              )}
              {...dragAttributes}
              {...dragListeners}
            >
              <GripVertical className="h-4.5 w-4.5" strokeWidth={2.4} />
            </BmsButton>

            {onHide && (
              <BmsButton
                type="button"
                variant="ghost"
                size="sm"
                aria-label={hideLabel}
                title={hideLabel}
                onClick={onHide}
                className={cn(
                  iconButtonClass,
                  "border-rose-300/25 bg-rose-400/10 text-rose-100",
                  "hover:border-rose-300/60 hover:bg-rose-400/20 hover:text-white"
                )}
              >
                <X className="h-4.5 w-4.5" strokeWidth={2.5} />
              </BmsButton>
            )}
          </div>
        </div>
      </div>

      <div className={cn("min-h-52.5", contentClassName)}>{children}</div>
    </BmsCard>
  );
}