/** Rutas canónicas del dashboard (prefijadas por aplicación). */
export const routes = {
  hub: "/",
  /** Portal público: el aspirante actualiza sus datos con cédula + fecha de nacimiento. */
  actualizarDatos: "/actualizar-datos",
  personal: {
    home: "/personal",
    aspirantes: "/personal/aspirantes",
    aspirantesGestion: "/personal/aspirantes/gestion",
    aspirante: (id: string) => `/personal/aspirantes/${encodeURIComponent(id)}`,
    efemerides: "/personal/efemerides",
    esquelas: "/personal/esquelas",
    esquelasPlantilla: "/personal/esquelas/plantilla",
    esquela: (id: string) => `/personal/esquelas/${encodeURIComponent(id)}`,
    permisos: "/personal/permisos",
    convocatorias: "/personal/convocatorias",
    membretes: "/personal/membretes",
    manual: "/personal/manual",
  },
  sistema: {
    home: "/sistema",
    usuarios: "/sistema/usuarios",
    roles: "/sistema/roles",
    auditoria: "/sistema/auditoria",
  },
  inventario: {
    home: "/inventario",
    rancho: "/inventario/rancho",
    ranchoReportes: "/inventario/rancho/reportes",
  },
} as const;

export const personalPathPrefixes = [
  routes.personal.home,
  routes.personal.aspirantes,
  routes.personal.efemerides,
  routes.personal.esquelas,
  routes.personal.permisos,
  routes.personal.convocatorias,
  routes.personal.membretes,
  routes.personal.manual,
] as const;

export const sistemaPathPrefixes = [
  routes.sistema.home,
  routes.sistema.usuarios,
  routes.sistema.auditoria,
] as const;

export const inventarioPathPrefixes = [
  routes.inventario.home,
  routes.inventario.rancho,
  routes.inventario.ranchoReportes,
] as const;
