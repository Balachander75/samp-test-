import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  inputSize?: "default" | "lg";
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, rightElement, inputSize = "lg", type, ...props }, ref) => {
    return (
      <div
        className={cn(
          "relative flex items-center w-full group rounded-2xl border border-slate-200/90 bg-slate-50/60 transition-all duration-200 hover:border-slate-300 focus-within:border-blue-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-600/15 shadow-xs dark:bg-slate-900/60 dark:border-slate-800 dark:focus-within:bg-slate-900",
          inputSize === "lg" ? "min-h-[50px] px-3.5" : "min-h-[44px] px-3"
        )}
      >
        {icon && (
          <span className="text-slate-400 group-focus-within:text-blue-600 transition-colors flex items-center justify-center pl-1 pr-2.5">
            {icon}
          </span>
        )}
        <input
          type={type}
          ref={ref}
          className={cn(
            "w-full bg-transparent text-slate-900 placeholder:text-slate-400 outline-none text-sm leading-relaxed",
            inputSize === "lg" ? "py-3" : "py-2.5",
            rightElement && "pr-8",
            className
          )}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3.5 flex items-center justify-center">
            {rightElement}
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
