/**
 * Borra del bucket todas las fotos de cédula y fondo negro (título)
 * y deja `fotoCedulaKey` / `fotoTituloKey` en null.
 * No toca fotos de perfil (`fotoKey`).
 *
 * Ejecutar: npx tsx prisma/clear-aspirante-cedula-titulo-fotos.ts
 */
import { DeleteObjectsCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import { PrismaClient } from "../src/generated/prisma";
import { getS3BucketName, getS3Client } from "../src/lib/storage/s3";

dotenv.config({ path: ".env.local" });
dotenv.config();

const prisma = new PrismaClient();

const DOC_KEY = /^aspirantes\/[^/]+\/(cedula|titulo)\.[A-Za-z0-9]+$/;

function isDocFotoKey(key: string): boolean {
  return DOC_KEY.test(key);
}

async function listDocKeysInBucket(): Promise<string[]> {
  const client = getS3Client();
  const Bucket = getS3BucketName();
  const keys: string[] = [];
  let ContinuationToken: string | undefined;

  do {
    const res = await client.send(
      new ListObjectsV2Command({
        Bucket,
        Prefix: "aspirantes/",
        ContinuationToken,
      }),
    );
    for (const obj of res.Contents ?? []) {
      if (obj.Key && isDocFotoKey(obj.Key)) keys.push(obj.Key);
    }
    ContinuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (ContinuationToken);

  return keys;
}

async function deleteKeys(keys: string[]): Promise<{ ok: number; failed: string[] }> {
  const client = getS3Client();
  const Bucket = getS3BucketName();
  const unique = Array.from(new Set(keys.filter(isDocFotoKey)));
  let ok = 0;
  const failed: string[] = [];

  for (let i = 0; i < unique.length; i += 1000) {
    const chunk = unique.slice(i, i + 1000);
    const res = await client.send(
      new DeleteObjectsCommand({
        Bucket,
        Delete: { Objects: chunk.map((Key) => ({ Key })), Quiet: true },
      }),
    );
    const errors = res.Errors ?? [];
    for (const err of errors) {
      if (err.Key) failed.push(err.Key);
    }
    ok += chunk.length - errors.length;
  }

  return { ok, failed };
}

async function main() {
  const rows = await prisma.aspirante.findMany({
    where: {
      OR: [{ fotoCedulaKey: { not: null } }, { fotoTituloKey: { not: null } }],
    },
    select: { id: true, fotoCedulaKey: true, fotoTituloKey: true },
  });

  const dbKeys = rows.flatMap((r) => [r.fotoCedulaKey, r.fotoTituloKey]).filter((k): k is string => Boolean(k));
  const bucketKeys = await listDocKeysInBucket();
  const allKeys = Array.from(new Set([...dbKeys, ...bucketKeys]));

  console.log(`Aspirantes con cédula o fondo negro en BD: ${rows.length}`);
  console.log(`Claves en BD: ${dbKeys.length}`);
  console.log(`Objetos cédula/título en bucket: ${bucketKeys.length}`);
  console.log(`Total a borrar (unión): ${allKeys.length}`);

  const { ok, failed } = await deleteKeys(allKeys);
  console.log(`Borrados del bucket: ${ok}`);
  if (failed.length) {
    console.warn(`Fallaron ${failed.length} objetos:`, failed.slice(0, 20));
  }

  const updated = await prisma.aspirante.updateMany({
    where: {
      OR: [{ fotoCedulaKey: { not: null } }, { fotoTituloKey: { not: null } }],
    },
    data: {
      fotoCedulaKey: null,
      fotoTituloKey: null,
    },
  });
  console.log(`Filas actualizadas (campos vacíos): ${updated.count}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
