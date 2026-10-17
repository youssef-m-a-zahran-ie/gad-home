/**
 * Public base of the Neon media bucket, e.g. https://br-xxx.storage.c-8.eu-central-1.aws.neon.tech/media
 * New uploads are stored in the database as full URLs under this base.
 */
export const MEDIA_BASE = (process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? "").replace(/\/+$/, "");

/** Old Supabase Storage base: photos uploaded before the move are stored as bare paths and still live there. */
const LEGACY_BASE = (process.env.NEXT_PUBLIC_LEGACY_MEDIA_BASE_URL ?? "").replace(/\/+$/, "");

/** Public URL of a stored file. Full URLs and paths starting with "/" pass through. */
export function mediaUrl(path: string | null | undefined) {
  if (!path) return null;
  if (path.startsWith("/") || /^https?:\/\//.test(path)) return path;
  return `${LEGACY_BASE}/${path}`;
}
