import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { ArrowLeft, Clock, MapPin, MessageCircle, Scissors } from "lucide-react"
import { useTranslation } from "react-i18next"
import { api, fileUrl } from "@/lib/api"
import { waLink } from "@/lib/catalog"
import BookingWidget from "@/components/BookingWidget"

type Business = { id: string; name: string; category: string; city: string; bio: string; phone: string }
type Service = { id: string; name: string; durationMinutes: number; price: number }
type Work = { id: string; title: string; caption: string; imageUrl: string }

export default function BusinessProfile() {
  const { t } = useTranslation()
  const { id } = useParams()
  const [business, setBusiness] = useState<Business | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [works, setWorks] = useState<Work[]>([])
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading")
  const [open, setOpen] = useState<Work | null>(null)

  useEffect(() => {
    let active = true
    setState("loading")
    api<{ business: Business; services: Service[]; works: Work[] }>(`/api/businesses/${encodeURIComponent(id ?? "")}`)
      .then((r) => { if (!active) return; setBusiness(r.business); setServices(r.services); setWorks(r.works); setState("ready") })
      .catch(() => { if (active) setState("missing") })
    return () => { active = false }
  }, [id])

  useEffect(() => { if (business) document.title = `${business.name} — ${t("نيولوك")}` }, [business, t])

  if (state === "loading") return <main className="grid min-h-screen place-items-center bg-background text-muted-foreground">{t("كنحملو البروفايل...")}</main>
  if (state === "missing" || !business) return <main className="grid min-h-screen place-items-center bg-background px-5 text-center"><div><h1 className="text-3xl">{t("هاد البروفايل ما كايناش")}</h1><a href="/" className="mt-5 inline-block text-primary">{t("الرجوع للصفحة الرئيسية")}</a></div></main>

  const wa = waLink(business.phone, t("سلام، بغيت ناخد موعد عند {{name}}.", { name: business.name }))

  return <div dir="rtl" className="min-h-screen bg-background text-foreground">
    <header className="border-b border-border"><div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5"><a href="/" className="font-display text-2xl font-bold">{t("نيولوك")}</a><a href="/#smart-search" className="text-sm text-primary">{t("بحث عن مهني")}</a></div></header>
    <section className="border-b border-border bg-card"><div className="mx-auto max-w-5xl px-5 py-12 sm:py-16">
      <p className="flex items-center gap-2 text-sm font-semibold text-primary"><Scissors size={16} />{t(business.category)}</p>
      <h1 className="mt-3 text-4xl sm:text-6xl">{business.name}</h1>
      <p className="mt-3 flex items-center gap-2 text-muted-foreground"><MapPin size={16} />{t(business.city)}</p>
      {business.bio && <p className="mt-5 max-w-2xl whitespace-pre-line leading-8">{business.bio}</p>}
      {wa && <a href={wa} target="_blank" rel="noreferrer" className="mt-7 inline-flex items-center gap-2 bg-primary px-6 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90"><MessageCircle size={18} />{t("احجز موعدك عبر واتساب")}</a>}
    </div></section>
    <main className="mx-auto grid max-w-5xl gap-12 px-5 py-12 lg:grid-cols-[1fr_320px]">
      <section><h2 className="text-3xl">{t("آخر الأعمال")}</h2>
        {works.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">{t("ما تنشرات حتى أعمال دابا.")}</p> : <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">{works.map((w) => <button key={w.id} onClick={() => setOpen(w)} className="group overflow-hidden border border-border text-start"><img src={fileUrl(w.imageUrl)} alt={w.title} loading="lazy" className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105" /><span className="block truncate p-2 text-xs">{w.title}</span></button>)}</div>}
      </section>
      <aside><h2 className="text-3xl">{t("الخدمات والأسعار")}</h2>
        {services.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">{t("الخدمات غادي تزاد قريباً.")}</p> : <ul className="mt-6 divide-y divide-border border border-border bg-card">{services.map((s) => <li key={s.id} className="flex items-center justify-between gap-3 p-4 text-sm"><span><span className="block font-semibold">{s.name}</span><span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Clock size={12} />{s.durationMinutes} {t("دقيقة")}</span></span><strong>{s.price} {t("درهماً")}</strong></li>)}</ul>}
        <BookingWidget businessId={business.id} services={services} />
        {wa && <a href={wa} target="_blank" rel="noreferrer" className="mt-4 flex w-full items-center justify-center gap-2 border border-primary px-4 py-3 font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground">{t("احجز دابا")} <ArrowLeft size={16} /></a>}
      </aside>
    </main>
    {open && <div role="dialog" aria-modal="true" onClick={() => setOpen(null)} className="fixed inset-0 z-50 grid place-items-center bg-foreground/70 p-4"><figure className="max-w-lg bg-background" onClick={(e) => e.stopPropagation()}><img src={fileUrl(open.imageUrl)} alt={open.title} className="max-h-[70vh] w-full object-contain" /><figcaption className="p-4"><strong>{open.title}</strong>{open.caption && <p className="mt-1 text-sm text-muted-foreground">{open.caption}</p>}</figcaption></figure></div>}
  </div>
}
