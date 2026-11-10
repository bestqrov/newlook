import { useCallback, useEffect, useState } from "react"
import { Plus, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { api, errorText } from "@/lib/api"

export type Hour = { weekday: number; start: string; end: string }
type Booking = { id: string; serviceName: string; price: number; startsAt: string; clientName: string; clientPhone: string; status: string }
type Sub = { status: string; expiresAt: string | null; planName: string | null } | null

const dayNames = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]
const fmt = (iso: string) => new Intl.DateTimeFormat("fr-MA", { dateStyle: "short", timeStyle: "short", timeZone: "Africa/Casablanca" }).format(new Date(iso))
const subLabel: Record<string, string> = { trial: "فترة تجريبية", active: "مفعل", expired: "منتهي", suspended: "موقوف" }

export default function ProBookings({ initialHours, subscription }: { initialHours: Hour[]; subscription: Sub }) {
  const { t } = useTranslation()
  const [hours, setHours] = useState<Hour[]>(initialHours)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [note, setNote] = useState("")

  useEffect(() => setHours(initialHours), [initialHours])
  const load = useCallback(async () => {
    const r = await api<{ bookings: Booking[] }>("/api/me/bookings")
    setBookings(r.bookings)
  }, [])
  useEffect(() => { void load().catch(() => {}) }, [load])

  const saveHours = async () => {
    setNote("")
    try { await api("/api/me/hours", { method: "PUT", body: { hours } }); setNote("تحفظو أوقات العمل.") }
    catch (e) { setNote(errorText(e, "ما تحفظوش أوقات العمل. تأكد أن الفترات ما متداخلاش.")) }
  }
  const setStatus = async (id: string, status: string) => {
    try { await api(`/api/me/bookings/${id}`, { method: "PATCH", body: { status } }); setBookings((p) => p.map((x) => (x.id === id ? { ...x, status } : x))) }
    catch (e) { setNote(errorText(e)) }
  }
  const statusText = (s: string) => (s === "pending" ? t("فالانتظار") : s === "confirmed" ? t("مؤكد") : s === "cancelled" ? t("ملغى") : t("تم"))
  const addRange = (weekday: number) => setHours((p) => [...p, { weekday, start: p.some((h) => h.weekday === weekday) ? "15:00" : "09:00", end: p.some((h) => h.weekday === weekday) ? "19:00" : "13:00" }])
  const patch = (i: number, v: Partial<Hour>) => setHours((p) => p.map((h, j) => (j === i ? { ...h, ...v } : h)))
  const remove = (i: number) => setHours((p) => p.filter((_, j) => j !== i))

  return <section className="mt-8 border border-border bg-card p-6">
    <h2 className="text-2xl">{t("المواعيد وأوقات العمل")}</h2>
    {subscription && <p className="mt-2 text-sm text-muted-foreground">{t("الاشتراك:")} <strong className="text-foreground">{subscription.planName ?? "—"} · {t(subLabel[subscription.status] ?? subscription.status)}</strong>{subscription.expiresAt && <> · {t("ينتهي")} {new Date(subscription.expiresAt).toLocaleDateString("fr-MA")}</>}</p>}
    <div className="mt-5 grid gap-6 lg:grid-cols-2">
      <div><h3 className="font-semibold">{t("أوقات العمل الأسبوعية")}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{t("تقدر تزيد أكثر من فترة فالنهار (مثلاً استراحة الغدا).")}</p>
        <ul className="mt-3 space-y-3 text-sm">{dayNames.map((d, wd) => <li key={wd}>
          <div className="flex items-center justify-between"><span className="w-24 font-semibold">{t(d)}</span><button type="button" onClick={() => addRange(wd)} className="inline-flex items-center gap-1 text-xs text-primary"><Plus size={13} />{t("فترة")}</button></div>
          {hours.map((h, i) => h.weekday === wd && <div key={i} className="mt-1 flex items-center gap-2"><input type="time" value={h.start} onChange={(e) => patch(i, { start: e.target.value })} className="border border-border bg-background p-1" /><span>→</span><input type="time" value={h.end} onChange={(e) => patch(i, { end: e.target.value })} className="border border-border bg-background p-1" /><button type="button" onClick={() => remove(i)} aria-label={t("حذف")} className="text-destructive"><X size={14} /></button></div>)}
          {!hours.some((h) => h.weekday === wd) && <p className="mt-1 text-xs text-muted-foreground">{t("مسدود")}</p>}
        </li>)}</ul>
        <button onClick={() => void saveHours()} className="mt-4 bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">{t("حفظ أوقات العمل")}</button>
        {note && <p role="status" className="mt-2 text-sm">{t(note)}</p>}
      </div>
      <div><h3 className="font-semibold">{t("طلبات الحجز")}</h3>
        {bookings.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">{t("ما كاين حتى حجز دابا.")}</p> : <ul className="mt-3 divide-y divide-border text-sm">{bookings.map((b) => <li key={b.id} className="py-3"><div className="flex justify-between gap-2"><strong>{b.clientName}</strong><span className="text-xs text-muted-foreground">{statusText(b.status)}</span></div><p className="text-muted-foreground">{b.serviceName} · {b.price} {t("درهماً")} · {fmt(b.startsAt)}</p><a href={`tel:${b.clientPhone}`} dir="ltr" className="block text-start text-xs">{b.clientPhone}</a>
          <div className="mt-2 flex gap-3 text-xs">{b.status === "pending" && <button onClick={() => void setStatus(b.id, "confirmed")} className="text-primary">{t("تأكيد")}</button>}{(b.status === "pending" || b.status === "confirmed") && <button onClick={() => void setStatus(b.id, "cancelled")} className="text-destructive">{t("إلغاء")}</button>}{b.status === "confirmed" && <button onClick={() => void setStatus(b.id, "done")} className="text-muted-foreground">{t("تم")}</button>}</div></li>)}</ul>}
      </div>
    </div>
  </section>
}
