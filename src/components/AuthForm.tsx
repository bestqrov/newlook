import { useState } from "react"
import { useTranslation } from "react-i18next"
import { auth, errorText } from "@/lib/api"

/** E-mail + password sign-in / sign-up for pros and clients. */
export default function AuthForm({ intro }: { intro?: string }) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<"login" | "register">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState("")
  const field = "mt-1 w-full border border-border bg-background p-3"

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg("")
    try {
      if (mode === "register") await auth.register(email, password, name)
      else if ((await auth.login(email, password)) === "mfa") setMsg("هاد الحساب ديال الإدارة. دخل من صفحة الإدارة.")
    } catch (err) { setMsg(errorText(err)) }
    finally { setBusy(false) }
  }

  return <section className="grid gap-8 border border-border bg-card p-6 sm:p-9 md:grid-cols-2">
    <div>
      <h2 className="text-2xl">{mode === "login" ? t("دخول لحسابك") : t("أنشئ حساب جديد")}</h2>
      {intro && <p className="mt-3 text-sm leading-6 text-muted-foreground">{t(intro)}</p>}
      <button type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setMsg("") }} className="mt-5 text-sm font-semibold text-primary">
        {mode === "login" ? t("ما عندكش حساب؟ سجّل دابا") : t("عندك حساب؟ دخل")}
      </button>
    </div>
    <form onSubmit={(e) => void submit(e)} className="space-y-3">
      {mode === "register" && <label className="block text-sm">{t("الاسم الكامل")}<input required minLength={2} maxLength={80} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className={field} /></label>}
      <label className="block text-sm">{t("بريدك الإلكتروني")}<input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} /></label>
      <label className="block text-sm">{t("كلمة المرور")}<input required type="password" minLength={8} maxLength={128} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} className={field} /></label>
      {mode === "register" && <p className="text-xs text-muted-foreground">{t("8 حروف على الأقل.")}</p>}
      <button disabled={busy} className="w-full bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-60">{busy ? t("لحظة...") : mode === "login" ? t("دخول") : t("إنشاء الحساب")}</button>
      {msg && <p role="status" className="text-sm text-destructive">{t(msg)}</p>}
    </form>
  </section>
}
