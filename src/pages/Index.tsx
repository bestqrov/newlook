import { useEffect, useState } from "react"
import { ArrowLeft, X } from "lucide-react"
import { MotionItem } from "@/components/MotionReveal"
import { AppointmentPreview, MoroccanPaymentOptions, RecentCutsGallery } from "@/components/sections/BarberFlowSections"
import { BarberCampaignHero, barbers, CityAndCraftDiscovery, FeaturedBarberProfiles } from "@/components/sections/BarberLandingSections"
import { SmartSearch } from "@/components/sections/SmartSearch"
import { BeautyMarketplace } from "@/components/sections/BeautyMarketplace"
import { BarberJoinAndFooter, PlatformStoryAndTrust } from "@/components/sections/BarberTrustFooter"
import { useTranslation } from 'react-i18next'
import { LanguageToggle } from "../components/LanguageToggle"

function SiteHeader() {
  const { t } = useTranslation()
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])
  return <header className={`fixed inset-x-0 top-0 z-50 transition-colors duration-200 ${scrolled ? "border-b border-border/70 bg-background/90 text-foreground backdrop-blur-md" : "on-media border-b border-transparent bg-transparent text-foreground"}`}><div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12"><a href="#top" className="font-display text-2xl font-bold">{t("نيولوك")}<span className="ms-2 text-xs font-normal text-muted-foreground">{t("الجمال على الخريطة")}</span></a><nav className="hidden items-center gap-6 text-sm lg:flex"><a className="transition-colors hover:text-primary" href="#beauty">{t("اكتشف الجمال")}</a><a className="transition-colors hover:text-primary" href="#work">{t("الأعمال")}</a><a className="transition-colors hover:text-primary" href="#how">{t("كيف تعمل")}</a><a className="transition-colors hover:text-primary" href="/pro">{t("انضم كمهني")}</a><LanguageToggle />
        </nav><a href="/pro" className="border border-primary px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground">{t("سجّل نشاطك")}</a></div><div className="flex justify-center gap-5 border-t border-border/40 py-2 text-xs lg:hidden"><a href="#beauty">{t("اكتشف")}</a><a href="#work">{t("الأعمال")}</a><a href="#how">{t("كيف تعمل")}</a><a href="/pro">{t("انضم")}</a></div></header>
}

function ProfilePreview({ name, onClose }: { name: string; onClose: () => void }) {
  const { t } = useTranslation()
  const barber = barbers.find((item) => t(item.name) === name)
  if (!barber) return null
  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-foreground/60 p-4" role="dialog" aria-modal="true" aria-label={t("ملف توضيحي للحلاق {{name}}", { name: t(barber.name) })} onClick={onClose}><div className="relative grid w-full max-w-2xl overflow-hidden border border-border bg-background sm:grid-cols-2" onClick={(event) => event.stopPropagation()}><button onClick={onClose} aria-label={t("إغلاق")} className="absolute end-3 top-3 z-10 rounded-full bg-background p-2"><X size={18} /></button><img src={barber.image} alt={t("صورة توضيحية للحلاق {{name}}", { name: t(barber.name) })} className="h-64 w-full object-cover sm:h-full" /><div className="p-6 sm:p-8"><span className="text-xs font-semibold text-primary">{t("ملف توضيحي")}</span><h2 className="mt-2 text-3xl">{t(barber.name)}</h2><p className="mt-2 text-sm text-muted-foreground">{t(barber.city)}</p><p className="mt-5 leading-7">{t(barber.note)}{t(". خدمات وأعمال ومواعيد معروضة هنا كمعاينة تجريبية.")}</p><div className="mt-6 border-y border-border py-4 text-sm"><div className="flex justify-between"><span>{t(barber.craft)}</span><span>{t("من")} {barber.price} {t("درهماً")}</span></div><div className="mt-3 flex justify-between text-muted-foreground"><span>{t("الأعمال والمواعيد")}</span><span>{t("أمثلة تجريبية")}</span></div></div><a href="#how" onClick={onClose} className="mt-6 inline-flex w-full justify-center gap-2 bg-primary px-4 py-3 font-semibold text-primary-foreground">{t("معاينة اختيار موعد")} <ArrowLeft size={18} /></a></div></div></div>
}

export default function Index() {
  const { t } = useTranslation()
  const [profile, setProfile] = useState("")
  useEffect(() => { document.title = t("نيولوك — جمالك يستحق أن يُرى") }, [t])
  return <div dir="rtl" className="min-h-screen bg-background text-foreground"><SiteHeader /><main><BarberCampaignHero /><SmartSearch /><CityAndCraftDiscovery onProfile={setProfile} /><FeaturedBarberProfiles onProfile={setProfile} /><BeautyMarketplace /><RecentCutsGallery /><AppointmentPreview /><MoroccanPaymentOptions /><PlatformStoryAndTrust /><BarberJoinAndFooter /></main><ProfilePreview name={profile} onClose={() => setProfile("")} /></div>
}
