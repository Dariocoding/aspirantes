/** Escudo heráldico del C.E.F.O.A. (PNG sobre campo negro). Para PDF ver `readInstitutionLogoPngBuffer`. */
export const INSTITUTION_LOGO_SRC = "/images/cefoa-logo.png";

export const INSTITUTION_SHORT_NAME = "C.E.F.O.A.";

export const INSTITUTION_NAME =
  "Curso de Especialización para la Formación de Oficiales de Armas";

export const INSTITUTION_BRANCH = "Ejército Bolivariano";

export const INSTITUTION_PRODUCT = "Gestión de personal";

/** Tricolor institucional (misma referencia en sidebar, login y demás cromo). */
export const FANB_FLAG_HEX = {
  yellow: "#ffcf00",
  blue: "#00247e",
  red: "#cf142b",
} as const;

/**
 * Campo del shell: negro de gala alineado al fondo del escudo,
 * con un velo azul militar hacia la base.
 */
export const FANB_APP_SHELL_GRADIENT =
  "bg-linear-to-b from-[#050505] via-[#0a1018] to-[#0c1424]";

/** Superposición oscura sobre la fotografía de fondo del login. */
export const FANB_LOGIN_PHOTO_OVERLAY =
  "bg-linear-to-b from-[#050505]/82 via-[#0a1018]/70 to-[#0c1424]/90";

/** Tarjeta / panel claro con acentos oro (formulario de acceso). */
export const FANB_INSTITUTION_PANEL =
  "border border-amber-900/35 bg-white text-slate-950 ring-1 ring-amber-500/15 backdrop-blur-md";
