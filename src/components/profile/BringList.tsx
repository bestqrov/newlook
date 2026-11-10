import { Check } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { BringItem } from "@/lib/business-types"

export default function BringList({ items }: { items: BringItem[] }) {
  const { t } = useTranslation()
  if (!items.length) return null
  return <section className="mt-8 rounded-[var(--radius)] border border-border bg-card p-5">
    <h2 className="font-display text-2xl">{t("شنو تجيب معاك")}</h2>
    <ul className="mt-4 space-y-2 text-sm">{items.map((it, i) => <li key={i} className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2"><Check size={16} className="text-primary" />{it.label}</span>
      {it.available && <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">{t("متوفر عندنا")}</span>}
    </li>)}</ul>
  </section>
}
