import { Clock } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { Service } from "@/lib/business-types"

/** Price list: chalkboard (barber), menu (most), tiles (nails). */
export default function PriceBoard({ services, variant }: { services: Service[]; variant: "chalkboard" | "menu" | "tiles" }) {
  const { t } = useTranslation()
  if (!services.length) return <p className="mt-4 text-sm text-muted-foreground">{t("الخدمات غادي تزاد قريباً.")}</p>
  if (variant === "chalkboard") {
    return <div className="mt-6 rounded-[var(--radius)] border-8 border-[#5A3E2B] bg-[#1F2A24] p-5 text-[#F1EFE6] shadow-inner" style={{ fontFamily: "var(--font-accent)" }}>
      <p className="mb-3 text-center text-lg tracking-widest">— {t("الأسعار")} —</p>
      <ul className="space-y-3">{services.map((s) => <li key={s.id}>
        <div className="flex items-baseline gap-2"><span className="font-sans">{s.name}</span><span className="flex-1 border-b border-dotted border-[#F1EFE6]/40" /><strong>{s.price} {t("درهم")}</strong></div>
        <p className="font-sans text-xs opacity-70">{s.durationMinutes} {t("دقيقة")}</p>
      </li>)}</ul>
    </div>
  }
  if (variant === "tiles") {
    return <ul className="mt-6 grid grid-cols-2 gap-3">{services.map((s) => <li key={s.id} className="rounded-[var(--radius)] border border-border bg-card p-4 text-center">
      <p className="font-semibold">{s.name}</p><p className="mt-2 font-display text-2xl text-primary">{s.price}</p><p className="text-xs text-muted-foreground">{t("درهم")} · {s.durationMinutes} {t("دقيقة")}</p>
    </li>)}</ul>
  }
  return <ul className="mt-6 divide-y divide-border overflow-hidden rounded-[var(--radius)] border border-border bg-card">{services.map((s) => <li key={s.id} className="flex items-center justify-between gap-3 p-4 text-sm">
    <span><span className="block font-semibold">{s.name}</span><span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Clock size={12} />{s.durationMinutes} {t("دقيقة")}</span></span>
    <strong>{s.price} {t("درهماً")}</strong>
  </li>)}</ul>
}
