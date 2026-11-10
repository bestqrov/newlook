import { useCallback, useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { api } from "@/lib/api"
import { categoryOf, useCatalog } from "@/lib/catalog-api"
import type { PublicBusiness, Service, Work } from "@/lib/business-types"
import BookingWidget from "@/components/BookingWidget"
import ThemeScope from "@/components/profile/ThemeScope"
import ProfileHeader from "@/components/profile/ProfileHeader"
import PriceBoard from "@/components/profile/PriceBoard"
import PortfolioGallery from "@/components/profile/PortfolioGallery"
import WalkinQueue from "@/components/profile/WalkinQueue"
import GenderScheduleBar from "@/components/profile/GenderScheduleBar"
import RitualBuilder from "@/components/profile/RitualBuilder"
import BringList from "@/components/profile/BringList"

type Profile = { business: PublicBusiness; services: Service[]; works: Work[] }

export default function BusinessProfile() {
  const { t } = useTranslation()
  const { id } = useParams()
  const catalog = useCatalog()
  const [data, setData] = useState<Profile | null>(null)
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading")
  const [preset, setPreset] = useState<string[] | null>(null)

  const load = useCallback(async () => {
    try { setData(await api<Profile>(`/api/businesses/${encodeURIComponent(id ?? "")}`)); setState("ready") }
    catch { setState((s) => (s === "ready" ? s : "missing")) }
  }, [id])

  useEffect(() => { setState("loading"); void load() }, [load])
  // Live status changes during the day: refresh every minute while the page is open.
  useEffect(() => { const timer = window.setInterval(() => void load(), 60_000); return () => window.clearInterval(timer) }, [load])
  useEffect(() => { if (data) document.title = `${data.business.name} — ${t("نيولوك")}` }, [data, t])

  if (state === "loading") return <main className="grid min-h-screen place-items-center bg-background text-muted-foreground">{t("كنحملو البروفايل...")}</main>
  if (state === "missing" || !data) return <main className="grid min-h-screen place-items-center bg-background px-5 text-center"><div><h1 className="text-3xl">{t("هاد البروفايل ما كايناش")}</h1><a href="/" className="mt-5 inline-block text-primary">{t("الرجوع للصفحة الرئيسية")}</a></div></main>

  const { business: b, services, works } = data
  const category = categoryOf(catalog, b.category)
  const has = (f: string) => !!category?.features.includes(f)
  const bg = category?.theme.assets.background

  return <ThemeScope theme={category?.theme} className="min-h-screen">
    <div dir="rtl" style={bg ? { backgroundImage: `url(${bg})`, backgroundSize: "240px" } : undefined}>
      <nav className="border-b border-border bg-background/90 backdrop-blur"><div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5"><a href="/" className="font-display text-2xl font-bold">{t("نيولوك")}</a><a href="/#smart-search" className="text-sm text-primary">{t("بحث عن مهني")}</a></div></nav>
      <ProfileHeader business={b} category={category} catalog={catalog} />
      {has("gender_schedule") && <GenderScheduleBar business={b} />}
      <main className="mx-auto grid max-w-5xl gap-12 bg-background/95 px-5 py-12 lg:grid-cols-[1fr_340px]">
        <PortfolioGallery works={works} category={category} />
        <aside>
          <h2 className="font-display text-3xl">{t("الخدمات والأسعار")}</h2>
          <PriceBoard services={services} variant={category?.theme.assets.priceBoard ?? "menu"} />
          {has("walkin_queue") && <WalkinQueue businessId={b.id} closed={b.live?.state === "closed"} />}
          {has("ritual_builder") && <RitualBuilder services={services} ritualSteps={b.extras.ritualSteps ?? []} onChoose={setPreset} />}
          {has("bring_list") && <BringList items={b.extras.bringList ?? []} />}
          <BookingWidget businessId={b.id} services={services} preset={preset} onClearPreset={() => setPreset(null)} needsAudience={has("gender_schedule") && (b.extras.genderSchedule?.length ?? 0) > 0} />
        </aside>
      </main>
    </div>
  </ThemeScope>
}
