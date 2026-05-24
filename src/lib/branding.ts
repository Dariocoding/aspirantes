/** Logo institucional en `public/images/` (WebP para Next/Image). Para PDF ver `readInstitutionLogoPngBuffer` → `ejercito_logo_print.png`. */
export const INSTITUTION_LOGO_SRC = "/images/ejercito_logo.webp";

/** Tricolor institucional (misma referencia en sidebar, login y demás cromo FANB). */
export const FANB_FLAG_HEX = {
  yellow: "#ffcf00",
  blue: "#00247e",
  red: "#cf142b",
} as const;

/**
 * Degradado del shell de la aplicación (sidebar, drawer móvil, tarjeta de acceso).
 * Mantener alineado con el login: misma familia cromática.
 */
export const FANB_APP_SHELL_GRADIENT =
  "bg-gradient-to-b from-[#0a1812] via-[#0b1520] to-[#080f16]";

/** Superposición oscura sobre la fotografía de fondo del login (contraste con UI clara alrededor). */
export const FANB_LOGIN_PHOTO_OVERLAY =
  "bg-gradient-to-b from-[#0a1812]/80 via-slate-950/65 to-[#080f16]/88";

/** Tarjeta / panel oscuro con acentos ámbar (formulario de acceso; página de login puede ir clara alrededor). */
export const FANB_INSTITUTION_PANEL =
  "border border-amber-900/35 bg-white text-slate-950 ring-1 ring-amber-500/15 backdrop-blur-md";
