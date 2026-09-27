import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "subtle" | "ghost" | "danger";
  size?: "xs" | "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      leftIcon,
      rightIcon,
      type = "button",
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "group inline-flex items-center justify-center font-medium transition-all duration-150 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black disabled:opacity-50 disabled:pointer-events-none active:scale-[0.99] cursor-pointer";

    const sizeStyles = {
      xs: "h-7 px-2.5 text-xs rounded gap-1.5",
      sm: "h-8 px-3 text-xs rounded-md gap-2",
      md: "h-10 px-4 text-sm rounded-md gap-2",
      lg: "h-11 px-5 text-sm rounded-md gap-2.5",
    };

    const variantStyles = {
      primary:
        "bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white shadow-[0_1px_2px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.2)] border border-brand-700/50",
      secondary:
        "bg-white hover:bg-zinc-50 active:bg-zinc-100 text-zinc-800 border border-zinc-200/90 shadow-xs dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:active:bg-zinc-850 dark:text-zinc-200 dark:border-white/10 dark:shadow-none",
      subtle:
        "bg-zinc-100 hover:bg-zinc-200/80 text-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 dark:border dark:border-white/5",
      ghost:
        "bg-transparent hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 dark:hover:bg-white/[0.06] dark:text-zinc-400 dark:hover:text-zinc-100",
      danger:
        "bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white shadow-xs border border-rose-700/40",
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";
