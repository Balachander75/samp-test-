import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "brand" | "secondary" | "outline" | "ghost" | "destructive";
  buttonSize?: "sm" | "default" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", buttonSize = "default", isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer";
    
    const sizes = {
      sm: "h-7.5 px-2.5 text-xs rounded-md gap-1.5",
      default: "h-9 px-3.5 text-xs rounded-lg gap-2",
      lg: "h-10 px-4 text-sm rounded-lg gap-2",
      icon: "h-9 w-9 rounded-lg p-0",
    };

    const variants = {
      primary: "bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white shadow-2xs",
      brand: "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 shadow-2xs",
      secondary: "bg-slate-100/90 hover:bg-slate-200/90 text-slate-800 border border-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-100 dark:border-slate-700 shadow-2xs",
      outline: "border border-slate-200/90 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 dark:border-slate-800 dark:hover:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-850 dark:text-slate-200 shadow-2xs",
      ghost: "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/80",
      destructive: "bg-rose-600 text-white hover:bg-rose-700 shadow-2xs",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, sizes[buttonSize], variants[variant], className)}
        {...props}
      >
        {isLoading ? (
          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent mr-1.5" />
        ) : null}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
