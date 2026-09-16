import Image from "next/image";
import {
  INSTITUTION_LOGO_SRC,
  INSTITUTION_SHORT_NAME,
} from "@src/lib/branding";
import { cn } from "@src/lib/utils";

const sizeClass = {
  sm: "h-8 w-8",
  md: "h-11 w-11",
  lg: "h-[8.75rem] w-[8.75rem]",
  xl: "h-40 w-40 sm:h-48 sm:w-48",
} as const;

type CefoaCrestProps = {
  size?: keyof typeof sizeClass;
  className?: string;
  priority?: boolean;
  decorative?: boolean;
};

export function CefoaCrest({
  size = "lg",
  className,
  priority,
  decorative = false,
}: CefoaCrestProps) {
  return (
    <Image
      src={INSTITUTION_LOGO_SRC}
      alt={decorative ? "" : INSTITUTION_SHORT_NAME}
      width={512}
      height={512}
      priority={priority}
      className={cn(
        "object-contain object-center drop-shadow-[0_8px_24px_rgba(0,0,0,0.55)]",
        sizeClass[size],
        className,
      )}
    />
  );
}
