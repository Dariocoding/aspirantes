/**
 * Quita las marcas de rol desde el día 17 de noviembre 2026.
 * npx tsx scripts/_borrar-roles-desde-17.ts
 * npx tsx scripts/_borrar-roles-desde-17.ts --apply
 */
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const ANIO = 2026;
const MES = 11;
const DESDE = 17;
const apply = process.argv.includes("--apply");

type SqlResult = {
  rows: Array<Record<string, unknown>>;
  rowCount: number;
};

async function sql(query: string, params: unknown[] = []): Promise<SqlResult> {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("Falta DATABASE_URL");
  const url = new URL(raw);
  url.hostname = url.hostname.replace("-pooler", "");
  const response = await fetch(`https://${url.hostname}/sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Neon-Connection-String": url.toString(),
    },
    body: JSON.stringify({ query, params }),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`SQL ${response.status}: ${text.slice(0, 500)}`);
  return JSON.parse(text) as SqlResult;
}

async function main() {
  const meses = await sql(`
    SELECT p.anio, p.mes, COUNT(*)::int AS asignaciones
    FROM "AsignacionRolServicio" a
    JOIN "PlanRolServicio" p ON p.id = a."planId"
    WHERE EXISTS (
      SELECT 1
      FROM jsonb_array_elements(a.dias::jsonb) elem
      WHERE (elem->>'dia')::int >= $1
    )
    GROUP BY p.anio, p.mes
    ORDER BY p.anio, p.mes
  `, [DESDE]);
  console.log("Meses con marcas desde el día", DESDE);
  console.log(meses.rows);

  const detalle = await sql(`
    SELECT
      p.nombre AS rol,
      p.sellado,
      a.grado,
      a.nombre,
      (
        SELECT string_agg(elem->>'dia' || ':' || (elem->>'marca'), ', ' ORDER BY (elem->>'dia')::int)
        FROM jsonb_array_elements(a.dias::jsonb) elem
        WHERE (elem->>'dia')::int >= $1
      ) AS salen
    FROM "AsignacionRolServicio" a
    JOIN "PlanRolServicio" p ON p.id = a."planId"
    WHERE p.anio = $2 AND p.mes = $3
      AND EXISTS (
        SELECT 1
        FROM jsonb_array_elements(a.dias::jsonb) elem
        WHERE (elem->>'dia')::int >= $1
      )
    ORDER BY p.nombre, a.orden
  `, [DESDE, ANIO, MES]);

  console.log(`\nNoviembre ${ANIO}: ${detalle.rowCount} personas con marcas desde el ${DESDE}`);
  for (const row of detalle.rows) {
    console.log(`${row.sellado ? "[SELLADO] " : ""}${row.rol} | ${row.grado} ${row.nombre} | ${row.salen}`);
  }

  if (!apply) {
    console.log("\nVista previa. Sin cambios.");
    return;
  }

  const sellados = detalle.rows.filter((row) => row.sellado === true);
  if (sellados.length > 0) {
    throw new Error("Hay planes sellados. No se borra.");
  }

  const updated = await sql(`
    UPDATE "AsignacionRolServicio" a
    SET dias = COALESCE((
      SELECT jsonb_agg(elem ORDER BY (elem->>'dia')::int)
      FROM jsonb_array_elements(a.dias::jsonb) elem
      WHERE (elem->>'dia')::int < $1
    ), '[]'::jsonb),
    "updatedAt" = NOW()
    FROM "PlanRolServicio" p
    WHERE a."planId" = p.id
      AND p.anio = $2
      AND p.mes = $3
      AND p.sellado = false
      AND EXISTS (
        SELECT 1
        FROM jsonb_array_elements(a.dias::jsonb) elem
        WHERE (elem->>'dia')::int >= $1
      )
    RETURNING a.id
  `, [DESDE, ANIO, MES]);

  const deleted = await sql(`
    DELETE FROM "AsignacionRolServicio" a
    USING "PlanRolServicio" p
    WHERE a."planId" = p.id
      AND p.anio = $1
      AND p.mes = $2
      AND p.sellado = false
      AND jsonb_typeof(a.dias::jsonb) = 'array'
      AND jsonb_array_length(a.dias::jsonb) = 0
    RETURNING a.id
  `, [ANIO, MES]);

  await sql(`
    WITH ordenado AS (
      SELECT a.id, ROW_NUMBER() OVER (PARTITION BY a."planId" ORDER BY a.orden, a."createdAt") AS nuevo
      FROM "AsignacionRolServicio" a
      JOIN "PlanRolServicio" p ON p.id = a."planId"
      WHERE p.anio = $1 AND p.mes = $2
    )
    UPDATE "AsignacionRolServicio" a
    SET orden = ordenado.nuevo
    FROM ordenado
    WHERE a.id = ordenado.id
      AND a.orden <> ordenado.nuevo
  `, [ANIO, MES]);

  const queda = await sql(`
    SELECT COUNT(*)::int AS marcas
    FROM "AsignacionRolServicio" a
    JOIN "PlanRolServicio" p ON p.id = a."planId"
    CROSS JOIN LATERAL jsonb_array_elements(a.dias::jsonb) elem
    WHERE p.anio = $1 AND p.mes = $2
      AND (elem->>'dia')::int >= $3
  `, [ANIO, MES, DESDE]);

  console.log(`\nActualizadas: ${updated.rowCount}`);
  console.log(`Personas eliminadas (sin días): ${deleted.rowCount}`);
  console.log("Marcas que siguen desde el", DESDE, queda.rows[0]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
