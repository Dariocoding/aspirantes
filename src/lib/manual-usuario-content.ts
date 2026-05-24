/**
 * Contenido del manual de usuario (web y PDF).
 * Mantener sincronizado con permisos y `writeAuditLog` en el código.
 */

export const MANUAL_USUARIO_TITLE = "Manual de usuario";
export const MANUAL_USUARIO_SUBTITLE =
  "Sistema de censo y administración de aspirantes — FANB / Ejército Bolivariano";

export type ManualUsuarioSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export const manualUsuarioIntro: string[] = [
  "Este documento resume qué puede hacer cada rol en la aplicación y qué acciones quedan registradas en el módulo de Auditoría.",
  "El censo y las cifras del panel principal dependen de que exista una convocatoria marcada como activa. Si no hay convocatoria activa, verá avisos en pantalla y el censo puede mostrarse vacío en las vistas filtradas por la convocatoria en curso.",
  "Si intenta una acción o una ruta no permitida para su rol, el sistema lo redirige a la pantalla de permisos (por ejemplo, motivo de escritura o de administración).",
];

export const manualUsuarioSections: ManualUsuarioSection[] = [
  {
    id: "consulta",
    title: "Rol: Solo consulta",
    paragraphs: [
      "Puede ver el panel principal (dashboard), el listado del censo de aspirantes con filtros y búsqueda, y las secciones de Efemérides y Esquelas en modo solo lectura.",
      "No puede registrar, editar ni eliminar aspirantes. No puede exportar el censo en Excel ni en PDF. No tiene acceso a Convocatorias, Usuarios ni Auditoría.",
    ],
  },
  {
    id: "operador",
    title: "Rol: Operador",
    paragraphs: [
      "Incluye todo lo del rol Solo consulta, y además puede dar de alta, modificar y eliminar aspirantes (registro y actualización), exportar el censo en formato XLSX o PDF según los filtros aplicados, y crear o editar efemérides y esquelas.",
      "No gestiona convocatorias ni cuentas de usuario, y no ve el listado de auditoría.",
    ],
    bullets: [
      "Alta de aspirante — auditado como ASPIRANTE_CREATE (cédula y convocatoria en metadatos).",
      "Actualización de aspirante — ASPIRANTE_UPDATE.",
      "Eliminación de aspirante — ASPIRANTE_DELETE.",
      "Exportación de censo XLSX o PDF — CENSO_EXPORT_XLSX o CENSO_EXPORT_PDF (convocatoria, formato y cantidad de filas).",
    ],
  },
  {
    id: "admin",
    title: "Rol: Administrador",
    paragraphs: [
      "Incluye las capacidades del Operador y, además, administra convocatorias (crear, editar, eliminar y activar la convocatoria en curso), gestiona usuarios con roles Administrador, Operador o Solo consulta (no puede gestionar cuentas Super administrador), y consulta el módulo de Auditoría.",
    ],
    bullets: [
      "Crear convocatoria — CONVOCATORIA_CREATE o CONVOCATORIA_CREATE_ACTIVA si queda activa al crear.",
      "Editar convocatoria — CONVOCATORIA_UPDATE.",
      "Eliminar convocatoria — CONVOCATORIA_DELETE.",
      "Activar una convocatoria — CONVOCATORIA_ACTIVAR.",
    ],
  },
  {
    id: "super",
    title: "Rol: Super administrador",
    paragraphs: [
      "Mismo ámbito operativo que Administrador en el menú, con la diferencia de que puede asignar el rol Super administrador y gestionar cuentas con ese rol. Los eventos que el sistema registra en auditoría son los mismos que para Administrador y Operador en sus respectivos ámbitos.",
    ],
  },
  {
    id: "auditoria-detalle",
    title: "Auditoría: datos guardados y límites",
    paragraphs: [
      "Cada registro de auditoría incluye, cuando la petición lo permite: usuario, correo, fecha y hora, tipo de entidad, acción, identificador de entidad, metadatos resumidos, dirección IP y agente de usuario (navegador).",
      "Hoy no se escriben registros de auditoría automáticos por cambios en usuarios (altas, roles, desactivación), efemérides ni esquelas; tampoco por intentos de acceso denegado. Si necesita trazabilidad formal en esos módulos, debe acordarse un procedimiento manual o una ampliación futura del software.",
    ],
  },
];

/** Tabla resumen para web y PDF. */
export const manualUsuarioResumenRoles: { rol: string; censo: string; export: string; config: string }[] = [
  { rol: "Solo consulta", censo: "Solo lectura", export: "No", config: "No" },
  { rol: "Operador", censo: "Lectura y edición", export: "Sí", config: "No" },
  { rol: "Administrador", censo: "Lectura y edición", export: "Sí", config: "Sí (convocatorias, usuarios, auditoría)" },
  { rol: "Super administrador", censo: "Lectura y edición", export: "Sí", config: "Sí + gestión de supers" },
];
