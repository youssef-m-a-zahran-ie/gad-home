"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "./cart";
import { freshCart } from "./actions";

/** Once per visit to the cart/checkout: update prices and stock, drop products that are gone. Returns notes to show. */
export function useCartSync() {
  const { items, ready, refresh, setQty, remove } = useCart();
  const [notes, setNotes] = useState<string[]>([]);
  const [synced, setSynced] = useState(false);
  const done = useRef(false);

  useEffect(() => {
    if (!ready || done.current) return;
    done.current = true;
    if (!items.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- nothing to check
      setSynced(true);
      return;
    }
    freshCart(items.map((i) => i.id))
      .then((fresh) => {
        const out: string[] = [];
        for (const it of items) {
          const f = fresh.find((x) => x.id === it.id);
          if (!f || !f.active || f.stock <= 0) {
            remove(it.id);
            out.push(`«${it.name}» خلص من المخزون واتشال من السلة.`);
            continue;
          }
          if (f.price !== it.price) out.push(`سعر «${f.name}» اتغير وبقى ${f.price} جنيه.`);
          // Refresh details without changing the quantity, then cap to stock.
          refresh({ id: f.id, slug: f.slug, name: f.name, price: f.price, image: f.image, stock: f.stock });
          if (it.qty > f.stock) {
            setQty(it.id, f.stock);
            out.push(`المتاح من «${f.name}» ${f.stock} بس، فعدّلنا الكمية.`);
          }
        }
        setNotes(out);
      })
      .catch(() => {})
      .finally(() => setSynced(true));
  }, [ready, items, refresh, setQty, remove]);

  return { notes, synced };
}
