import { useCallback, useEffect, useState } from "react"
import { Users } from "lucide-react"
import { useTranslation } from "react-i18next"
import { api, errorText } from "@/lib/api"
import { isValidPhone } from "@/lib/catalog"

type Ticket = { id: string; token: string }
type Status = { status: "waiting" | "served" | "no_show" | "cancelled"; position: number | null; estimatedWaitMinutes: number | null }
const storeKey = (businessId: string) => `nl-queue-${businessId}`
const readTicket = (businessId: string): Ticket | null => { try { return JSON.parse(localStorage.getItem(storeKey(businessId)) ?? "null") } catch { return null } }
const writeTicket = (businessId: string, t: Ticket | null) => { try { if (t) localStorage.setItem(storeKey(businessId), JSON.stringify(t)); else localStorage.removeItem(storeKey(businessId)) } catch { /* private mode */ } }

export default function WalkinQueue({ businessId, closed }: { businessId: string; closed: boolean }) {
  const { t } = useTranslation()
  const [ticket, setTicket] = useState<Ticket | null>(() => readTicket(businessId))
  const [status, setStatus] = useState<Status | null>(null)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [website, setWebsite] = useState("")
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState("")

  const refresh = useCallback(async (tk: Ticket) => {
    try {
      const s = await api<Status>(`/api/queue/${tk.id}?token=${encodeURIComponent(tk.token)}`)
      setStatus(s)
      if (s.status !== "waiting") { writeTicket(businessId, null); setTicket(null) }
    } catch { writeTicket(businessId, null); setTicket(null); setStatus(null) }
  }, [businessId])

  useEffect(() => {
    if (!ticket) return
    void refresh(ticket)
    const id = window.setInterval(() => void refresh(ticket), 30_000)
    return () => window.clearInterval(id)
  }, [ticket, refresh])

  const join = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValidPhone(phone)) { setMsg("رقم الهاتف ماشي صحيح (مثال: 0612345678)."); return }
    setBusy(true); setMsg("")
    try {
      const r = await api<Ticket & { position: number; estimatedWaitMinutes: number }>(`/api/businesses/${businessId}/queue`, { body: { name, phone, ...(website ? { website } : {}) } })
      const tk = { id: r.id, token: r.token }
      writeTicket(businessId, tk); setTicket(tk)
      setStatus({ status: "waiting", position: r.position, estimatedWaitMinutes: r.estimatedWaitMinutes })
    } catch (err) { setMsg(errorText(err)) }
    finally { setBusy(false) }
  }

  const cancel = async () => {
    if (!ticket) return
    await api(`/api/queue/${ticket.id}/cancel`, { body: { token: ticket.token } }).catch(() => {})
    writeTicket(businessId, null); setTicket(null); setStatus(null)
  }

  return <section className="mt-8 rounded-[var(--radius)] border border-border bg-card p-5">
    <h2 className="flex items-center gap-2 font-display text-2xl"><Users size={20} className="text-primary" />{t("زيدني فالصف")}</h2>
    {ticket && status?.status === "waiting" ? <div className="mt-4 text-center">
      <p className="text-sm text-muted-foreground">{t("نتا فالصف")}</p>
      <p className="font-display text-6xl text-primary">{status.position}</p>
      <p className="mt-1 text-sm">{status.position === 1 ? t("نتا اللي جاي! سير للمحل.") : t("تقريباً {{m}} دقيقة", { m: status.estimatedWaitMinutes ?? 0 })}</p>
      <button onClick={() => void cancel()} className="mt-4 text-sm text-destructive">{t("خرجني من الصف")}</button>
    </div> : status && status.status !== "waiting" ? <p className="mt-4 text-sm">{status.status === "served" ? t("مرحبا بيك! وصلات نوبتك.") : t("خرجتي من الصف.")}</p>
    : closed ? <p className="mt-4 text-sm text-muted-foreground">{t("المحل مسدود دابا. الصف كيتحل غير ملي يكون مفتوح.")}</p>
    : <form onSubmit={(e) => void join(e)} className="mt-4 space-y-3 text-sm">
      <p className="text-muted-foreground">{t("ما تحتاجش تتسنى فالمحل: دير سميتك وغادي تشوف النوبة ديالك من هنا.")}</p>
      <input required minLength={2} maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder={t("اسمك")} autoComplete="name" className="w-full rounded-[var(--radius)] border border-border bg-background p-3" />
      <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="06…" inputMode="tel" autoComplete="tel" className="w-full rounded-[var(--radius)] border border-border bg-background p-3" />
      <input tabIndex={-1} autoComplete="off" aria-hidden="true" value={website} onChange={(e) => setWebsite(e.target.value)} className="absolute -left-[9999px] h-0 w-0 opacity-0" />
      <button disabled={busy} className="w-full rounded-[var(--radius)] bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-60">{t("زيدني فالصف")}</button>
      {msg && <p className="text-destructive">{t(msg)}</p>}
    </form>}
  </section>
}
