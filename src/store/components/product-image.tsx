import { mediaUrl } from "@/lib/media";
import { BoxIcon } from "./icons";

/** Product photo on a white square, or a calm placeholder when there's no photo yet. */
export function ProductImage({
  path,
  alt,
  className = "",
  eager = false,
}: {
  path: string | null | undefined;
  alt: string;
  className?: string;
  eager?: boolean;
}) {
  const src = mediaUrl(path);
  if (!src) {
    return (
      <div className={`grid place-items-center bg-sky text-navy/40 ${className}`} role="img" aria-label={alt}>
        <BoxIcon size={56} strokeWidth={1.4} />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      className={`bg-white object-contain ${className}`}
    />
  );
}
