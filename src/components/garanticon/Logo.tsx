import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  variant?: "light" | "dark";
  size?: "sm" | "lg" | "xl";
}

const sizes = {
  sm: "text-xl",
  lg: "text-3xl md:text-4xl",
  xl: "text-5xl md:text-7xl lg:text-8xl",
};

const iconSizes = {
  sm: 20,
  lg: 32,
  xl: 56,
};

export const Logo = ({ className, variant = "light", size = "lg" }: LogoProps) => {
  return (
    <div className={cn("inline-flex items-center gap-3 font-extrabold tracking-tight", sizes[size], className)}>
      <ShieldCheck
        className="text-secondary"
        size={iconSizes[size]}
        strokeWidth={2.5}
      />
      <span className={variant === "dark" ? "text-background" : "text-primary"}>
        GARANTICON
      </span>
    </div>
  );
};