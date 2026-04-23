import { cn } from "@/lib/utils";
import logoSrc from "@/assets/logo.png";

interface LogoProps {
  className?: string;
  /** Kept for API compatibility — the image logo is the same on light & dark backgrounds. */
  variant?: "light" | "dark";
  size?: "sm" | "lg" | "xl";
  priority?: boolean;
}

const heights = {
  sm: "h-8 md:h-9",
  lg: "h-12 md:h-14",
  xl: "h-64 md:h-80 lg:h-96",
};

export const Logo = ({ className, size = "lg", priority = false }: LogoProps) => {
  return (
    <img
      src={logoSrc}
      alt="Garanticon"
      width={1584}
      height={672}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={cn("w-auto select-none", heights[size], className)}
    />
  );
};