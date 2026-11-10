import { useCallback, useEffect, useState } from "react"
import { ArrowLeft, LogOut, Plus, Trash2, UploadCloud } from "lucide-react"
import { useTranslation } from "react-i18next"
import { api, auth, errorText, fileUrl, useAuth } from "@/lib/api"
import { CATEGORIES, CITIES, DURATIONS, isValidPhone } from "@/lib/catalog"
import { sanitizeImage } from "@/lib/image"
import AuthForm from "@/components/AuthForm"
import ProOffers from "@/components/ProOffers"
import ProBookings, { type Hour } from "@/components/ProBookings"
import ProPayment from "@/components/ProPayment"
import { categoryOf, labelOf, useCatalog } from "@/lib/catalog-api"
import type { Live, Address, Extras } from "@/lib/business-types"
import LiveControls from "@/components/pro/LiveControls"
import QueuePanel from "@/components/pro/QueuePanel"
import ProfileExtrasForm from "@/components/pro/ProfileExtrasForm"

type Business = { id: string; name: string; category: string; city: string; bio: string; phone: string; published: boolean; hours: Hour[]; address?: Address; amenities?: string[]; extras?: Extras; live?: Live | null }
type Work = { id: string; title: string; caption: string; imageUrl: string; tags: string[] }
type Service = { id: string; name: string; durationMinutes: number; price: number }
type Sub = { status: string; expiresAt: string | null; planName: string | null } | null

