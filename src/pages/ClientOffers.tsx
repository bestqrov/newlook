import { useCallback, useEffect, useState } from "react"
import { ArrowLeft, MapPin, CalendarClock } from "lucide-react"
import { useTranslation } from "react-i18next"
import { api, auth, errorText, useAuth } from "@/lib/api"
import { CATEGORIES, CITIES } from "@/lib/catalog"
import AuthForm from "@/components/AuthForm"

type Offer = { id: string; category: string; city: string; serviceName: string; proposedPrice: number; status: string; appointmentAt: string | null; location: string | null; proMessage: string | null }

export default function ClientOffers() {
  const { t } = useTranslation()
  const { user, ready } = useAuth()
  const [offers, setOffers] = useState<Offer[]>([])
  const [category, setCategory] = useState(CATEGORIES[0])
  const [city, setCity] = useState(CITIES[0])
  const [service, setService] = useState("")
  const [price, setPrice] = useState("")
  const [date, setDate] = useState("")
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState("")

  const load = useCallback(async () => setOffers((await api<{ offers: Offer[] }>("/api/offers/mine")).offers), [])
  useEffect(() => { if (user) void load().catch(() => {}); else setOffers([]) }, [user, load])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setNotice("")
    try {
      await api("/api/offers", { body: { category, city, serviceName: service, proposedPrice: Number(price), preferredDate: date ? new Date(date).toISOString() : null } })
      setService(""); setPrice(""); setDate(""); setNotice("وصل العرض ديالك للمهنيين فمدينتك. غادي تشوف الجواب هنا.")
      await load()
    } catch (err) { setNotice(errorText(err, "ما وصلش العرض. تأكد من المعلومات وعاود.")) }
    finally { setBusy(false) }
  }

  const cancel = async (o: Offer) => {
    if (!window.confirm(t("إلغاء هاد العرض؟"))) return
    try { await api(`/api/offers/${o.id}/cancel`, { method: "POST" }); await load() } catch (err) { setNotice(errorText(err)) }
  }

  const nowLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  const field = "mt-1 w-full border border-border bg-background p-3"
  return <main className="min-h-screen bg-background px-5 py-10 text-foreground sm:px-8"><div className="mx-auto max-w-3xl">
    <a href="/" className="font-display text-2xl font-bold">{t("نيولوك")}</a>
    <header className="mb-8 mt-8"><h1 className="text-4xl">{t("قول شحال بغيتي تخلص")}</h1><p className="mt-3 leading-7 text-muted-foreground">{t("اقترح الثمن ديالك للخدمة. أي حلاق أو صالون فمدينتك قبل الثمن غادي يرحب بيك ويعطيك الموعد والعنوان.")}</p></header>
    {!ready ? <p className="text-muted-foreground">{t("لحظة...")}</p> : !user ? <AuthForm intro="دخل لحسابك ولا أنشئ حساب جديد باش تنشر العرض ديالك." /> : <>
      <form onSubmit={(e) => void submit(e)} className="grid gap-4 border border-border bg-card p-6 sm:grid-cols-2">
        <label className="text-sm">{t("التخصص")}<select value={category} onChange={(e) => setCategory(e.target.value)} className={field}>{CATEGORIES.map((c) => <option key={c} value={c}>{t(c)}</option>)}</select></label>
        <label className="text-sm">{t("المدينة")}<select value={city} onChange={(e) => setCity(e.target.value)} className={field}>{CITIES.map((c) => <option key={c} value={c}>{t(c)}</option>)}</select></label>
        <label className="text-sm sm:col-span-2">{t("الخدمة اللي بغيتي")}<input required minLength={2} maxLength={120} value={service} onChange={(e) => setService(e.target.value)} className={field} /></label>
        <label className="text-sm">{t("الثمن المقترح (درهم)")}<input required min="1" max="100000" type="number" value={price} onChange={(e) => setPrice(e.target.value)} className={field} /></label>
        <label className="text-sm">{t("الوقت المفضل")}<input type="datetime-local" min={nowLocal} value={date} onChange={(e) => setDate(e.target.value)} className={field} /></label>
        <button disabled={busy} className="bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-60 sm:col-span-2">{t("نشر عرضي")}</button>
      </form>
      <section className="mt-8 space-y-3"><h2 className="text-2xl">{t("عروضي")}</h2>
        {offers.length === 0 && <p className="text-sm text-muted-foreground">{t("ما عندك حتى عرض دابا.")}</p>}
        {offers.map((o) => <article key={o.id} className="border border-border bg-card p-5 text-sm"><div className="flex justify-between gap-3"><strong>{o.serviceName}</strong><span>{o.proposedPrice} {t("درهماً")}</span></div><p className="mt-1 text-muted-foreground">{t(o.city)} · {t(o.category)}</p>
          {o.status === "accepted" ? <div className="mt-3 space-y-1 border-s-2 border-primary ps-3"><p className="font-semibold text-primary">{t("مرحبا بيك! تقبل العرض ديالك.")}</p>{o.appointmentAt && <p className="flex items-center gap-2"><CalendarClock size={16} />{new Date(o.appointmentAt).toLocaleString("fr-MA", { timeZone: "Africa/Casablanca" })}</p>}{o.location && <p className="flex items-center gap-2"><MapPin size={16} /><a className="underline" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.location)}`}>{o.location}</a></p>}{o.proMessage && <p>{o.proMessage}</p>}</div>
            : o.status === "cancelled" ? <p className="mt-3 text-muted-foreground">{t("ملغى")}</p>
            : <div className="mt-3 flex items-center justify-between"><p className="text-muted-foreground">{t("فالانتظار حتى يقبلو المهنيين")}</p><button onClick={() => void cancel(o)} className="text-xs text-destructive">{t("إلغاء")}</button></div>}
        </article>)}
      </section>
      <button onClick={() => void auth.logout()} className="mt-6 text-sm text-primary">{t("تسجيل الخروج")}</button></>}
    {notice && <p role="status" className="mt-5 border-s-2 border-primary bg-muted p-4 text-sm">{t(notice)}</p>}
    <a href="/" className="mt-8 flex items-center gap-2 text-sm text-primary">{t("الرجوع للصفحة الرئيسية")} <ArrowLeft size={16} className="rtl:rotate-180" /></a>
  </div></main>
}
