import { useState } from "react"
import { ArrowDown, ArrowUp, LocateFixed, Plus, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { ApiError, api, errorText } from "@/lib/api"
import { labelOf, type CategoryDef, type Catalog } from "@/lib/catalog-api"
import { DAY_NAMES, type Address, type Audience, type BringItem, type Extras, type ScheduleRange, type Service } from "@/lib/business-types"
import { AUDIENCE_LABEL } from "@/components/profile/GenderScheduleBar"

export type ProBusiness = { name: string; category: string; city: string; bio: string; phone: string; published: boolean; address?: Address; amenities?: string[]; extras?: Extras }

export default function ProfileExtrasForm({ business, services, category, catalog, onSaved }: { business: ProBusiness; services: Service[]; category: CategoryDef; catalog: Catalog; onSaved: () => void }) {
  const { t, i18n } = useTranslation()
  const [address, setAddress] = useState<Address>(business.address ?? { line: "", district: "", lat: null, lng: null })
  const [amenities, setAmenities] = useState<string[]>(business.amenities ?? [])
  const [chairs, setChairs] = useState(business.extras?.chairs ?? 1)
  const [schedule, setSchedule] = useState<ScheduleRange[]>(business.extras?.genderSchedule ?? [])
  const [ritual, setRitual] = useState<string[]>(business.extras?.ritualSteps ?? [])
  const [bring, setBring] = useState<BringItem[]>(business.extras?.bringList ?? [])
  const [msg, setMsg] = useState("")
  const isBarber = category.key === "barber", isHammam = category.key === "hammam"
  const field = "border border-border bg-background p-2 text-sm"

  const locate = () => navigator.geolocation?.getCurrentPosition(
    (p) => setAddress((a) => ({ ...a, lat: Number(p.coords.latitude.toFixed(6)), lng: Number(p.coords.longitude.toFixed(6)) })),
    () => setMsg("ما قدرناش نجيبو الموقع. سمح للمتصفح باستعمال الموقع."),
  )
  const move = (i: number, d: -1 | 1) => setRitual((r) => { const n = [...r]; const j = i + d; if (j < 0 || j >= n.length) return r; [n[i], n[j]] = [n[j], n[i]]; return n })

  const save = async () => {
    setMsg("")
    const extras = isBarber ? { chairs } : isHammam ? { genderSchedule: schedule, ritualSteps: ritual, bringList: bring.filter((b) => b.label.trim()) } : {}
    const { name, category: cat, city, bio, phone, published } = business
    try {
      await api("/api/me/business", { method: "PUT", body: { name, category: cat, city, bio, phone, published, address: { line: address.line, district: address.district, lat: address.lat, lng: address.lng }, amenities, extras } })
      setMsg("تحفظات المعلومات."); onSaved()
    } catch (e) { setMsg(e instanceof ApiError && e.code === "schedule_outside_hours" ? "جدول النساء/الرجال خاصو يكون داخل أوقات العمل." : errorText(e, "تأكد من المعلومات اللي دخلتي.")) }
  }

  return <section className="mt-8 border border-border bg-card p-6">
    <h2 className="text-2xl">{t("معلومات للزبناء")}</h2>
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <label className="text-sm">{t("العنوان")}<input value={address.line} maxLength={200} onChange={(e) => setAddress({ ...address, line: e.target.value })} className={`${field} mt-1 w-full`} /></label>
      <label className="text-sm">{t("الحي")}<input value={address.district} maxLength={80} onChange={(e) => setAddress({ ...address, district: e.target.value })} className={`${field} mt-1 w-full`} /></label>
    </div>
    <button type="button" onClick={locate} className="mt-2 inline-flex items-center gap-2 text-sm text-primary"><LocateFixed size={16} />{address.lat != null ? t("الموقع محدد ✓ (عاود)") : t("حدد الموقع ديالي (أنا فالمحل)")}</button>

    <h3 className="mt-6 font-semibold">{t("شنو كاين عندك")}</h3>
    <div className="mt-2 flex flex-wrap gap-2">{category.amenities.map((a) => <label key={a} className={`cursor-pointer border px-3 py-1 text-sm ${amenities.includes(a) ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}><input type="checkbox" className="sr-only" checked={amenities.includes(a)} onChange={() => setAmenities((p) => (p.includes(a) ? p.filter((x) => x !== a) : [...p, a]))} />{labelOf(catalog.amenities[a], i18n.language)}</label>)}</div>

    {isBarber && <label className="mt-6 block text-sm">{t("عدد الكراسي")}<input type="number" min={1} max={20} value={chairs} onChange={(e) => setChairs(Math.max(1, Math.min(20, Number(e.target.value) || 1)))} className={`${field} ms-3 w-20`} /></label>}

    {isHammam && <>
      <h3 className="mt-6 font-semibold">{t("أوقات النساء والرجال")}</h3>
      <ul className="mt-2 space-y-2">{schedule.map((s, i) => <li key={i} className="flex flex-wrap items-center gap-2 text-sm">
        <select value={s.weekday} onChange={(e) => setSchedule((p) => p.map((x, j) => (j === i ? { ...x, weekday: Number(e.target.value) } : x)))} className={field}>{DAY_NAMES.map((d, k) => <option key={k} value={k}>{t(d)}</option>)}</select>
        <input type="time" value={s.start} onChange={(e) => setSchedule((p) => p.map((x, j) => (j === i ? { ...x, start: e.target.value } : x)))} className={field} />
        <span>→</span>
        <input type="time" value={s.end} onChange={(e) => setSchedule((p) => p.map((x, j) => (j === i ? { ...x, end: e.target.value } : x)))} className={field} />
        <select value={s.audience} onChange={(e) => setSchedule((p) => p.map((x, j) => (j === i ? { ...x, audience: e.target.value as Audience } : x)))} className={field}>{(Object.keys(AUDIENCE_LABEL) as Audience[]).map((a) => <option key={a} value={a}>{t(AUDIENCE_LABEL[a])}</option>)}</select>
        <button type="button" onClick={() => setSchedule((p) => p.filter((_, j) => j !== i))} aria-label={t("حذف")} className="text-destructive"><X size={16} /></button>
      </li>)}</ul>
      <button type="button" onClick={() => setSchedule((p) => [...p, { weekday: 1, start: "08:00", end: "14:00", audience: "women" }])} className="mt-2 inline-flex items-center gap-1 text-sm text-primary"><Plus size={14} />{t("زيد فترة")}</button>

      <h3 className="mt-6 font-semibold">{t("مراحل الطقس (بالترتيب)")}</h3>
      <ul className="mt-2 space-y-1 text-sm">{services.map((s) => {
        const i = ritual.indexOf(s.id)
        return <li key={s.id} className="flex items-center gap-2">
          <input type="checkbox" checked={i >= 0} onChange={() => setRitual((r) => (r.includes(s.id) ? r.filter((x) => x !== s.id) : [...r, s.id]))} className="accent-primary" />
          <span className="flex-1">{i >= 0 && <strong className="me-1 text-primary">{i + 1}.</strong>}{s.name}</span>
          {i >= 0 && <><button type="button" onClick={() => move(i, -1)} aria-label={t("فوق")}><ArrowUp size={14} /></button><button type="button" onClick={() => move(i, 1)} aria-label={t("تحت")}><ArrowDown size={14} /></button></>}
        </li>
      })}</ul>

      <h3 className="mt-6 font-semibold">{t("شنو يجيب الزبون معاه")}</h3>
      <ul className="mt-2 space-y-2">{bring.map((b, i) => <li key={i} className="flex items-center gap-2 text-sm">
        <input value={b.label} maxLength={40} onChange={(e) => setBring((p) => p.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} className={`${field} flex-1`} />
        <label className="flex items-center gap-1"><input type="checkbox" checked={b.available} onChange={(e) => setBring((p) => p.map((x, j) => (j === i ? { ...x, available: e.target.checked } : x)))} />{t("متوفر عندنا")}</label>
        <button type="button" onClick={() => setBring((p) => p.filter((_, j) => j !== i))} aria-label={t("حذف")} className="text-destructive"><X size={16} /></button>
      </li>)}</ul>
      {bring.length < 15 && <button type="button" onClick={() => setBring((p) => [...p, { label: "", available: false }])} className="mt-2 inline-flex items-center gap-1 text-sm text-primary"><Plus size={14} />{t("زيد حاجة")}</button>}
    </>}

    <button type="button" onClick={() => void save()} className="mt-6 block bg-primary px-5 py-3 font-semibold text-primary-foreground">{t("حفظ")}</button>
    {msg && <p role="status" className="mt-2 text-sm">{t(msg)}</p>}
  </section>
}
