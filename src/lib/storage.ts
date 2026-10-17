import "server-only";
import { AwsClient } from "aws4fetch";
import { MEDIA_BASE } from "./media";

/** Neon Object Storage over S3 (path-style). Credentials are Cloudflare secrets. */
const BUCKET = "media";

function client() {
  const accessKeyId = process.env.STORAGE_ACCESS_KEY_ID;
  const secretAccessKey = process.env.STORAGE_SECRET_ACCESS_KEY;
  const endpoint = process.env.STORAGE_ENDPOINT;
  if (!accessKeyId || !secretAccessKey || !endpoint) throw new Error("Storage is not configured");
  return {
    aws: new AwsClient({ accessKeyId, secretAccessKey, region: process.env.STORAGE_REGION ?? "eu-central-1", service: "s3" }),
    endpoint: endpoint.replace(/\/+$/, ""),
  };
}

/** Uploads bytes and returns the file's public URL (this is what gets stored in the database). */
export async function putPublic(key: string, body: ArrayBuffer, contentType: string): Promise<string> {
  const { aws, endpoint } = client();
  const res = await aws.fetch(`${endpoint}/${BUCKET}/${key}`, {
    method: "PUT",
    body,
    headers: { "content-type": contentType, "cache-control": "public, max-age=31536000, immutable" },
  });
  if (!res.ok) throw new Error(`upload failed: ${res.status}`);
  return `${MEDIA_BASE}/${key}`;
}

/** Deletes files we host in the Neon bucket. Old Supabase paths and foreign URLs are left alone. */
export async function removeFiles(paths: (string | null | undefined)[]) {
  const keys = paths
    .filter((p): p is string => Boolean(p) && p!.startsWith(`${MEDIA_BASE}/`))
    .map((p) => p.slice(MEDIA_BASE.length + 1));
  if (!keys.length) return;
  const { aws, endpoint } = client();
  await Promise.all(
    keys.map((k) => aws.fetch(`${endpoint}/${BUCKET}/${k}`, { method: "DELETE" }).catch(() => null)),
  );
}
