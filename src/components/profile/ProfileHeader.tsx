import { MapPin, MessageCircle, Navigation, Phone, Clock } from "lucide-react"
import { useTranslation } from "react-i18next"
import { labelOf, type Catalog, type CategoryDef } from "@/lib/catalog-api"
import { DAY_NAMES, type PublicBusiness } from "@/lib/business-types"
import { waLink } from "@/lib/catalog"
import LiveBadge from "./LiveBadge"
import AmenityIcons from "./AmenityIcons"

export function directionsUrl(b: PublicBusiness): string {
  if (b.address.lat != null && b.address.lng != null) return `https://www.google.com/maps/dir/?api=1&destination=${b.address.lat},${b.address.lng}`
  const q = [b.address.line, b.address.district, b.city].filter(Boolean).join(", ")
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q || b.name)}`
}

export default function ProfileHeader({ business: b, category, catalog }: { business: PublicBusiness; category: CategoryDef | null; catalog: Catalog | null }) {
  const { t, i18n } = useTranslation()
  const pattern = category?.theme.assets.headerPattern
  const wa = waLink(b.phone, t("سلام، بغيت ناخد موعد عند {{name}}.", { name: b.name }))
  const ts = b.todayStatus
  const today = ts.openNow ? t("مفتوح حتى {{time}}", { time: ts.closesAt }) : ts.nextOpen ? t("مسدود · كيحل {{day}} {{time}}", { day: t(DAY_NAMES[ts.nextOpen.weekday]), time: ts.nextOpen.time }) : t("أوقات العمل غير محددة")
  return <header className="border-b border-border bg-card">
    {pattern && <div aria-hidden className="h-3 w-full" style={{ backgroundImage: `url(${pattern})`, backgroundRepeat: "repeat-x", backgroundSize: "auto 100%" }} />}
    <div className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
      <p className="text-sm font-semibold text-primary">{category ? labelOf(category.labels, i18n.language) : t(b.category)}</p>
      <h1 className="mt-2 font-display text-4xl sm:text-6xl">{b.name}</h1>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <LiveBadge live={b.live} />
        <span className="inline-flex items-center gap-1"><Clock size={15} />{today}</span>
        <span className="inline-flex items-center gap-1"><MapPin size={15} />{[b.address.district, t(b.city)].filter(Boolean).join(" · ")}</span>
      </div>
      {b.address.line && <p className="mt-2 text-sm text-muted-foreground">{b.address.line}</p>}
      {b.bio && <p className="mt-5 max-w-2xl whitespace-pre-line leading-8">{b.bio}</p>}
      <AmenityIcons keys={b.amenities} catalog={catalog} className="mt-5" />
      <div className="mt-7 flex flex-wrap gap-3">
        <a href={directionsUrl(b)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-[var(--radius)] bg-primary px-5 py-3 font-semibold text-primary-foreground"><Navigation size={18} />{t("خذني ليه")}</a>
        {b.phone && <a href={`tel:${b.phone}`} className="inline-flex items-center gap-2 rounded-[var(--radius)] border border-border px-5 py-3 font-semibold"><Phone size={18} />{t("عيّط")}</a>}
        {wa && <a href={wa} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-[var(--radius)] border border-border px-5 py-3 font-semibold"><MessageCircle size={18} />{t("واتساب")}</a>}
      </div>
    </div>
  </header>
}
