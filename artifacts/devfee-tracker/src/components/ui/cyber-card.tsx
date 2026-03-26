import * as React from "react"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const CyberCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { glow?: boolean }>(
  ({ className, glow = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative bg-card border border-border overflow-hidden",
        glow ? "box-glow hover:box-glow-active transition-shadow duration-300" : "",
        className
      )}
      {...props}
    >
      {/* Decorative corner brackets */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-primary" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-primary" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-primary" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-primary" />
      
      {/* Scanline overlay inside card */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:100%_4px] opacity-20" />
      
      <div className="relative z-10">
        {props.children}
      </div>
    </div>
  )
)
CyberCard.displayName = "CyberCard"

export { CyberCard }
