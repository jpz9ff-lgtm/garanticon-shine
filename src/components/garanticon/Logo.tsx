import { cn } from "@/lib/utils";
import logoSrc from "@/assets/logo-v2.png";

interface LogoProps {
  className?: string;
  /** Kept for API compatibility — the image logo is the same on light & dark backgrounds. */
  variant?: "light" | "dark";
  size?: "sm" | "lg" | "xl";
  priority?: boolean;
}

const sizes = {
  sm: "max-w-32 md:max-w-36",
  lg: "max-w-28 md:max-w-32",
  xl: "max-w-[240px] max-h-[120px]",
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
      className={cn("block h-auto w-auto max-w-full select-none object-contain aspect-auto saturate-[1.4] brightness-[1.05]", sizes[size], className)}
    />
  );
};