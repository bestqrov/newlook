import { useTranslation } from "react-i18next"
import { DAY_NAMES, type Audience, type PublicBusiness } from "@/lib/business-types"

export const AUDIENCE_LABEL: Record<Audience, string> = { women: "👩 نساء", men: "👨 رجال", mixed: "👨‍👩‍👧 عائلي", private: "🔒 حمام خاص" }

export default function GenderScheduleBar({ business }: { business: PublicBusiness }) {
  const { t } = useTranslation()
  const sched = business.extras.genderSchedule ?? []
  if (!sched.length) return null
  const cur = business.currentAudience
  const days = [1, 2, 3, 4, 5, 6, 0].filter((d) => sched.some((s) => s.weekday === d))
  return <section className="border-b border-border bg-card">
    <div className="mx-auto max-w-5xl px-5 py-5">
      <p className="text-lg font-semibold">{cur
        ? <>{t("دابا:")} {t(AUDIENCE_LABEL[cur.now])} {t("حتى {{time}}", { time: cur.until })}{cur.next && <> · {t("من بعد:")} {t(AUDIENCE_LABEL[cur.next])}</>}</>
        : t("ما كاين حتى فترة دابا")}</p>
      <details className="mt-2 text-sm"><summary className="cursor-pointer text-primary">{t("جدول الأسبوع")}</summary>
        <table className="mt-3 w-full text-start"><tbody>{days.map((d) => <tr key={d} className="border-t border-border">
          <td className="py-2 pe-4 font-semibold">{t(DAY_NAMES[d])}</td>
          <td className="py-2">{sched.filter((s) => s.weekday === d).sort((a, b) => a.start.localeCompare(b.start)).map((s, i) => <span key={i} className="me-3 inline-block">{s.start}–{s.end} {t(AUDIENCE_LABEL[s.audience])}</span>)}</td>
        </tr>)}</tbody></table>
      </details>
    </div>
  </section>
}
