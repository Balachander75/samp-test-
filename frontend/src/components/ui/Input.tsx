import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  inputSize?: "sm" | "md" | "lg";
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isMono?: boolean;
  hasError?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      inputSize = "lg",
      leftIcon,
      rightIcon,
      isMono = false,
      hasError = false,
      type = "text",
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: "h-8 px-3 text-[13px]",
      md: "h-9 px-3 text-[13px]",
      lg: "h-10 px-3.5 text-sm",
    };

    return (
      <div className="relative flex items-center w-full group">
        {leftIcon && (
          <div className="absolute left-3.5 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500 transition-colors group-focus-within:text-brand-600 dark:group-focus-within:text-brand-400">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          type={type}
          data-mono={isMono ? "true" : undefined}
          className={cn(
            "w-full rounded-md transition-colors duration-150 outline-none",
            sizeClasses[inputSize],
            // Light mode: clean, crisp paper input with subtle border and focus ring
            "bg-white hover:bg-white focus:bg-white text-zinc-900 placeholder:text-zinc-500 border border-zinc-300 hover:border-zinc-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/15 shadow-none",
            // Dark mode: professional matte dark input with fine border and focus ring
            "dark:bg-[#111318] dark:text-white dark:placeholder:text-zinc-400 dark:border-white/15 dark:hover:border-white/25 dark:focus:border-brand-500 dark:focus:ring-2 dark:focus:ring-brand-500/25 dark:shadow-none",
            leftIcon && "pl-11",
            rightIcon && "pr-11",
            isMono && "font-mono tracking-tight",
            hasError && "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20 dark:border-rose-500/80 dark:focus:border-rose-500",
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3.5 flex items-center text-zinc-400 dark:text-zinc-500">
            {rightIcon}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
