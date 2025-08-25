"use client";
import React from "react";
import { cn } from "../lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:opacity-50 disabled:pointer-events-none relative overflow-hidden group",
          {
            // Primary gradient button with glow effect
            "bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:shadow-xl transform hover:-translate-y-1 before:absolute before:inset-0 before:bg-gradient-to-r before:from-purple-400 before:via-blue-400 before:to-indigo-400 before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100":
              variant === "default",
            // Outline button with gradient border
            "border-2 border-transparent bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 bg-clip-border text-white relative before:absolute before:inset-0.5 before:bg-black before:rounded-lg hover:before:bg-slate-900 before:transition-colors before:duration-300 hover:shadow-lg hover:shadow-purple-500/25 transform hover:-translate-y-1":
              variant === "outline",
            // Ghost button
            "text-slate-300 hover:text-white hover:bg-slate-800/50 backdrop-blur-sm":
              variant === "ghost",
            // Secondary solid button
            "bg-slate-800 text-white hover:bg-slate-700 shadow-lg shadow-black/25 hover:shadow-xl transform hover:-translate-y-1":
              variant === "secondary",
          },
          {
            "h-9 px-4 text-sm rounded-lg": size === "sm",
            "h-11 px-6 text-base rounded-xl": size === "md",
            "h-14 px-8 text-lg rounded-xl": size === "lg",
          },
          className
        )}
        ref={ref}
        {...props}
      >
        <span className="relative z-10">{props.children}</span>
      </button>
    );
  }
);

Button.displayName = "Button";