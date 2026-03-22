import React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  mono?: boolean;
  className?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ mono, className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full py-2.5 px-3.5 rounded-[--radius-button] bg-elevated border border-border text-text text-[13px] outline-none transition-colors duration-150 focus:border-accent placeholder:text-text-muted",
          mono && "font-mono",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
