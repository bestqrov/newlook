import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { api, errorText } from "@/lib/api"

type Offer = { id: string; serviceName: string; proposedPrice: number; preferredDate: string | null }
const toLocalInput = (iso: string) => new Date(new Date(iso).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)

export default function ProOffers() {
  const { t } = useTranslation()
  const [offers, setOffers] = useState<Offer[]>([])
  const [when, setWhen] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState("")
  const [msg, setMsg] = useState("")

  const load = useCallback(async () => setOffers((await api<{ offers: Offer[] }>("/api/me/offers")).offers), [])
  useEffect(() => { void load().catch(() => {}) }, [load])

  const accept = async (o: Offer) => {
    const local = when[o.id] || (o.preferredDate ? toLocalInput(o.preferredDate) : "")
    if (!local) { setMsg("حدد وقت الموعد قبل القبول."); return }
    setBusy(o.id); setMsg("")
    try {
      await api(`/api/me/offers/${o.id}/accept`, { body: { appointmentAt: new Date(local).toISOString() } })
      setMsg("تقبل العرض وتصيفط الموعد للزبون."); setOffers((p) => p.filter((x) => x.id !== o.id))
    } catch (e) { setMsg(errorText(e, "ما تقبلش العرض (يمكن قبلو مهني آخر).")); void load() }
    finally { setBusy("") }
  }

  return <section className="mt-8 border border-border bg-card p-6"><h2 className="text-2xl">{t("عروض الزبناء فمدينتك")}</h2>
    {offers.length === 0 && <p className="mt-3 text-sm text-muted-foreground">{t("ما كاين حتى عرض مفتوح دابا.")}</p>}
    <ul className="mt-4 divide-y divide-border">{offers.map((o) => <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"><span>{o.serviceName} — <strong>{o.proposedPrice} {t("درهماً")}</strong></span>
      <span className="flex items-center gap-2"><input type="datetime-local" min={toLocalInput(new Date().toISOString())} defaultValue={o.preferredDate ? toLocalInput(o.preferredDate) : ""} onChange={(e) => setWhen((p) => ({ ...p, [o.id]: e.target.value }))} className="border border-border bg-background p-2" /><button disabled={busy === o.id} onClick={() => void accept(o)} className="bg-primary px-4 py-2 text-primary-foreground disabled:opacity-60">{t("قبول")}</button></span></li>)}</ul>
    {msg && <p role="status" className="mt-3 text-sm text-primary">{t(msg)}</p>}
  </section>
}
