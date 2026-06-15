import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Variable de entorno obligatoria: ${name}`);
  return value;
}

function s3EndpointUrl(): string {
  const host = requireEnv("S3_ENDPOINT").replace(/^https?:\/\//, "");
  const useSsl = process.env.S3_USE_SSL !== "false";
  const port = process.env.S3_PORT?.trim();
  const protocol = useSsl ? "https" : "http";
  if (port && port !== "443" && port !== "80") {
    return `${protocol}://${host}:${port}`;
  }
  return `${protocol}://${host}`;
}

let client: S3Client | null = null;

export function getS3Client(): S3Client {
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: s3EndpointUrl(),
      credentials: {
        accessKeyId: requireEnv("S3_ACCESS_KEY"),
        secretAccessKey: requireEnv("S3_SECRET_KEY"),
      },
    });
  }
  return client;
}

export function getS3BucketName(): string {
  return requireEnv("S3_BUCKET_NAME");
}

export async function putObject(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  await getS3Client().send(
    new PutObjectCommand({
      Bucket: getS3BucketName(),
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export async function deleteObject(key: string): Promise<void> {
  await getS3Client().send(
    new DeleteObjectCommand({
      Bucket: getS3BucketName(),
      Key: key,
    }),
  );
}

export async function getPresignedGetUrl(key: string, expiresInSeconds = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: getS3BucketName(),
    Key: key,
  });
  return getSignedUrl(getS3Client(), command, { expiresIn: expiresInSeconds });
}
