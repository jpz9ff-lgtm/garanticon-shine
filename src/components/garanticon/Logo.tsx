import { cn } from "@/lib/utils";
import logoSrc from "@/assets/logo-v2.png";

interface LogoProps {
  className?: string;
  /** Kept for API compatibility — the image logo is the same on light & dark backgrounds. */
  variant?: "light" | "dark";
  size?: "sm" | "lg" | "xl";
  priority?: boolean;
}

const heights = {
  sm: "h-24 md:h-28",
  lg: "h-12 md:h-14",
  xl: "h-[32rem] md:h-[44rem] lg:h-[56rem] max-h-[80vh]",
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