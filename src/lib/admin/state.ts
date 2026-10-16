/** What every admin form action returns. */
export type ActionState = {
  ok: boolean;
  message?: string;
  /** Field name → error text */
  errors?: Record<string, string>;
  /** Bumped on each success so forms can reset. */
  at?: number;
  /** Optional id of something just created. */
  id?: string;
} | null;

export const ok = (message?: string, id?: string): ActionState => ({ ok: true, message, at: Date.now(), id });
export const fail = (message: string, errors?: Record<string, string>): ActionState => ({ ok: false, message, errors });

/** Turns a Postgres/PostgREST error into Arabic the admin can act on. */
export function friendlyDbError(err: { code?: string; message?: string } | null | undefined): string {
  if (!err) return "حصلت مشكلة. جرب تاني.";
  switch (err.code) {
    case "23505":
      if (err.message?.includes("slug")) return "الاسم ده (أو الرابط) مستخدم قبل كده. غيّره شوية.";
      return "الحاجة دي موجودة قبل كده.";
    case "23503":
      return "مستخدم في حاجة تانية (منتجات أو طلبات). اخفيه بدل ما تمسحه.";
    case "23514":
      return "في رقم أو قيمة مش مسموحة. راجع الخانات.";
    case "42501":
      return "مش مسموح. سجّل دخول تاني.";
    default:
      return err.message || "حصلت مشكلة. جرب تاني.";
  }
}
