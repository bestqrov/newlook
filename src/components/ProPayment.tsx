import { useCallback, useEffect, useState } from "react"
import { UploadCloud } from "lucide-react"
import { useTranslation } from "react-i18next"
import { api, errorText } from "@/lib/api"
import { sanitizeImage } from "@/lib/image"

type Plan = { id: string; name: string; months: number; price: number }
type Pay = { id: string; amount: number; status: string; createdAt: string }

export default function ProPayment({ onPaid }: { onPaid?: () => void }) {
  const { t } = useTranslation()
  const [plans, setPlans] = useState<Plan[]>([])
  const [bank, setBank] = useState("")
  const [pays, setPays] = useState<Pay[]>([])
  const [planId, setPlanId] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState("")

  const load = useCallback(async () => {
    const [p, s, h] = await Promise.all([
      api<{ plans: Plan[] }>("/api/plans"),
      api<{ value: string }>("/api/settings/bank"),
      api<{ payments: Pay[] }>("/api/me/payments"),
    ])
    setPlans(p.plans); setBank(s.value); setPays(h.payments)
    setPlanId((cur) => cur || p.plans[0]?.id || "")
  }, [])
  useEffect(() => { void load().catch(() => {}) }, [load])

  const plan = plans.find((x) => x.id === planId)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!plan || !file) { setNote("اختار الباقة وصورة الوصل."); return }
    setBusy(true); setNote("")
    try {
      const form = new FormData()
      form.append("planId", plan.id)
      // PDFs are sent as-is; photos are re-encoded (removes EXIF/GPS).
      form.append("receipt", file.type === "application/pdf" ? file : await sanitizeImage(file, 2200, 0.9))
      await api("/api/me/payments", { form })
      setFile(null); setNote("توصلنا بالوصل. غادي نتأكدو منو ونفعلو اشتراكك."); void load(); onPaid?.()
    } catch (err) { setNote(errorText(err, "ما قدرناش نرسلو الوصل. جرّب صورة أخرى أو عاود من بعد.")) }
    finally { setBusy(false) }
  }
  const st = (s: string) => (s === "approved" ? t("مقبول") : s === "rejected" ? t("مرفوض") : t("قيد التحقق"))

  return <section className="mt-8 border border-border bg-card p-6">
    <h2 className="text-2xl">{t("تفعيل الاشتراك بالتحويل البنكي")}</h2>
    <p className="mt-2 text-sm text-muted-foreground">{t("حوّل ثمن الباقة لهاد الحساب، من بعد صيفط صورة الوصل. كنتأكدو ونفعلو اشتراكك.")}</p>
    <pre dir="auto" className="mt-4 whitespace-pre-wrap border border-border bg-muted p-4 text-sm leading-7">{bank || t("المعلومات البنكية غادي تزاد قريباً.")}</pre>
    <form onSubmit={(e) => void submit(e)} className="mt-5 space-y-3 text-sm">
      <select value={planId} onChange={(e) => setPlanId(e.target.value)} className="w-full border border-border bg-background p-3">{plans.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.price} {t("درهماً")}</option>)}</select>
      <label className="flex cursor-pointer items-center gap-3 border border-dashed border-border p-4 text-muted-foreground"><UploadCloud size={18} className="text-primary" />{file ? file.name : t("اختار صورة الوصل (أو PDF)")}<input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="sr-only" /></label>
      <button disabled={busy} className="w-full bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-60">{t("إرسال الوصل")}</button>
      {note && <p role="status">{t(note)}</p>}
    </form>
    {pays.length > 0 && <ul className="mt-5 divide-y divide-border text-sm">{pays.map((p) => <li key={p.id} className="flex justify-between py-2"><span>{p.amount} {t("درهماً")} · {new Date(p.createdAt).toLocaleDateString("fr-MA")}</span><strong>{st(p.status)}</strong></li>)}</ul>}
  </section>
}
