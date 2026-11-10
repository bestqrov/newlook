import { useState } from "react"
import { Sparkles } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { Service } from "@/lib/business-types"

/** Hammam "build your ritual": toggles steps, shows the total, hands the selection to the booking form. */
export default function RitualBuilder({ services, ritualSteps, onChoose }: { services: Service[]; ritualSteps: string[]; onChoose: (ids: string[]) => void }) {
  const { t } = useTranslation()
  const steps = ritualSteps.map((id) => services.find((s) => s.id === id)).filter((s): s is Service => !!s)
  const [picked, setPicked] = useState<string[]>(() => steps.slice(0, 1).map((s) => s.id))
  if (steps.length < 2) return null
  const chosen = steps.filter((s) => picked.includes(s.id))
  const total = chosen.reduce((n, s) => n + s.price, 0)
  const minutes = chosen.reduce((n, s) => n + s.durationMinutes, 0)
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  return <section className="mt-8 rounded-[var(--radius)] border border-border bg-card p-5">
    <h2 className="flex items-center gap-2 font-display text-2xl"><Sparkles size={20} className="text-primary" />{t("صاوب الطقس ديالك")}</h2>
    <ol className="mt-4 space-y-2">{steps.map((s, i) => <li key={s.id}>
      <label className={`flex cursor-pointer items-center justify-between gap-3 rounded-[var(--radius)] border p-3 text-sm ${picked.includes(s.id) ? "border-primary" : "border-border"}`}>
        <span className="flex items-center gap-3"><input type="checkbox" checked={picked.includes(s.id)} onChange={() => toggle(s.id)} className="accent-primary" /><span><span className="me-1 text-muted-foreground">{i + 1}.</span>{s.name}</span></span>
        <span className="text-muted-foreground">{s.durationMinutes} {t("دقيقة")} · <strong className="text-foreground">{s.price}</strong></span>
      </label>
    </li>)}</ol>
    <p className="mt-4 text-sm">{t("{{n}} مراحل · {{m}} دقيقة · {{p}} درهماً", { n: chosen.length, m: minutes, p: total })}</p>
    <button disabled={!chosen.length} onClick={() => { onChoose(chosen.map((s) => s.id)); document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" }) }} className="mt-3 w-full rounded-[var(--radius)] bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-50">{t("اختار الوقت")}</button>
  </section>
}
