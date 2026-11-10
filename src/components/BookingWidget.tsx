import { useEffect, useMemo, useState } from "react"
import { CalendarCheck, CheckCircle2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { api, errorText, qs } from "@/lib/api"
import { isValidPhone } from "@/lib/catalog"

type Service = { id: string; name: string; durationMinutes: number; price: number }
const TZ = "Africa/Casablanca"
const fmtTime = (iso: string) => new Intl.DateTimeFormat("fr-MA", { hour: "2-digit", minute: "2-digit", timeZone: TZ }).format(new Date(iso))
// YYYY-MM-DD of a date as seen in Casablanca (not the visitor's own timezone).
const dayKey = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d)

export default function BookingWidget({ businessId, services }: { businessId: string; services: Service[] }) {
  const { t, i18n } = useTranslation()
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "")
  const [day, setDay] = useState(0)
  const [slots, setSlots] = useState<string[]>([])
  const [slot, setSlot] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [website, setWebsite] = useState("") // honeypot (hidden from humans)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState("")
  const [done, setDone] = useState(false)
  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => new Date(Date.now() + i * 86400_000)), [])

  useEffect(() => {
    if (!serviceId) return
    let active = true
    setSlot(""); setSlots([])
    api<{ slots: string[] }>(`/api/businesses/${businessId}/slots?${qs({ service: serviceId, day: dayKey(days[day]) })}`)
      .then((r) => { if (active) setSlots(r.slots) }).catch(() => {})
    return () => { active = false }
  }, [businessId, serviceId, day, days, done])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!slot) { setMsg("اختار ساعة من الساعات المتاحة."); return }
    if (!isValidPhone(phone)) { setMsg("رقم الهاتف ماشي صحيح (مثال: 0612345678)."); return }
    setBusy(true); setMsg("")
    try {
      await api(`/api/businesses/${businessId}/bookings`, { body: { serviceId, startsAt: slot, name, phone, ...(website ? { website } : {}) } })
      setDone(true); setName(""); setPhone(""); setSlot("")
    } catch (err) { setMsg(errorText(err, "هاد الوقت ما بقاش متاح أو المعلومات ناقصة. جرّب وقت آخر.")) }
    finally { setBusy(false) }
  }

  if (services.length === 0) return null
  return <section id="booking" className="mt-8 border border-border bg-card p-5">
    <h2 className="flex items-center gap-2 text-2xl"><CalendarCheck size={20} className="text-primary" />{t("احجز موعدك")}</h2>
    {done && <p role="status" className="mt-4 flex items-start gap-2 bg-muted p-3 text-sm"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-primary" />{t("توصل الطلب ديالك. المهني غادي يأكد ليك الموعد.")}</p>}
    <form onSubmit={(e) => void submit(e)} className="mt-4 space-y-3 text-sm">
      <select value={serviceId} onChange={(e) => { setServiceId(e.target.value); setDone(false) }} className="w-full border border-border bg-background p-3">{services.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.price} {t("درهماً")} · {s.durationMinutes} {t("دقيقة")}</option>)}</select>
      <div className="flex gap-2 overflow-x-auto pb-1">{days.map((d, i) => <button type="button" key={i} onClick={() => { setDay(i); setDone(false) }} className={`min-w-16 border p-2 text-center text-xs transition-colors ${i === day ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"}`}><span className="block">{d.toLocaleDateString(i18n.language || "ar", { weekday: "short", timeZone: TZ })}</span><strong className="text-base">{d.toLocaleDateString("en", { day: "numeric", timeZone: TZ })}</strong></button>)}</div>
      {slots.length === 0 ? <p className="text-muted-foreground">{t("ما كاين حتى وقت متاح هاد النهار.")}</p> : <div className="grid grid-cols-4 gap-2">{slots.map((s) => <button type="button" key={s} onClick={() => setSlot(s)} className={`border p-2 transition-colors ${slot === s ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary"}`}>{fmtTime(s)}</button>)}</div>}
      <input required minLength={2} maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder={t("اسمك")} autoComplete="name" className="w-full border border-border bg-background p-3" />
      <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="06…" inputMode="tel" autoComplete="tel" className="w-full border border-border bg-background p-3" />
      <input tabIndex={-1} autoComplete="off" aria-hidden="true" value={website} onChange={(e) => setWebsite(e.target.value)} className="absolute -left-[9999px] h-0 w-0 opacity-0" />
      <p className="border-s-2 border-primary bg-muted p-3 text-xs leading-5">{t("الدفع كاش فالمحل بعد الخدمة. ما كاين حتى خلاص مسبق.")}</p>
      <button disabled={busy} className="w-full bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-60">{t("تأكيد الحجز")}</button>
      {msg && <p className="text-destructive">{t(msg)}</p>}
    </form>
  </section>
}
