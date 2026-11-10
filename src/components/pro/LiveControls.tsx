import { useState } from "react"
import { useTranslation } from "react-i18next"
import { api, errorText } from "@/lib/api"
import type { Live } from "@/lib/business-types"
import LiveBadge from "@/components/profile/LiveBadge"

const LABELS: Record<string, string> = {
  free: "🟢 فاضي دابا", busy: "🟡 مشغول", closed: "🔴 مسدود",
  quiet: "🟢 خاوي", moderate: "🟡 متوسط", crowded: "🔴 عامر",
}

export default function LiveControls({ states, initial }: { states: string[]; initial: Live | null }) {
  const { t } = useTranslation()
  const [live, setLive] = useState<Live | null>(initial)
  const [busy, setBusy] = useState("")
  const [msg, setMsg] = useState("")
  const set = async (state: string) => {
    setBusy(state); setMsg("")
    try { setLive((await api<{ live: Live }>("/api/me/live", { method: "PATCH", body: { state } })).live) }
    catch (e) { setMsg(errorText(e)) }
    finally { setBusy("") }
  }
  return <section className="mt-8 border border-border bg-card p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl">{t("الحالة دابا")}</h2><LiveBadge live={live} /></div>
    <p className="mt-2 text-sm text-muted-foreground">{t("الزبناء كيشوفو هاد الحالة فالبروفايل والبحث. كتختفي بوحدها إلا ما بدلتيهاش 3 ساعات.")}</p>
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{states.map((s) => <button key={s} disabled={!!busy} onClick={() => void set(s)} className={`min-h-16 border p-4 text-lg font-semibold disabled:opacity-60 ${live?.state === s ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"}`}>{t(LABELS[s] ?? s)}</button>)}</div>
    {msg && <p className="mt-2 text-sm text-destructive">{t(msg)}</p>}
  </section>
}
