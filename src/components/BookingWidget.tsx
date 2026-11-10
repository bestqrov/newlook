import { useEffect, useMemo, useState } from "react"
import { CalendarCheck, CheckCircle2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { api, errorText, qs } from "@/lib/api"
import { isValidPhone } from "@/lib/catalog"
import type { Service } from "@/lib/business-types"

const TZ = "Africa/Casablanca"
const fmtTime = (iso: string) => new Intl.DateTimeFormat("fr-MA", { hour: "2-digit", minute: "2-digit", timeZone: TZ }).format(new Date(iso))
const dayKey = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d)

type Props = {
  businessId: string
  services: Service[]
  /** Services chosen elsewhere (hammam ritual). Overrides the single-service picker. */
  preset?: string[] | null
  onClearPreset?: () => void
  /** Hammam with a women/men schedule: the client must pick one. */
  needsAudience?: boolean
}

export default function BookingWidget({ businessId, services, preset, onClearPreset, needsAudience = false }: Props) {
  const { t, i18n } = useTranslation()
  const [single, setSingle] = useState(services[0]?.id ?? "")
  const [audience, setAudience] = useState<"" | "women" | "men">("")
  const [day, setDay] = useState(0)
  const [slots, setSlots] = useState<string[]>([])
  const [slot, setSlot] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [website, setWebsite] = useState("")
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState("")
  const [done, setDone] = useState(false)
  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => new Date(Date.now() + i * 86400_000)), [])
  const serviceIds = useMemo(() => (preset?.length ? preset : single ? [single] : []), [preset, single])
  const chosen = serviceIds.map((id) => services.find((s) => s.id === id)).filter((s): s is Service => !!s)
  const ready = serviceIds.length > 0 && (!needsAudience || audience !== "")

  useEffect(() => {
    if (!ready) { setSlots([]); return }
    let active = true
    setSlot(""); setSlots([])
    api<{ slots: string[] }>(`/api/businesses/${businessId}/slots?${qs({ services: serviceIds.join(","), day: dayKey(days[day]), audience: needsAudience ? audience : undefined })}`)
      .then((r) => { if (active) setSlots(r.slots) }).catch(() => {})
    return () => { active = false }
  }, [businessId, serviceIds, day, days, done, audience, needsAudience, ready])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!slot) { setMsg("اختار ساعة من الساعات المتاحة."); return }
    if (!isValidPhone(phone)) { setMsg("رقم الهاتف ماشي صحيح (مثال: 0612345678)."); return }
    setBusy(true); setMsg("")
    try {
      await api(`/api/businesses/${businessId}/bookings`, { body: { serviceIds, startsAt: slot, name, phone, ...(needsAudience ? { audience } : {}), ...(website ? { website } : {}) } })
      setDone(true); setName(""); setPhone(""); setSlot("")
    } catch (err) { setMsg(errorText(err, "هاد الوقت ما بقاش متاح أو المعلومات ناقصة. جرّب وقت آخر.")) }
    finally { setBusy(false) }
  }

  if (services.length === 0) return null
  const field = "w-full rounded-[var(--radius)] border border-border bg-background p-3"
  return <section id="booking" className="mt-8 rounded-[var(--radius)] border border-border bg-card p-5">
    <h2 className="flex items-center gap-2 font-display text-2xl"><CalendarCheck size={20} className="text-primary" />{t("احجز موعدك")}</h2>
    {done && <p role="status" className="mt-4 flex items-start gap-2 rounded-[var(--radius)] bg-muted p-3 text-sm"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-primary" />{t("توصل الطلب ديالك. المهني غادي يأكد ليك الموعد.")}</p>}
    <form onSubmit={(e) => void submit(e)} className="mt-4 space-y-3 text-sm">
      {preset?.length ? <div className="rounded-[var(--radius)] border border-primary p-3">
        <p className="font-semibold">{chosen.map((s) => s.name).join(" + ")}</p>
        <p className="text-muted-foreground">{chosen.reduce((n, s) => n + s.durationMinutes, 0)} {t("دقيقة")} · {chosen.reduce((n, s) => n + s.price, 0)} {t("درهماً")}</p>
        {onClearPreset && <button type="button" onClick={onClearPreset} className="mt-1 text-xs text-primary">{t("بدّل الخدمة")}</button>}
      </div> : <select value={single} onChange={(e) => { setSingle(e.target.value); setDone(false) }} className={field}>{services.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.price} {t("درهماً")} · {s.durationMinutes} {t("دقيقة")}</option>)}</select>}
      {needsAudience && <div className="grid grid-cols-2 gap-2">{(["women", "men"] as const).map((a) => <button type="button" key={a} onClick={() => setAudience(a)} className={`rounded-[var(--radius)] border p-3 ${audience === a ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"}`}>{a === "women" ? t("👩 نساء") : t("👨 رجال")}</button>)}</div>}
      <div className="flex gap-2 overflow-x-auto pb-1">{days.map((d, i) => <button type="button" key={i} onClick={() => { setDay(i); setDone(false) }} className={`min-w-16 rounded-[var(--radius)] border p-2 text-center text-xs ${i === day ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"}`}><span className="block">{d.toLocaleDateString(i18n.language || "ar", { weekday: "short", timeZone: TZ })}</span><strong className="text-base">{d.toLocaleDateString("en", { day: "numeric", timeZone: TZ })}</strong></button>)}</div>
      {!ready ? <p className="text-muted-foreground">{t("اختار نساء ولا رجال باش تبان الأوقات.")}</p>
        : slots.length === 0 ? <p className="text-muted-foreground">{t("ما كاين حتى وقت متاح هاد النهار.")}</p>
        : <div className="grid grid-cols-4 gap-2">{slots.map((s) => <button type="button" key={s} onClick={() => setSlot(s)} className={`rounded-[var(--radius)] border p-2 ${slot === s ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary"}`}>{fmtTime(s)}</button>)}</div>}
      <input required minLength={2} maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder={t("اسمك")} autoComplete="name" className={field} />
      <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="06…" inputMode="tel" autoComplete="tel" className={field} />
      <input tabIndex={-1} autoComplete="off" aria-hidden="true" value={website} onChange={(e) => setWebsite(e.target.value)} className="absolute -left-[9999px] h-0 w-0 opacity-0" />
      <p className="rounded-[var(--radius)] border-s-2 border-primary bg-muted p-3 text-xs leading-5">{t("الدفع كاش فالمحل بعد الخدمة. ما كاين حتى خلاص مسبق.")}</p>
      <button disabled={busy} className="w-full rounded-[var(--radius)] bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-60">{t("تأكيد الحجز")}</button>
      {msg && <p className="text-destructive">{t(msg)}</p>}
    </form>
  </section>
}
