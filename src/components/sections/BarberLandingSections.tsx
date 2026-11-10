import { useMemo, useState } from "react"
import { ArrowLeft, ArrowUpLeft, MapPin, Search } from "lucide-react"
import { MotionItem, MotionReveal } from "@/components/MotionReveal"
import { useTranslation } from "react-i18next"

export const barbers = [
  { name: "أمين الإدريسي", city: "الدار البيضاء", craft: "تدرّج دقيق وقصّات يومية", price: 80, image: "/assets/barber-amine-idrissi.webp", note: "أسلوب نظيف وتفاصيل محسوبة" },
  { name: "ياسين المريني", city: "الرباط", craft: "قصّات كلاسيكية ولحية", price: 100, image: "/assets/barber-yassine-merini.webp", note: "أناقة كلاسيكية بلمسة اليوم" },
  { name: "سلمى بناني", city: "مراكش", craft: "تصفيف عصري وتفاصيل جريئة", price: 120, image: "/assets/barber-salma-bennani.webp", note: "إبداع يليق بشخصيتك" },
  { name: "حمزة العلوي", city: "طنجة", craft: "قصّات شبابية وتدرّج", price: 90, image: "/assets/barber-hamza-alaoui.webp", note: "قصّات على إيقاع المدينة" },
]
const cities = ["الكل", "الدار البيضاء", "الرباط", "مراكش", "طنجة"]
const crafts = ["الكل", "قصّات كلاسيكية", "تدرّج", "عناية باللحية", "تصفيف عصري"]

export function BarberCampaignHero() {
  const { t } = useTranslation()
  return <section id="top" className="relative min-h-screen overflow-hidden">
    <img src="/assets/moroccan-barber-hero.webp" alt={t("حلاق مغربي يعتني بقصة زبونه في صالون معاصر")} className="absolute inset-0 h-full w-full object-cover object-[58%_center]" />
    <div className="absolute inset-0 bg-gradient-to-l from-foreground/85 via-foreground/55 to-foreground/10" />
    <div className="absolute inset-0 bg-gradient-to-t from-foreground/45 via-transparent to-foreground/15" />
    <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center px-5 pb-16 pt-32 sm:px-8 lg:px-12">
      <MotionReveal delay={0} className="on-media grid w-full items-center gap-10 lg:grid-cols-[1fr_0.78fr]">
        <MotionItem className="lg:col-start-1 lg:row-start-1"><div className="mb-2 flex items-center gap-3 text-sm text-primary"><span className="h-px w-10 bg-primary" />{t("جمال مغربي، حضور جديد")}</div></MotionItem>
        <MotionItem className="lg:col-start-1 lg:row-start-2"><h1 className="text-5xl leading-[1.2] sm:text-6xl lg:text-7xl">{t("جمالك يستحق")}<br /><span className="text-primary">{t("أن يُرى.")}</span></h1></MotionItem>
        <MotionItem className="lg:col-start-1 lg:row-start-3"><p className="max-w-xl text-lg leading-8 text-muted-foreground sm:text-xl">{t("اكتشف الصالون أو خبير العناية المناسب، أو اعرض أعمالك للناس اللي كيقلبو عليك.")}</p></MotionItem>
        <MotionItem className="lg:col-start-1 lg:row-start-4"><div className="flex flex-wrap gap-3"><a href="#barbers" className="inline-flex items-center gap-2 rounded-sm bg-primary px-6 py-3.5 font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5">{t("اكتشف خدمات الجمال")} <ArrowLeft size={18} /></a><a href="#join" className="inline-flex items-center gap-2 rounded-sm border border-border px-6 py-3.5 font-semibold transition-colors hover:bg-foreground/10">{t("انضم كمهني")} <ArrowUpLeft size={18} /></a></div></MotionItem>
        <MotionItem className="lg:col-start-1 lg:row-start-5"><p className="text-sm text-muted-foreground">{t("حلاقة، شعر، بشرة، أظافر وطقوس عناية تناسب يومك في المغرب.")}</p></MotionItem>
        <MotionItem className="lg:col-start-2 lg:row-start-1 lg:row-span-5"><div className="relative mx-auto hidden h-[450px] w-full max-w-[490px] lg:block"><div className="absolute end-0 top-4 h-[370px] w-[76%] overflow-hidden rounded-t-[48%] rounded-b-sm border border-border/50 shadow-2xl"><img src="/assets/barbershop-welcome.webp" alt={t("صالون حلاقة مغربي يستقبل زبائنه")} className="h-full w-full object-cover" /><div className="absolute inset-0 bg-primary/10 mix-blend-multiply" /></div><div className="absolute bottom-0 start-0 h-48 w-44 overflow-hidden rounded-sm border-4 border-background shadow-xl"><img src="/assets/barber-workflow-detail.webp" alt={t("أدوات الحلاقة مرتبة بعناية")} className="h-full w-full object-cover" /><div className="absolute inset-0 bg-primary/10 mix-blend-multiply" /></div><div className="absolute bottom-9 end-2 border border-border bg-background px-5 py-4 text-foreground shadow-lg"><span className="block font-display text-2xl">{t("حرفة. ثقة. موعد.")}</span><span className="mt-1 block text-xs text-muted-foreground">{t("مكان واحد يجمعها")}</span></div></div></MotionItem>
      </MotionReveal>
    </div>
    <a href="#barbers" className="absolute bottom-7 end-7 z-10 hidden items-center gap-2 text-sm text-primary-foreground/80 md:flex">{t("اكتشف القصة")} <ArrowLeft size={16} /></a>
  </section>
}

