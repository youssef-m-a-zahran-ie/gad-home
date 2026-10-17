"use client";

import { useState } from "react";
import { ActionForm, Field, SubmitButton } from "@/components/admin/form-bits";
import { createAdminAccount, signIn } from "./actions";

type Mode = "signin" | "setup" | "reset";

export function LoginPanel({ notice }: { notice: string | null }) {
  const [mode, setMode] = useState<Mode>("signin");
  const title = mode === "signin" ? "تسجيل الدخول" : mode === "setup" ? "أول مرة؟ اعمل الحساب" : "نسيت الباسورد";

  return (
    <div className="card grid gap-5 p-6 shadow-lg">
      <h1 className="text-[26px]">{title}</h1>
      {notice && mode === "signin" && <p className="rounded-xl bg-warn-bg px-4 py-3 text-[17px] font-bold text-warn">{notice}</p>}

      {mode === "signin" && (
        <ActionForm action={signIn} className="grid gap-4">
          {(s) => (
            <>
              <Field label="الإيميل" htmlFor="email" error={s?.errors?.email}>
                <input id="email" className="input" type="email" name="email" autoComplete="email" dir="ltr" required />
              </Field>
              <Field label="الباسورد" htmlFor="password" error={s?.errors?.password}>
                <input id="password" className="input" type="password" name="password" autoComplete="current-password" dir="ltr" required />
              </Field>
              <SubmitButton pending="بيدخل…">دخول</SubmitButton>
            </>
          )}
        </ActionForm>
      )}

      {mode === "setup" && (
        <ActionForm action={createAdminAccount} className="grid gap-4">
          {(s) => (
            <>
              <p className="text-[17px] text-muted">اكتب إيميل الأدمن واختار باسورد.</p>
              <Field label="الإيميل" htmlFor="s-email" error={s?.errors?.email}>
                <input id="s-email" className="input" type="email" name="email" autoComplete="email" dir="ltr" required />
              </Field>
              <Field label="الباسورد" htmlFor="s-pass" hint="٨ حروف أو أرقام على الأقل" error={s?.errors?.password}>
                <input id="s-pass" className="input" type="password" name="password" autoComplete="new-password" minLength={8} dir="ltr" required />
              </Field>
              <Field label="اكتب الباسورد تاني" htmlFor="s-confirm" error={s?.errors?.confirm}>
                <input id="s-confirm" className="input" type="password" name="confirm" autoComplete="new-password" dir="ltr" required />
              </Field>
              <Field label="كود الإعداد" htmlFor="s-code" hint="الكود اللي صاحب المتجر حاطه للإعداد" error={s?.errors?.code}>
                <input id="s-code" className="input" type="password" name="code" dir="ltr" autoComplete="off" required />
              </Field>
              <SubmitButton pending="بيتعمل…">اعمل الحساب</SubmitButton>
            </>
          )}
        </ActionForm>
      )}

      {mode === "reset" && (
        <p className="text-[17px] leading-8 text-muted">
          لو نسيت الباسورد، اطلب من أدمن تاني يفتح «الإعدادات» ويشيلك ويضيفك من جديد بباسورد جديد.
        </p>
      )}

      <div className="flex flex-wrap justify-between gap-2 border-t border-line pt-4 text-[17px]">
        {mode !== "signin" ? (
          <button type="button" className="font-bold text-blue hover:underline" onClick={() => setMode("signin")}>
            رجوع لتسجيل الدخول
          </button>
        ) : (
          <>
            <button type="button" className="font-bold text-blue hover:underline" onClick={() => setMode("setup")}>
              أول مرة؟ اعمل الحساب
            </button>
            <button type="button" className="text-muted hover:underline" onClick={() => setMode("reset")}>
              نسيت الباسورد
            </button>
          </>
        )}
      </div>
    </div>
  );
}
