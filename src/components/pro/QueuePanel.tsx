import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { api } from "@/lib/api"

type Entry = { id: string; name: string; phone: string; createdAt: string }
const time = (iso: string) => new Intl.DateTimeFormat("fr-MA", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Casablanca" }).format(new Date(iso))

export default function QueuePanel() {
  const { t } = useTranslation()
  const [entries, setEntries] = useState<Entry[]>([])
  const load = useCallback(async () => setEntries((await api<{ entries: Entry[] }>("/api/me/queue")).entries), [])
  useEffect(() => { void load().catch(() => {}); const id = window.setInterval(() => void load().catch(() => {}), 20_000); return () => window.clearInterval(id) }, [load])
  const act = async (id: string, action: "serve" | "no-show") => { await api(`/api/me/queue/${id}/${action}`, { method: "POST" }).catch(() => {}); void load() }
  const clear = async () => { if (window.confirm(t("تفرغ الصف كامل؟"))) { await api("/api/me/queue/clear", { method: "POST" }).catch(() => {}); void load() } }
  return <section className="mt-8 border border-border bg-card p-6">
    <div className="flex items-center justify-between"><h2 className="text-2xl">{t("الصف")} ({entries.length})</h2>{entries.length > 0 && <button onClick={() => void clear()} className="text-sm text-destructive">{t("فرّغ الصف")}</button>}</div>
    {entries.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">{t("ما كاين حتى واحد فالصف.")}</p>
      : <ol className="mt-4 divide-y divide-border">{entries.map((e, i) => <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
        <span><strong className="me-2 text-primary">{i + 1}</strong>{e.name} <a href={`tel:${e.phone}`} dir="ltr" className="ms-2 text-xs text-muted-foreground">{e.phone}</a> <span className="ms-2 text-xs text-muted-foreground">{time(e.createdAt)}</span></span>
        <span className="flex gap-2"><button onClick={() => void act(e.id, "serve")} className="bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">{t("دخل")}</button><button onClick={() => void act(e.id, "no-show")} className="border border-border px-4 py-2 text-sm">{t("ما جاش")}</button></span>
      </li>)}</ol>}
  </section>
}
