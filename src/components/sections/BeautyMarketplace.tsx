import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, MapPin, Search } from "lucide-react"
import { useTranslation } from 'react-i18next'
import i18n from "i18next"
import { api, fileUrl } from "@/lib/api"
import { normalizeText, waLink } from "@/lib/catalog"

/** A catalog value (Arabic key) plus its translation in every loaded language. */
const inAllLanguages = (key: string) => [key, ...Object.keys(i18n.options.resources ?? {}).map((lng) => i18n.getFixedT(lng)(key))]

type Business = {
  id: string
  name: string
  category: string
  city: string
  bio: string
  phone: string
  cover: string | null
}

const categories = ["الكل", "حلاقة رجالية", "صالون نسائي", "الشعر والتصفيف", "العناية بالبشرة", "الأظافر", "الحمام والسبا", "المكياج"]
const visualCategories = [
  { name: "صالونات الشعر", image: "/assets/beauty-salon-women.webp", category: "صالون نسائي" },
  { name: "الحمام والسبا", image: "/assets/beauty-spa-hammam.webp", category: "الحمام والسبا" },
  { name: "الأظافر والعناية", image: "/assets/beauty-nails-studio.webp", category: "الأظافر" },
]

function categoryImage(category: string, spa: string, hammam: string, nails: string, skin: string) {
  if (category.includes(spa) || category.includes(hammam)) return "/assets/beauty-spa-hammam.webp"
  if (category.includes(nails) || category.includes(skin)) return "/assets/beauty-nails-studio.webp"
  return "/assets/beauty-salon-women.webp"
}

export function BeautyMarketplace() {
  const { t } = useTranslation()
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [category, setCategory] = useState("الكل")
  const [query, setQuery] = useState("")

  useEffect(() => {
    let active = true
    // Only published businesses with a valid subscription (filtered server-side).
    api<{ businesses: Business[] }>("/api/businesses").then((r) => { if (active) setBusinesses(r.businesses) }).catch(() => {})
    return () => { active = false }
  }, [])

  const visible = useMemo(() => businesses.filter((business) => {
    const matchesCategory = category === "الكل" || business.category === category
    // City and specialty are matched in every site language (مراكش = Marrakech).
    const words = normalizeText(query).split(" ").filter(Boolean)
    const hay = normalizeText([business.name, business.bio, ...[business.city, business.category].flatMap(inAllLanguages)].join(" "))
    const matchesSearch = words.every((w) => hay.includes(w))
    return matchesCategory && matchesSearch
  }), [businesses, category, query])

  return <section id="beauty" className="atmosphere border-y border-border py-16 md:py-24">
    <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
      <div className="mb-9 grid gap-5 md:grid-cols-[1fr_0.7fr] md:items-end">
        <div><p className="mb-3 text-sm font-semibold text-primary">{t("الجمال بكل تفاصيله")}</p><h2 className="text-4xl sm:text-5xl">{t("من الحلاقة إلى")}<br />{t("طقوس العناية.")}</h2></div>
        <p className="max-w-lg leading-7 text-muted-foreground">{t("نيولوك تجمع الحلاقين والحلاقات، صالونات الشعر، العناية بالبشرة، الأظافر والحمام المغربي في اكتشاف واحد.")}</p>
      </div>
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        {visualCategories.map((item) => <button key={item.category} onClick={() => setCategory(item.category)} className="group relative h-52 overflow-hidden text-start">
          <img src={item.image} alt={t(item.name)} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/15 to-transparent" />
          <span className="absolute bottom-4 start-4 font-display text-2xl text-background">{t(item.name)}</span>
        </button>)}
      </div>
      <div className="mb-5 grid gap-3 border border-border p-4 md:grid-cols-[1fr_1.2fr] md:items-center">
        <label className="flex items-center gap-3 border-b border-border pb-3 md:border-b-0 md:border-e md:pb-0 md:pe-4"><Search size={18} className="text-primary" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("ابحث عن صالون أو مدينة")} className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground" /></label>
        <div className="flex flex-wrap gap-2">{categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`border px-3 py-2 text-xs transition-colors ${category === item ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}>{t(item)}</button>)}</div>
      </div>
      {visible.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{visible.map((business) => {
        const cover = business.cover ? fileUrl(business.cover) : categoryImage(t(business.category), t("الحمام والسبا"), t("الحمام"), t("الأظافر"), t("العناية بالبشرة"))
        const wa = waLink(business.phone, t("سلام، بغيت ناخد موعد عند {{name}}.", { name: business.name }))
        return <article key={business.id} className="group overflow-hidden border border-border bg-card transition-colors hover:border-primary">
          <img src={cover} alt={`${business.name} — ${business.category}`} className="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
          <div className="p-5"><p className="text-xs font-semibold text-primary">{t(business.category)}</p><h3 className="mt-2 text-2xl">{t(business.name)}</h3><p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground"><MapPin size={15} />{business.city}</p><p className="mt-3 line-clamp-2 min-h-12 text-sm leading-6 text-muted-foreground">{business.bio}</p>
            <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-border pt-4 text-sm font-semibold"><a href={`/b/${business.id}`} className="hover:text-primary">{t("شوف البروفايل والأعمال")}</a>{wa && <a href={wa} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-primary">{t("اطلب موعداً عبر واتساب")} <ArrowLeft size={16} /></a>}</div>
          </div>
        </article>
      })}</div> : <div className="border border-border bg-background px-6 py-9 text-center"><p className="font-display text-2xl">{businesses.length ? t("ما لقيناش نتائج بهاد الاختيار.") : t("المكان ديالك يقدر يكون أول واحد هنا.")}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{businesses.length ? t("بدّل المدينة أو التخصص وجرب من جديد.") : t("سجّل نشاطك، زيد خدماتك وصور أعمالك، ومن بعد نشر بروفايلك للزبائن.")}</p><a href="/pro" className="mt-5 inline-flex items-center gap-2 bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">{t("سجّل نشاطك على نيولوك")} <ArrowLeft size={16} /></a></div>}
      <p className="mt-5 text-xs text-muted-foreground">{t("المواعيد تُطلب مباشرة من النشاط عبر واتساب؛ تأكيدها والدفع يتمّان لدى مقدّم الخدمة حسب ما يتيحه.")}</p>
    </div>
  </section>
}