export default function ProStudio() {
  const { t } = useTranslation()
  const { user, ready } = useAuth()
  const catalog = useCatalog()
  const [postTags, setPostTags] = useState<string[]>([])
  const [business, setBusiness] = useState<Business | null>(null)
  const [sub, setSub] = useState<Sub>(null)
  const [portfolio, setPortfolio] = useState<Work[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [name, setName] = useState("")
  const [category, setCategory] = useState(CATEGORIES[0])
  const [city, setCity] = useState(CITIES[0])
  const [bio, setBio] = useState("")
  const [phone, setPhone] = useState("")
  const [published, setPublished] = useState(false)
  const [serviceName, setServiceName] = useState("")
  const [servicePrice, setServicePrice] = useState("")
  const [serviceDuration, setServiceDuration] = useState(30)
  const [postTitle, setPostTitle] = useState("")
  const [postCaption, setPostCaption] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState("")

  const load = useCallback(async () => {
    const r = await api<{ business: Business | null; services?: Service[]; works?: Work[]; subscription?: Sub }>("/api/me/business")
    if (!r.business) return
    const b = r.business
    setBusiness(b); setName(b.name); setCategory(b.category); setCity(b.city); setBio(b.bio); setPhone(b.phone); setPublished(b.published)
    setServices(r.services ?? []); setPortfolio(r.works ?? []); setSub(r.subscription ?? null)
  }, [])

  useEffect(() => {
    if (user) void load().catch((e) => setNotice(errorText(e)))
    else { setBusiness(null); setServices([]); setPortfolio([]) }
  }, [user, load])

  const saveBusiness = async (event: React.FormEvent) => {
    event.preventDefault()
    if (phone && !isValidPhone(phone)) { setNotice("رقم الهاتف ماشي صحيح (مثال: 0612345678)."); return }
    setBusy(true); setNotice("")
    try {
      await api("/api/me/business", { method: "PUT", body: { name, category, city, bio, phone, published } })
      await load()
      setNotice(published ? "البروفايل ديالك منشور للعموم." : "تحفظ البروفايل كمسودة.")
    } catch (e) { setNotice(errorText(e, "ما تحفظش البروفايل. تأكد من المعلومات وعاود المحاولة.")) }
    finally { setBusy(false) }
  }

  const addService = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setNotice("")
    try {
      const r = await api<{ service: Service }>("/api/me/services", { body: { name: serviceName, price: Number(servicePrice), durationMinutes: serviceDuration } })
      setServices((p) => [r.service, ...p]); setServiceName(""); setServicePrice(""); setNotice("تزادت الخدمة للبروفايل ديالك.")
    } catch (e) { setNotice(errorText(e, "ما تزادتش الخدمة. جرّب من جديد.")) }
    finally { setBusy(false) }
  }

  const updateService = async (s: Service) => {
    try {
      await api(`/api/me/services/${s.id}`, { method: "PATCH", body: { name: s.name, price: Number(s.price), durationMinutes: Number(s.durationMinutes) } })
      setNotice("تحفظات الخدمة.")
    } catch (e) { setNotice(errorText(e)) }
  }

  const removeService = async (s: Service) => {
    if (!window.confirm(t("حذف الخدمة «{{name}}»؟", { name: s.name }))) return
    try { await api(`/api/me/services/${s.id}`, { method: "DELETE" }); setServices((p) => p.filter((x) => x.id !== s.id)) }
    catch (e) { setNotice(errorText(e)) }
  }

  const addPortfolio = async (event: React.FormEvent) => {
    event.preventDefault(); if (!file) { setNotice("اختار صورة من جهازك باش تنشر العمل."); return }
    setBusy(true); setNotice("")
    try {
      const form = new FormData()
      form.append("title", postTitle); form.append("caption", postCaption)
      form.append("tags", postTags.join(","))
      form.append("image", await sanitizeImage(file)) // strips GPS/EXIF before upload
      const r = await api<{ work: Work }>("/api/me/portfolio", { form })
      setPortfolio((p) => [r.work, ...p]); setPostTitle(""); setPostCaption(""); setFile(null); setPostTags([]); setNotice("تنشر العمل ديالك بنجاح.")
    } catch (e) { setNotice(errorText(e, "ما قدرناش نرفعو الصورة. جرّب صورة أخرى أو عاود من بعد.")) }
    finally { setBusy(false) }
  }

  const removePortfolio = async (item: Work) => {
    try { await api(`/api/me/portfolio/${item.id}`, { method: "DELETE" }); setPortfolio((p) => p.filter((x) => x.id !== item.id)) }
    catch { setNotice("ما تحيدش العمل. عاود المحاولة.") }
  }

  const toggleWorkTag = async (w: Work, tag: string) => {
    const tags = w.tags.includes(tag) ? w.tags.filter((x) => x !== tag) : [...w.tags, tag]
    try { const r = await api<{ work: Work }>(`/api/me/portfolio/${w.id}`, { method: "PATCH", body: { tags } }); setPortfolio((p) => p.map((x) => (x.id === w.id ? r.work : x))) }
    catch (e) { setNotice(errorText(e)) }
  }
  const catDef = business ? categoryOf(catalog, business.category) : null
  const styleTags = catDef?.styleTags ?? []

  const field = "mt-1 w-full border border-border bg-background p-3"
  return <main className="min-h-screen bg-background px-5 py-10 text-foreground sm:px-8">
    <div className="mx-auto max-w-5xl">
      <a href="/" className="font-display text-2xl font-bold">{t("نيولوك")}</a>
      <header className="mb-9 mt-8 max-w-2xl"><p className="text-sm font-semibold text-primary">{t("فضاء المهنيين")}</p><h1 className="mt-3 text-4xl sm:text-5xl">{t("بروفايلك. أعمالك. زبائنك.")}</h1><p className="mt-4 leading-7 text-muted-foreground">{t("سجّل صالونك أو خدمتك الجمالية، شارك أعمالك، وخلي الناس يكتاشفوك حسب المدينة والتخصص.")}</p></header>
      {!ready ? <p className="text-muted-foreground">{t("لحظة...")}</p> : !user ? <AuthForm intro="أنشئ حساب مهني بالبريد الإلكتروني وكلمة المرور. المنصة كتخزن صور الأعمال بشكل عام باش يقدرو الزوار يشوفوها؛ ما ترفعش صوراً أو معلومات خاصة." /> : <>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border border-border bg-card p-4"><p className="text-sm text-muted-foreground">{t("مسجّل الدخول:")} <span className="text-foreground">{user.email}</span></p><button onClick={() => void auth.logout()} className="inline-flex items-center gap-2 text-sm text-primary"><LogOut size={16} />{t("تسجيل الخروج")}</button></div>
        <form onSubmit={(e) => void saveBusiness(e)} className="mb-8 grid gap-4 border border-border bg-card p-6 sm:grid-cols-2 sm:p-8">
          <div className="sm:col-span-2"><h2 className="text-2xl">{t("معلومات النشاط")}</h2><p className="mt-2 text-sm text-muted-foreground">{t("تقدر تبدل المعلومات والنشر في أي وقت.")}</p></div>
          <label className="text-sm">{t("اسم الصالون أو الخدمة")}<input required minLength={2} maxLength={100} value={name} onChange={(e) => setName(e.target.value)} className={field} /></label>
          <label className="text-sm">{t("التخصص")}<select value={category} onChange={(e) => setCategory(e.target.value)} className={field}>{CATEGORIES.map((c) => <option key={c} value={c}>{t(c)}</option>)}</select></label>
          <label className="text-sm">{t("المدينة")}<select value={city} onChange={(e) => setCity(e.target.value)} className={field}>{CITIES.map((c) => <option key={c} value={c}>{t(c)}</option>)}</select></label>
          <label className="text-sm">{t("واتساب النشاط")}<input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="06… أو +212…" className={field} /></label>
          <label className="text-sm sm:col-span-2">{t("نبذة قصيرة")}<textarea value={bio} maxLength={1000} onChange={(e) => setBio(e.target.value)} rows={3} className={field} /></label>
          <label className="flex items-center gap-3 text-sm sm:col-span-2"><input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="h-4 w-4 accent-primary" />{t("نشر البروفايل في دليل نيولوك")}</label>
          <button disabled={busy} className="inline-flex items-center justify-center gap-2 bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-60 sm:col-span-2">{t("حفظ البروفايل")} <ArrowLeft size={17} /></button>
        </form>
        {business && <div className="grid gap-8 lg:grid-cols-2">
          <section className="border border-border bg-card p-6"><h2 className="text-2xl">{t("الخدمات والأسعار")}</h2>
            <form onSubmit={(e) => void addService(e)} className="mt-5 grid gap-3 sm:grid-cols-[1fr_100px_100px_auto]">
              <input required minLength={2} maxLength={100} value={serviceName} onChange={(e) => setServiceName(e.target.value)} placeholder={t("مثال: تصفيف شعر")} className="border border-border bg-background p-3 text-sm" />
              <input required min="0" max="100000" type="number" value={servicePrice} onChange={(e) => setServicePrice(e.target.value)} placeholder={t("السعر بالدرهم")} className="border border-border bg-background p-3 text-sm" />
              <select value={serviceDuration} onChange={(e) => setServiceDuration(Number(e.target.value))} aria-label={t("المدة")} className="border border-border bg-background p-3 text-sm">{DURATIONS.map((d) => <option key={d} value={d}>{d} {t("دقيقة")}</option>)}</select>
              <button disabled={busy} aria-label={t("إضافة خدمة")} className="bg-primary p-3 text-primary-foreground"><Plus size={18} /></button>
            </form>
            <ul className="mt-5 divide-y divide-border">{services.map((s) => <li key={s.id} className="flex flex-wrap items-center gap-2 py-3 text-sm">
              <input value={s.name} onChange={(e) => setServices((p) => p.map((x) => x.id === s.id ? { ...x, name: e.target.value } : x))} className="min-w-0 flex-1 border border-border bg-background p-2" />
              <input type="number" min="0" value={s.price} onChange={(e) => setServices((p) => p.map((x) => x.id === s.id ? { ...x, price: Number(e.target.value) } : x))} className="w-20 border border-border bg-background p-2" />
              <select value={s.durationMinutes} onChange={(e) => setServices((p) => p.map((x) => x.id === s.id ? { ...x, durationMinutes: Number(e.target.value) } : x))} className="border border-border bg-background p-2">{[...new Set([...DURATIONS, s.durationMinutes])].sort((a, b) => a - b).map((d) => <option key={d} value={d}>{d} {t("دقيقة")}</option>)}</select>
              <button onClick={() => void updateService(s)} className="text-xs text-primary">{t("حفظ")}</button>
              <button onClick={() => void removeService(s)} aria-label={t("حذف")} className="text-destructive"><Trash2 size={15} /></button>
            </li>)}</ul>
          </section>
          <section className="border border-border bg-card p-6"><h2 className="text-2xl">{t("آخر الأعمال")}</h2>
            <form onSubmit={(e) => void addPortfolio(e)} className="mt-5 space-y-3">
              <input required maxLength={100} value={postTitle} onChange={(e) => setPostTitle(e.target.value)} placeholder={t("عنوان العمل")} className="w-full border border-border bg-background p-3 text-sm" />
              <input maxLength={300} value={postCaption} onChange={(e) => setPostCaption(e.target.value)} placeholder={t("وصف قصير (اختياري)")} className="w-full border border-border bg-background p-3 text-sm" />
              <label className="flex cursor-pointer items-center gap-3 border border-dashed border-border p-4 text-sm text-muted-foreground"><UploadCloud size={18} className="text-primary" />{file ? file.name : t("اختار صورة من جهازك")}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="sr-only" /></label>
              {styleTags.length > 0 && <div className="flex flex-wrap gap-2">{styleTags.map((s) => <button type="button" key={s.key} onClick={() => setPostTags((p) => (p.includes(s.key) ? p.filter((x) => x !== s.key) : [...p, s.key]))} className={`border px-3 py-1 text-xs ${postTags.includes(s.key) ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{labelOf(s.labels, "ar")}</button>)}</div>}
              <button disabled={busy} className="w-full bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-60">{t("نشر العمل")}</button>
            </form>
            <div className="mt-5 grid grid-cols-2 gap-3">{portfolio.map((item) => <article key={item.id} className="relative overflow-hidden border border-border"><img src={fileUrl(item.imageUrl)} alt={item.title} className="h-28 w-full object-cover" /><div className="flex items-center justify-between gap-2 p-2"><span className="truncate text-xs">{item.title}</span><button onClick={() => void removePortfolio(item)} className="text-xs text-destructive">{t("حذف")}</button></div>{styleTags.length > 0 && <div className="flex flex-wrap gap-1 px-2 pb-2">{styleTags.map((s) => <button key={s.key} onClick={() => void toggleWorkTag(item, s.key)} className={`border px-2 py-0.5 text-[10px] ${item.tags.includes(s.key) ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{labelOf(s.labels, "ar")}</button>)}</div>}</article>)}</div>
          </section>
        </div>}
        {business && <section className="my-8 grid gap-4 border border-border bg-card p-6 sm:grid-cols-4"><div><p className="text-xs text-muted-foreground">{t("الخدمات")}</p><p className="mt-1 font-display text-3xl">{services.length}</p></div><div><p className="text-xs text-muted-foreground">{t("الأعمال المنشورة")}</p><p className="mt-1 font-display text-3xl">{portfolio.length}</p></div><div><p className="text-xs text-muted-foreground">{t("حالة البروفايل")}</p><p className="mt-1 font-semibold">{business.published ? t("منشور") : t("مسودة")}</p></div><div className="flex flex-col justify-center gap-2 text-sm"><a href={`/b/${business.id}`} target="_blank" rel="noreferrer" className="font-semibold text-primary">{t("عرض صفحتي العامة")}</a><button type="button" onClick={() => { void navigator.clipboard.writeText(`${window.location.origin}/b/${business.id}`); setNotice("تنسخ رابط صفحتك. شاركو مع الزبناء.") }} className="text-start text-muted-foreground hover:text-primary">{t("نسخ الرابط")}</button></div></section>}
        {business && catDef && catDef.liveStates.length > 0 && <LiveControls states={catDef.liveStates} initial={business.live ?? null} />}
        {business && catDef?.features.includes("walkin_queue") && <QueuePanel />}
        {business && catDef && catalog && <ProfileExtrasForm key={business.category} business={business} services={services} category={catDef} catalog={catalog} onSaved={() => void load()} />}
        {business && <ProBookings initialHours={business.hours} subscription={sub} />}
        {business && <ProPayment onPaid={() => void load()} />}
        {business && <ProOffers />}
        <section className="mt-8 border border-border bg-muted/60 p-5 text-sm leading-6 text-muted-foreground"><strong className="text-foreground">{t("حول المواعيد والدفع:")}</strong> {t("الزبناء كيحجزو من صفحتك فالأوقات اللي حددتي، وكتأكد الموعد من هنا. الدفع كاش فالمحل بعد الخدمة، والتحصيل كيتم مباشرة عندك. اشتراكك فالمنصة كتخلصو بالتحويل البنكي وكتصيفط الوصل من هنا.")}</section>
      </>}
      {notice && <p role="status" className="mt-5 border-s-2 border-primary bg-muted p-4 text-sm leading-6">{t(notice)}</p>}
      <a href="/offers" className="mt-8 me-6 inline-flex items-center gap-2 text-sm text-primary">{t("فضاء الزبناء: اقترح ثمنك")}</a>
      <a href="/" className="mt-8 inline-flex items-center gap-2 text-sm text-primary">{t("الرجوع للصفحة الرئيسية")} <ArrowLeft size={16} /></a>
      <p className="mt-12 border-t border-border pt-5 text-xs text-muted-foreground">{t("المعلومات كتتخزن بحسابك، وكل نشاط كيدير تدبير بروفايله وخدماته وأعماله بنفسه.")}</p>
    </div>
  </main>
}