export function CityAndCraftDiscovery({ onProfile }: { onProfile: (name: string) => void }) {
  const { t } = useTranslation()
  const [city, setCity] = useState("الكل")
  const [craft, setCraft] = useState("الكل")
  const [query, setQuery] = useState("")
  const visible = useMemo(() => barbers.filter((b) => {
    const cityMatch = city === "الكل" || b.city === city
    const craftMatch = craft === "الكل" || b.craft.includes(craft === "قصّات كلاسيكية" ? "كلاسيكية" : craft === "عناية باللحية" ? "لحية" : craft)
    return cityMatch && craftMatch && `${b.name} ${b.city} ${b.craft}`.includes(query.trim())
  }), [city, craft, query])
  return <section id="barbers" className="atmosphere py-16 md:py-24"><div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12"><MotionReveal>
    <MotionItem><div className="mb-8 grid gap-5 md:grid-cols-[1fr_0.7fr] md:items-end"><div><p className="mb-3 text-sm font-semibold text-primary">{t("اختيارك يبدأ من هنا")}</p><h2 className="text-4xl sm:text-5xl">{t("ابحث حسب المدينة")}<br />{t("أو عالم الجمال.")}</h2></div><p className="max-w-md leading-7 text-muted-foreground">{t("من الدار البيضاء إلى طنجة، قرّب المسافة بينك وبين الخدمة اللي تناسبك.")}</p></div></MotionItem>
    <MotionItem><div className="mb-5 grid gap-3 border border-border p-4 md:grid-cols-[1.2fr_0.8fr]"><label className="flex items-center gap-3 border-b border-border pb-3 md:border-b-0 md:border-e md:pb-0 md:pe-4"><Search size={19} className="text-primary" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("اسم الحلاق أو المدينة أو الخدمة")} className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground" /></label><label className="flex items-center gap-3"><MapPin size={19} className="text-primary" /><select aria-label={t("اختر المدينة")} value={city} onChange={(e) => setCity(e.target.value)} className="w-full bg-transparent py-2 text-sm outline-none">{cities.map((c) => <option key={c} value={c}>{c === "الكل" ? t("كل المدن") : t(c)}</option>)}</select></label></div></MotionItem>
    <MotionItem><div className="mb-8 flex flex-wrap gap-2">{crafts.map((c) => <button key={c} onClick={() => setCraft(c)} className={`rounded-full border px-4 py-2 text-sm transition-colors ${craft === c ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}>{c === "الكل" ? t("كل التخصصات") : t(c)}</button>)}</div></MotionItem>
    <MotionItem><div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{visible.map((b) => <article key={b.name} className="group overflow-hidden border border-border bg-card transition-colors duration-200 hover:border-primary"><button onClick={() => onProfile(t(b.name))} className="block w-full text-start"><div className="relative h-64 overflow-hidden"><img src={b.image} alt={t("صورة توضيحية للحلاق {{name}}", { name: t(b.name) })} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /><span className="absolute bottom-3 start-3 border border-border bg-background/90 px-3 py-1 text-xs">{t("نموذج توضيحي")}</span></div><div className="p-5"><div className="flex items-start justify-between gap-2"><div><h3 className="text-xl">{t(b.name)}</h3><p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin size={14} />{t(b.city)}</p></div><span className="whitespace-nowrap text-sm font-semibold text-primary">{t("من")} {b.price} {t("درهماً")}</span></div><p className="mt-4 border-t border-border pt-3 text-sm">{t(b.craft)}</p><span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">{t("عرض الملف")} <ArrowLeft size={15} /></span></div></button></article>)}</div>{visible.length === 0 && <p className="border border-border p-8 text-center text-muted-foreground">{t("لا توجد نتائج مطابقة؛ جرّب مدينة أو تخصصاً آخر.")}</p>}</MotionItem>
    <MotionItem><p className="mt-5 text-xs text-muted-foreground">{t("المدن والنتائج والمرشحات في هذه النسخة بيانات عرض تجريبية.")}</p></MotionItem>
  </MotionReveal></div></section>
}

export function FeaturedBarberProfiles({ onProfile }: { onProfile: (name: string) => void }) { const { t } = useTranslation(); return <section className="pb-16 md:pb-24"><div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12"><MotionReveal><MotionItem><div className="mb-7 flex items-end justify-between gap-4"><div><p className="mb-3 text-sm font-semibold text-primary">{t("أصحاب الكرسي")}</p><h2 className="text-3xl sm:text-4xl">{t("وجوه من مشهد الحلاقة المغربي")}</h2></div><span className="hidden text-sm text-muted-foreground sm:block">{t("أربعة نماذج توضيحية")}</span></div></MotionItem><MotionItem><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{barbers.map((b, i) => <button key={b.name} onClick={() => onProfile(t(b.name))} className={`group grid grid-cols-[88px_1fr] items-center gap-4 border border-border p-3 text-start transition-colors hover:border-primary ${i % 2 ? "lg:mt-7" : ""}`}><img src={b.image} alt={t("صورة توضيحية للحلاق {{name}}", { name: t(b.name) })} className="h-24 w-[88px] object-cover" /><span><strong className="block text-lg">{t(b.name)}</strong><span className="mt-1 block text-xs text-muted-foreground">{t(b.city)}</span><span className="mt-3 block text-xs text-primary">{t("من")} {b.price} {t("درهماً · عرض الملف")}</span></span></button>)}</div></MotionItem></MotionReveal></div></section> }
