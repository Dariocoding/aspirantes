-- Textos editables de la boleta individual de un permiso.
CREATE TABLE "FormatoPermiso" (
    "id" TEXT NOT NULL,
    "lineas" TEXT[],
    "logoIzq" TEXT NOT NULL DEFAULT 'ejercito',
    "logoDer" TEXT NOT NULL DEFAULT 'cefoa',
    "titulo" TEXT NOT NULL DEFAULT 'BOLETA DE PERMISO',
    "compania" TEXT NOT NULL DEFAULT '',
    "firmanteNombre" TEXT NOT NULL DEFAULT '',
    "firmanteCargo" TEXT NOT NULL DEFAULT '',
    "nota" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormatoPermiso_pkey" PRIMARY KEY ("id")
);

INSERT INTO "FormatoPermiso" (
    "id",
    "lineas",
    "logoIzq",
    "logoDer",
    "titulo",
    "compania",
    "firmanteNombre",
    "firmanteCargo",
    "nota",
    "updatedAt"
) VALUES (
    'formato_permiso',
    ARRAY[
        'República Bolivariana de Venezuela',
        'Ministerio del Poder Popular para la Defensa',
        'Ejército Bolivariano',
        'Dirección de Educación del Ejército',
        'Curso Especial de Formación de Oficiales en la Categoría de Asimilado y Asimilado Técnico Nro. 46'
    ],
    'ejercito',
    'cefoa',
    'BOLETA DE PERMISO',
    '',
    '',
    'DIRECTOR DEL CURSO ESPECIAL DE FORMACIÓN DE OFICIALES ASIMILADO Y ASIMILADO TÉCNICO',
    'NOTA: EN CASO DE EMERGENCIA POR FAVOR COMUNICARSE AL NÚMERO TELEFÓNICO INSTITUCIONAL. EL ASPIRANTE DEBERÁ TRAER LA COPIA DE LA CÉDULA DE SU REPRESENTANTE Y SUS ÚTILES PERSONALES COMPLETOS.',
    CURRENT_TIMESTAMP
);
