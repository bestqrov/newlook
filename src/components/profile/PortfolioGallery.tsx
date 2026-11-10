import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { fileUrl } from "@/lib/api"
import { labelOf, type CategoryDef } from "@/lib/catalog-api"
import type { Work } from "@/lib/business-types"

export default function PortfolioGallery({ works, category }: { works: Work[]; category: CategoryDef | null }) {
  const { t, i18n } = useTranslation()
  const [tag, setTag] = useState("")
  const [open, setOpen] = useState<Work | null>(null)
  const used = useMemo(() => (category?.styleTags ?? []).filter((s) => works.some((w) => w.tags.includes(s.key))), [category, works])
  const shown = tag ? works.filter((w) => w.tags.includes(tag)) : works
  return <section>
    <h2 className="font-display text-3xl">{t("آخر الأعمال")}</h2>
    {used.length > 0 && <div className="mt-4 flex flex-wrap gap-2">
      <button onClick={() => setTag("")} className={`rounded-full border px-3 py-1 text-xs ${!tag ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{t("الكل")}</button>
      {used.map((s) => <button key={s.key} onClick={() => setTag(s.key)} className={`rounded-full border px-3 py-1 text-xs ${tag === s.key ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{labelOf(s.labels, i18n.language)}</button>)}
    </div>}
    {shown.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">{t("ما تنشرات حتى أعمال دابا.")}</p>
      : <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">{shown.map((w) => <button key={w.id} onClick={() => setOpen(w)} className="group overflow-hidden rounded-[var(--radius)] border border-border text-start">
        <img src={fileUrl(w.imageUrl)} alt={w.title} loading="lazy" className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        <span className="block truncate p-2 text-xs">{w.title}</span>
      </button>)}</div>}
    {open && <div role="dialog" aria-modal="true" onClick={() => setOpen(null)} className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <figure className="max-w-lg overflow-hidden rounded-[var(--radius)] bg-card" onClick={(e) => e.stopPropagation()}>
        <img src={fileUrl(open.imageUrl)} alt={open.title} className="max-h-[70vh] w-full object-contain" />
        <figcaption className="p-4"><strong>{open.title}</strong>{open.caption && <p className="mt-1 text-sm text-muted-foreground">{open.caption}</p>}</figcaption>
      </figure>
    </div>}
  </section>
}
