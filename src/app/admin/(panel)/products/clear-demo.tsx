"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Notice } from "@/components/admin/form-bits";
import type { ActionState } from "@/lib/admin/state";
import { clearDemoData } from "./actions";

export function ClearDemo({ count }: { count: number }) {
  const [sure, setSure] = useState(false);
  const [state, setState] = useState<ActionState>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  if (state?.ok) return <Notice state={state} />;
  return (
    <div className="mb-5 grid gap-3 rounded-2xl border-2 border-warn bg-warn-bg p-4">
      <p className="text-[18px] font-bold text-warn">
        فيه {count} منتج تجريبي (كودهم يبدأ بـ DEMO) وبانرين تجريبيين عشان الموقع يبان مليان. امسحهم أول ما تضيف منتجاتك الحقيقية.
      </p>
      {!sure ? (
        <button type="button" className="btn btn-outline btn-sm w-fit" onClick={() => setSure(true)}>
          امسح البيانات التجريبية
        </button>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[17px] font-bold text-sale">متأكد؟ هيتمسحوا كلهم مرة واحدة.</span>
          <button
            type="button"
            disabled={pending}
            className="btn btn-sm bg-sale text-white"
            onClick={() =>
              start(async () => {
                setState(await clearDemoData());
                router.refresh();
              })
            }
          >
            {pending ? "…" : "أيوه، امسحهم"}
          </button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setSure(false)}>
            لأ
          </button>
        </div>
      )}
      <Notice state={state} />
    </div>
  );
}
