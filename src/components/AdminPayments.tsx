import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { api, errorText } from "@/lib/api"

type Pay = { id: string; businessName: string; planName: string; amount: number; planPrice: number | null; status: string; createdAt: string }
const box = "border border-border bg-card p-5"
const BASE = ((import.meta.env.VITE_API_URL as string | undefined) ?? "").replace(/\/$/, "")

export default function AdminPayments({ onChange }: { onChange: () => void }) {
  const { t } = useTranslation()
  const [pays, setPays] = useState<Pay[]>([])
  const [bank, setBank] = useState("")
  const [busy, setBusy] = useState("")
  const [msg, setMsg] = useState("")

  const load = useCallback(async () => {
    const [p, s] = await Promise.all([api<{ payments: Pay[] }>("/api/admin/payments"), api<{ value: string }>("/api/admin/settings/bank")])
    setPays(p.payments); setBank(s.value)
  }, [])
  useEffect(() => { void load().catch(() => {}) }, [load])

  const saveBank = async () => {
    try { await api("/api/admin/settings/bank", { method: "PUT", body: { value: bank } }); setMsg("Coordonnées bancaires enregistrées.") }
    catch { setMsg("Impossible d'enregistrer les coordonnées.") }
  }
  const act = async (p: Pay, action: "approve" | "reject") => {
    if (action === "approve" && !window.confirm(t("Valider le paiement de {{amount}} MAD pour « {{name}} » ?", { amount: p.amount, name: p.businessName }))) return
    setBusy(p.id); setMsg("")
    try {
      await api(`/api/admin/payments/${p.id}/${action}`, { method: "POST" })
      setMsg(action === "approve" ? "Paiement validé, abonnement activé." : "Paiement refusé.")
      void load(); onChange()
    } catch (e) { setMsg(errorText(e, "Action impossible.")) }
    finally { setBusy("") }
  }
  const label: Record<string, string> = { pending: "En attente", processing: "En cours", approved: "Validé", rejected: "Refusé" }

  return <section className="space-y-6">
    {msg && <p role="status" className="border-s-2 border-primary bg-muted p-3 text-sm">{t(msg)}</p>}
    <div className={box}><h3 className="text-xl">{t("Coordonnées bancaires (affichées aux professionnels)")}</h3>
      <textarea value={bank} maxLength={2000} onChange={(e) => setBank(e.target.value)} rows={5} className="mt-3 w-full border border-border bg-background p-3 text-sm" placeholder={t("Banque, titulaire, RIB, IBAN, SWIFT")} />
      <button onClick={() => void saveBank()} className="mt-3 bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">{t("Enregistrer")}</button></div>
    <div className="space-y-3">{pays.length === 0 && <p className="text-sm text-muted-foreground">{t("Aucun paiement reçu.")}</p>}
      {pays.map((p) => <article key={p.id} className={`${box} flex flex-wrap items-center justify-between gap-3 text-sm`}>
        <div><strong>{p.businessName}</strong><p className="text-muted-foreground">{p.planName} · {p.amount} {t("MAD ·")} {new Date(p.createdAt).toLocaleDateString("fr-MA")} · {t(label[p.status] ?? p.status)}</p>
          {p.planPrice !== null && p.planPrice !== p.amount && <p className="text-xs text-destructive">{t("Attention : le prix du forfait est maintenant {{price}} MAD.", { price: p.planPrice })}</p>}</div>
        <div className="flex gap-4"><a href={`${BASE}/api/admin/payments/${p.id}/receipt`} target="_blank" rel="noreferrer" className="text-primary">{t("Voir le reçu")}</a>
          {p.status === "pending" && <><button disabled={busy === p.id} onClick={() => void act(p, "approve")} className="font-semibold text-primary disabled:opacity-50">{t("Valider")}</button><button disabled={busy === p.id} onClick={() => void act(p, "reject")} className="text-destructive disabled:opacity-50">{t("Refuser")}</button></>}</div>
      </article>)}</div>
  </section>
}
