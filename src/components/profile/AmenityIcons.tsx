import { Accessibility, Baby, Bath, Car, CreditCard, Lock, Snowflake, UserRound, Wifi, type LucideIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { labelOf, type Catalog } from "@/lib/catalog-api"

const ICONS: Record<string, LucideIcon> = {
  ac: Snowflake, wifi: Wifi, kids: Baby, card: CreditCard, parking: Car,
  accessible: Accessibility, towels: Bath, private_room: Lock, female_staff: UserRound,
}

export default function AmenityIcons({ keys, catalog, className = "" }: { keys: string[]; catalog: Catalog | null; className?: string }) {
  const { i18n } = useTranslation()
  if (!keys.length || !catalog) return null
  return <ul className={`flex flex-wrap gap-2 ${className}`}>{keys.map((k) => {
    const Icon = ICONS[k]
    return <li key={k} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs">{Icon && <Icon size={14} aria-hidden />}{labelOf(catalog.amenities[k], i18n.language)}</li>
  })}</ul>
}
