/** Rutas canónicas del dashboard (prefijadas por aplicación). */
export const routes = {
  hub: "/",
  personal: {
    home: "/personal",
    aspirantes: "/personal/aspirantes",
    aspirantesGestion: "/personal/aspirantes/gestion",
    aspirante: (id: string) => `/personal/aspirantes/${encodeURIComponent(id)}`,
    efemerides: "/personal/efemerides",
    esquelas: "/personal/esquelas",
    esquela: (id: string) => `/personal/esquelas/${encodeURIComponent(id)}`,
    convocatorias: "/personal/convocatorias",
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
  routes.personal.convocatorias,
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
