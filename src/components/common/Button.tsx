import React, { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'subtle';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  className,
  variant = 'secondary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  type = 'button',
  ...props
}, ref) => {
  const baseStyles = "inline-flex items-center justify-center font-semibold transition-all select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 disabled:opacity-40 disabled:pointer-events-none disabled:cursor-not-allowed active:scale-[0.98]";

  const variantStyles: Record<ButtonVariant, string> = {
    primary: "bg-white text-black hover:bg-neutral-200 border border-transparent shadow-sm font-bold",
    secondary: "bg-neutral-800 text-neutral-200 hover:bg-neutral-700 hover:text-white border border-white/[0.04]",
    danger: "bg-rose-600/90 text-white hover:bg-rose-500 border border-transparent shadow-sm",
    ghost: "bg-transparent text-neutral-400 hover:text-white hover:bg-white/[0.08] border border-transparent",
    outline: "bg-transparent text-neutral-300 hover:text-white border border-white/[0.12] hover:border-white/30 hover:bg-white/[0.04]",
    subtle: "bg-white/[0.04] text-neutral-300 hover:text-white hover:bg-white/[0.08] border border-white/[0.04]"
  };

  const sizeStyles: Record<ButtonSize, string> = {
    xs: "text-[10px] px-2.5 py-1 rounded-lg min-h-[26px] gap-1",
    sm: "text-xs px-3 py-1.5 rounded-xl min-h-[32px] gap-1.5",
    md: "text-xs px-4 py-2.5 rounded-xl min-h-[40px] gap-2",
    lg: "text-sm px-5 py-3 rounded-xl min-h-[46px] gap-2.5",
    'icon-sm': "w-7 h-7 p-0 rounded-full",
    icon: "w-8 h-8 p-0 rounded-full"
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
      ) : leftIcon ? (
        <span className="shrink-0">{leftIcon}</span>
      ) : null}

      {children}

      {!isLoading && rightIcon && (
        <span className="shrink-0">{rightIcon}</span>
      )}
    </button>
  );
});

Button.displayName = 'Button';
