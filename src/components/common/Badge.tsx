import React, { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export type BadgeVariant = 'default' | 'neutral' | 'success' | 'danger' | 'warning' | 'info' | 'accent' | 'outline';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  dotColor?: string;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'default',
  size = 'sm',
  dot = false,
  dotColor,
  icon,
  ...props
}) => {
  const variantStyles: Record<BadgeVariant, { container: string; dot: string }> = {
    default: {
      container: "bg-white/10 text-neutral-300 border-white/10",
      dot: "bg-neutral-400"
    },
    neutral: {
      container: "bg-neutral-800/80 text-neutral-300 border-neutral-700/50",
      dot: "bg-neutral-400"
    },
    success: {
      container: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      dot: "bg-emerald-400"
    },
    danger: {
      container: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      dot: "bg-rose-400"
    },
    warning: {
      container: "bg-amber-500/10 text-amber-300 border-amber-500/20",
      dot: "bg-amber-400"
    },
    info: {
      container: "bg-sky-500/10 text-sky-300 border-sky-500/20",
      dot: "bg-sky-400"
    },
    accent: {
      container: "bg-white text-black border-white font-bold",
      dot: "bg-black"
    },
    outline: {
      container: "bg-transparent text-neutral-400 border-white/[0.08]",
      dot: "bg-neutral-400"
    }
  };

  const sizeStyles: Record<BadgeSize, string> = {
    sm: "text-[9px] px-2 py-0.5 rounded font-mono font-medium tracking-wide",
    md: "text-[10px] px-2.5 py-1 rounded-md font-medium tracking-wider"
  };

  const selected = variantStyles[variant] || variantStyles.default;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border leading-none select-none uppercase shrink-0",
        selected.container,
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColor || selected.dot)}
          aria-hidden="true"
        />
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
