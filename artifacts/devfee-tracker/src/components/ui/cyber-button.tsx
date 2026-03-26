import * as React from "react"
import { cn } from "@/components/ui/cyber-card"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "accent";
  size?: "default" | "sm" | "lg" | "icon";
  isLoading?: boolean;
}

const CyberButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", isLoading, children, ...props }, ref) => {
    
    const variants = {
      primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(255,221,0,0.4)] hover:shadow-[0_0_25px_rgba(255,221,0,0.6)] border border-primary",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border",
      outline: "border-2 border-primary text-primary hover:bg-primary/10",
      ghost: "hover:bg-primary/10 text-primary",
      accent: "bg-accent text-accent-foreground hover:bg-accent/90 shadow-[0_0_15px_rgba(255,102,0,0.4)] border border-accent",
    }
    
    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-8 px-3 text-xs",
      lg: "h-12 px-8 text-lg uppercase tracking-wider font-display",
      icon: "h-10 w-10",
    }

    return (
      <button
        ref={ref}
        disabled={isLoading || props.disabled}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap font-display font-bold uppercase transition-all duration-200",
          "disabled:pointer-events-none disabled:opacity-50",
          "active:scale-95",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>PROCESSING...</span>
          </div>
        ) : (
          children
        )}
      </button>
    )
  }
)
CyberButton.displayName = "CyberButton"

export { CyberButton }
