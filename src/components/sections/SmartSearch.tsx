import { useState } from "react"
import { ArrowLeft, MapPin, Search, Wallet } from "lucide-react"
import { useTranslation } from "react-i18next"
import { api, qs } from "@/lib/api"
import { ANY_STYLE, CATEGORIES as categories, CITIES as cities, STYLES_BY_CATEGORY, waLink } from "@/lib/catalog"
import LiveBadge from "@/components/profile/LiveBadge"
import type { Live } from "@/lib/business-types"

type Result = { id: string; name: string; category: string; city: string; phone: string; service: string; price: number; live: Live | null }

export function SmartSearch() {
  const { t } = useTranslation()
  const [city, setCity] = useState("")         // "" = all cities
  const [category, setCategory] = useState("") // "" = all specialties
  const [style, setStyle] = useState(ANY_STYLE)
  const [budget, setBudget] = useState("")
  const [availableNow, setAvailableNow] = useState(false)
  const [results, setResults] = useState<Result[] | null>(null)
  const [nearby, setNearby] = useState<Result[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const styles = STYLES_BY_CATEGORY[category] ?? [ANY_STYLE]

  const search = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true); setError(false); setNearby([])
    try {
      // Server returns the cheapest matching service per active business, cheapest first.
      const keyword = style === ANY_STYLE ? "" : style
      const max = Number(budget) > 0 ? Number(budget) : undefined
      const r = await api<{ results: Result[] }>(`/api/search?${qs({ city, category, keyword, budget: max, availableNow: availableNow ? 1 : undefined })}`)
      setResults(r.results)
      // Nothing with these filters → suggest what exists in the same city.
      if (!r.results.length && (category || keyword || max)) {
        const alt = await api<{ results: Result[] }>(`/api/search?${qs({ city })}`)
        setNearby(alt.results)
      }
    } catch { setError(true); setResults(null) }
    finally { setBusy(false) }
  }

  const field = "mt-1 w-full border border-border bg-background p-3 text-sm"
  const card = (r: Result) => {
    const wa = waLink(r.phone, t("سلام، بغيت ناخد موعد عند {{name}}.", { name: r.name }))
    return <article key={r.id} className="border border-border bg-background p-5"><p className="text-xs font-semibold text-primary">{t(r.category)}</p><LiveBadge live={r.live} className="mt-2" /><h3 className="mt-1 text-2xl"><a href={`/b/${r.id}`} className="hover:text-primary">{r.name}</a></h3><p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground"><MapPin size={15} />{t(r.city)}</p><p className="mt-3 flex justify-between border-t border-border pt-3 text-sm"><span>{r.service}</span><strong>{t("من")} {r.price} {t("درهماً")}</strong></p>
      <a href={`/b/${r.id}`} className="mt-3 me-5 inline-flex items-center gap-2 text-sm font-semibold">{t("شوف البروفايل والأعمال")}</a>
      {wa && <a href={wa} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary">{t("اطلب موعداً عبر واتساب")} <ArrowLeft size={16} className="rtl:rotate-0 ltr:rotate-180" /></a>}</article>
  }

  return <section id="smart-search" className="border-b border-border bg-card py-14 md:py-20">
    <div className="mx-auto max-w-5xl px-5 sm:px-8">
      <p className="text-sm font-semibold text-primary">{t("بحث ذكي")}</p>
      <h2 className="mt-2 text-3xl sm:text-4xl">{t("قول شنو بغيتي وشحال كتخلص، ونلقاو ليك المكان.")}</h2>
      <form onSubmit={(event) => void search(event)} className="mt-8 grid gap-4 border border-border bg-background p-5 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm">{t("المدينة")}<select value={city} onChange={(e) => setCity(e.target.value)} className={field}><option value="">{t("كل المدن")}</option>{cities.map((c) => <option key={c} value={c}>{t(c)}</option>)}</select></label>
        <label className="text-sm">{t("التخصص")}<select value={category} onChange={(e) => { setCategory(e.target.value); setStyle(ANY_STYLE) }} className={field}><option value="">{t("كل التخصصات")}</option>{categories.map((c) => <option key={c} value={c}>{t(c)}</option>)}</select></label>
        <label className="text-sm">{t("نوع القصة أو الخدمة")}<select value={style} disabled={styles.length < 2} onChange={(e) => setStyle(e.target.value)} className={`${field} disabled:opacity-60`}>{styles.map((c) => <option key={c} value={c}>{t(c)}</option>)}</select></label>
        <label className="text-sm">{t("الثمن المقترح (درهم)")}<div className="relative"><Wallet size={16} className="pointer-events-none absolute start-3 top-1/2 mt-0.5 -translate-y-1/2 text-primary" /><input type="number" min="1" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder={t("اختياري")} className={`${field} ps-9`} /></div></label>
        <label className="flex items-center gap-2 text-sm sm:col-span-2 lg:col-span-4"><input type="checkbox" checked={availableNow} onChange={(e) => setAvailableNow(e.target.checked)} className="h-4 w-4 accent-primary" />{t("غير اللي فاضيين دابا")}</label>
        <button disabled={busy} className="inline-flex items-center justify-center gap-2 bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-60 sm:col-span-2 lg:col-span-4"><Search size={18} />{busy ? t("كنقلبو...") : t("ابحث")}</button>
      </form>
      {error && <p role="status" className="mt-5 text-sm text-destructive">{t("ما قدرناش نقلبو دابا. عاود المحاولة.")}</p>}
      {results && results.length > 0 && <div className="mt-6 grid gap-4 sm:grid-cols-2">{results.map(card)}</div>}
      {results && results.length === 0 && <>
        <div className="mt-6 border border-border bg-background p-6 text-center"><p className="font-display text-xl">{t("ما لقينا حتى مكان بهاد الشروط دابا.")}</p><p className="mt-2 text-sm text-muted-foreground">{t("نشر عرضك وخلي المهنيين فمدينتك يجاوبوك.")}</p><a href="/offers" className="mt-4 inline-flex items-center gap-2 bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">{t("اقترح ثمنك")} <ArrowLeft size={16} /></a></div>
        {nearby.length > 0 && <><p className="mt-8 font-semibold">{city ? t("أماكن أخرى ف{{city}}:", { city: t(city) }) : t("أماكن أخرى قد تعجبك:")}</p><div className="mt-4 grid gap-4 sm:grid-cols-2">{nearby.map(card)}</div></>}
      </>}
    </div>
  </section>
}
