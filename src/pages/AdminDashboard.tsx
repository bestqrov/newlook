import { useCallback, useEffect, useState } from "react"
import { LogOut, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { api, auth, errorText, fileUrl, useAuth } from "@/lib/api"
import { CATEGORIES, CITIES } from "@/lib/catalog"
import AdminPayments from "@/components/AdminPayments"

type SubInfo = { status: string; expiresAt: string | null; planName: string | null } | null
type Biz = { id: string; name: string; category: string; city: string; phone: string; bio: string; published: boolean; createdAt: string; subscription: SubInfo }
type Plan = { id: string; code: string; name: string; months: number; price: number; active: boolean }
type Offer = { id: string; serviceName: string; category: string; city: string; clientName: string; proposedPrice: number; status: string }
type Svc = { id: string; name: string; price: number; durationMinutes: number }
type Work = { id: string; title: string; imageUrl: string }
type AuditEntry = { id: string; actor: string; action: string; target: string; createdAt: string }

const statusLabel: Record<string, string> = { trial: "Essai", active: "Actif", expired: "Expiré", suspended: "Suspendu" }
const offerLabel: Record<string, string> = { open: "Ouverte", accepted: "Acceptée", cancelled: "Annulée" }
const box = "border border-border bg-card p-5"
const input = "border border-border bg-background p-2 text-sm"
const adminErr = (e: unknown, fallback: string) => {
  const m = errorText(e, "")
  return m || fallback
}

function AdminLogin() {
  const { t } = useTranslation()
  const [step, setStep] = useState<"password" | "code">("password")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [code, setCode] = useState("")
  const [msg, setMsg] = useState("")
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg(""); setBusy(true)
    try {
      if (step === "password") {
        const r = await auth.login(email, password)
        if (r === "mfa") setStep("code")
        else { await auth.logout(); setMsg("Ce compte n'est pas administrateur.") }
      } else {
        await auth.verifyMfa(code)
      }
    } catch (err) { setMsg(adminErr(err, "Connexion impossible.")) }
    finally { setBusy(false) }
  }

  return <main dir="ltr" lang="fr" className="grid min-h-screen place-items-center bg-background px-5"><form onSubmit={(e) => void submit(e)} className={`${box} w-full max-w-sm space-y-4`}>
    <h1 className="text-3xl">{t("Connexion Super Admin")}</h1>
    {step === "password" ? <>
      <input required type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("Adresse e-mail")} className={`${input} w-full`} />
      <input required type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("Mot de passe")} className={`${input} w-full`} />
    </> : <>
      <p className="text-sm text-muted-foreground">{t("Saisissez le code à 6 chiffres de votre application d'authentification.")}</p>
      <input required inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="123456" className={`${input} w-full text-center text-2xl tracking-widest`} autoFocus />
    </>}
    <button disabled={busy} className="w-full bg-primary p-3 font-semibold text-primary-foreground disabled:opacity-60">{step === "password" ? t("Se connecter") : t("Vérifier")}</button>
    {msg && <p className="text-sm text-destructive">{t(msg)}</p>}
    <a href="/" className="block text-center text-sm text-primary">{t("Retour au site")}</a>
  </form></main>
}

export default function AdminDashboard() {
  const { t } = useTranslation()
  const { user, mfa, ready } = useAuth()
  const isAdmin = !!user && user.role === "admin" && mfa
  const [tab, setTab] = useState<"overview" | "pros" | "plans" | "offers" | "pay" | "audit">("overview")
  const [editing, setEditing] = useState<Biz | null>(null)
  const [editSvc, setEditSvc] = useState<Svc[]>([])
  const [editWorks, setEditWorks] = useState<Work[]>([])
  const [biz, setBiz] = useState<Biz[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [offers, setOffers] = useState<Offer[]>([])
  const [stats, setStats] = useState({ users: 0, revenue: 0 })
  const [log, setLog] = useState<AuditEntry[]>([])
  const [msg, setMsg] = useState("")
  const [q, setQ] = useState("")

  const load = useCallback(async () => {
    const [b, p, o, s] = await Promise.all([
      api<{ businesses: Biz[] }>("/api/admin/businesses"),
      api<{ plans: Plan[] }>("/api/admin/plans"),
      api<{ offers: Offer[] }>("/api/admin/offers"),
      api<{ users: number; revenue: number }>("/api/admin/stats"),
    ])
    setBiz(b.businesses); setPlans(p.plans); setOffers(o.offers); setStats(s)
  }, [])
  useEffect(() => { if (isAdmin) void load().catch((e) => setMsg(adminErr(e, "Chargement impossible."))) }, [isAdmin, load])
  useEffect(() => { if (isAdmin && tab === "audit") void api<{ entries: AuditEntry[] }>("/api/admin/audit").then((r) => setLog(r.entries)).catch(() => {}) }, [isAdmin, tab])

  /** Runs an admin action, shows the result, reloads the lists. */
  const run = async (fn: () => Promise<unknown>, ok: string, ko: string) => {
    try { await fn(); setMsg(ok) } catch (e) { setMsg(adminErr(e, ko)) }
    void load().catch(() => {})
  }

  if (!ready) return <main dir="ltr" className="grid min-h-screen place-items-center text-muted-foreground">{t("Vérification des droits...")}</main>
  if (!user || (user.role === "admin" && !mfa)) return <AdminLogin />
  if (!isAdmin) return <main dir="ltr" className="grid min-h-screen place-items-center px-5 text-center"><div><h1 className="text-3xl">{t("Vous n'avez pas les droits d'administrateur")}</h1><button onClick={() => void auth.logout()} className="mt-4 text-primary">{t("Se déconnecter")}</button></div></main>

  const togglePublish = (b: Biz) => run(() => api(`/api/admin/businesses/${b.id}`, { method: "PATCH", body: { published: !b.published } }), "Statut de publication mis à jour.", "Impossible de changer le statut.")
  const removeBiz = (b: Biz) => { if (window.confirm(t("Supprimer « {{name}} » définitivement ?", { name: b.name }))) void run(() => api(`/api/admin/businesses/${b.id}`, { method: "DELETE" }), "Activité supprimée.", "Impossible de supprimer l'activité.") }
  const setPlan = (b: Biz, planId: string) => { if (planId) void run(() => api(`/api/admin/businesses/${b.id}/plan`, { body: { planId } }), `Abonnement activé pour ${b.name}.`, "Impossible d'activer l'abonnement.") }
  const setStatus = (b: Biz, status: string) => { if (status) void run(() => api(`/api/admin/businesses/${b.id}/status`, { body: { status } }), "Statut de l'abonnement mis à jour.", "Impossible de changer le statut de l'abonnement.") }
  const savePlan = (p: Plan) => run(() => api(`/api/admin/plans/${p.id}`, { method: "PATCH", body: { name: p.name, price: Number(p.price), active: p.active, months: Number(p.months) } }), "Forfait enregistré.", "Impossible d'enregistrer le forfait.")
  const addPlan = () => run(() => api("/api/admin/plans", { method: "POST" }), "Nouveau forfait ajouté.", "Impossible d'ajouter le forfait.")
  const delPlan = (id: string) => { if (window.confirm(t("Supprimer le forfait ?"))) void run(() => api(`/api/admin/plans/${id}`, { method: "DELETE" }), "Forfait supprimé.", "Suppression impossible (forfait utilisé).") }
  const editPlan = (id: string, patch: Partial<Plan>) => setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  const offerStatus = (id: string, status: string) => run(() => api(`/api/admin/offers/${id}`, { method: "PATCH", body: { status } }), "Statut de l'offre mis à jour.", "Impossible de changer le statut de l'offre.")
  const delOffer = (id: string) => { if (window.confirm(t("Supprimer cette offre ?"))) void run(() => api(`/api/admin/offers/${id}`, { method: "DELETE" }), "Offre supprimée.", "Impossible de supprimer l'offre.") }

  const openEdit = async (b: Biz) => {
    setEditing({ ...b })
    const r = await api<{ services: Svc[]; works: Work[] }>(`/api/admin/businesses/${b.id}/details`).catch(() => ({ services: [], works: [] }))
    setEditSvc(r.services); setEditWorks(r.works)
  }
  const saveEdit = async () => {
    if (!editing) return
    try {
      await api(`/api/admin/businesses/${editing.id}`, { method: "PATCH", body: { name: editing.name, category: editing.category, city: editing.city, phone: editing.phone, bio: editing.bio } })
      setMsg("Modifications enregistrées."); setEditing(null); void load()
    } catch (e) { setMsg(adminErr(e, "Impossible d'enregistrer les modifications.")) }
  }
  const saveSvc = (s: Svc) => run(() => api(`/api/admin/services/${s.id}`, { method: "PATCH", body: { name: s.name, price: Number(s.price), durationMinutes: Number(s.durationMinutes) } }), "Service enregistré.", "Impossible d'enregistrer le service.")
  const delSvc = async (id: string) => { try { await api(`/api/admin/services/${id}`, { method: "DELETE" }); setEditSvc((p) => p.filter((x) => x.id !== id)); setMsg("Service supprimé.") } catch { setMsg("Impossible de supprimer le service.") } }
  const delWork = async (id: string) => { try { await api(`/api/admin/portfolio/${id}`, { method: "DELETE" }); setEditWorks((p) => p.filter((x) => x.id !== id)); setMsg("Réalisation supprimée.") } catch { setMsg("Impossible de supprimer la réalisation.") } }

  const activeSubs = biz.filter((b) => b.subscription?.status === "active")
  const filtered = biz.filter((b) => `${b.name} ${b.city} ${b.category}`.toLowerCase().includes(q.toLowerCase()))
  const statList = [["Utilisateurs", stats.users], ["Professionnels", biz.length], ["Publiés", biz.filter((b) => b.published).length], ["Abonnements actifs", activeSubs.length], ["Paiements validés (MAD)", stats.revenue], ["Offres ouvertes", offers.filter((o) => o.status === "open").length]]

  return <div dir="ltr" lang="fr" className="min-h-screen bg-background text-foreground">
    <header className="border-b border-border bg-card"><div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5"><span className="font-display text-2xl font-bold">{t("NewLook · Administration")}</span><div className="flex items-center gap-5 text-sm"><a href="/" className="text-muted-foreground">{t("Voir le site")}</a><button onClick={() => void auth.logout()} className="inline-flex items-center gap-2 text-primary"><LogOut size={16} />{t("Déconnexion")}</button></div></div></header>
    <main className="mx-auto max-w-6xl px-5 py-8">
      <nav className="mb-6 flex flex-wrap gap-2 text-sm">{([["overview", "Vue d'ensemble"], ["pros", "Professionnels et abonnements"], ["plans", "Forfaits et tarifs"], ["offers", "Offres clients"], ["pay", "Paiements"], ["audit", "Journal d'activité"]] as const).map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 ${tab === k ? "bg-primary text-primary-foreground" : "border border-border"}`}>{t(l)}</button>)}</nav>
      {msg && <p role="status" className="mb-5 border-s-2 border-primary bg-muted p-3 text-sm">{t(msg)}</p>}
      {tab === "pay" && <AdminPayments onChange={() => void load()} />}
      {tab === "overview" && <div className="grid grid-cols-2 gap-4 md:grid-cols-3">{statList.map(([l, v]) => <div key={l} className={box}><p className="text-xs text-muted-foreground">{t(String(l))}</p><p className="mt-2 font-display text-4xl">{String(v)}</p></div>)}</div>}
      {tab === "pros" && <section><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Rechercher par nom, ville ou spécialité")} className={`${input} mb-4 w-full max-w-sm`} />
        <div className="space-y-3">{filtered.map((b) => { const s = b.subscription; return <article key={b.id} className={`${box} grid gap-3 md:grid-cols-[1.4fr_1fr_auto] md:items-center`}>
          <div><h3 className="text-xl">{b.name} {!b.published && <span className="text-xs text-muted-foreground">{t("(brouillon)")}</span>}</h3><p className="text-sm text-muted-foreground">{b.category} · {b.city} · {b.phone || "—"}</p><p className="mt-1 text-xs">{t("Abonnement :")} <strong>{s ? t(statusLabel[s.status] ?? s.status) : t("Aucun")}</strong>{s?.planName && ` · ${s.planName}`}{s?.expiresAt && ` · expire le ${new Date(s.expiresAt).toLocaleDateString("fr-FR")}`}</p></div>
          <div className="flex flex-wrap gap-2"><select value="" onChange={(e) => setPlan(b, e.target.value)} className={input}><option value="">{t("Activer / prolonger un forfait…")}</option>{plans.filter((p) => p.active).map((p) => <option key={p.id} value={p.id}>{p.name} — {p.price} {t("MAD")}</option>)}</select><select value="" onChange={(e) => setStatus(b, e.target.value)} className={input}><option value="">{t("Changer le statut…")}</option>{Object.entries(statusLabel).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
          <div className="flex items-center gap-3 text-sm"><button onClick={() => void openEdit(b)} className="text-primary">{t("Modifier")}</button><button onClick={() => void togglePublish(b)} className="text-primary">{b.published ? t("Masquer") : t("Publier")}</button><a href={`/b/${b.id}`} target="_blank" rel="noreferrer" className="text-primary">{t("Voir")}</a><button onClick={() => removeBiz(b)} aria-label={t("Supprimer")} className="text-destructive"><Trash2 size={16} /></button></div>
        </article> })}{filtered.length === 0 && <p className="text-sm text-muted-foreground">{t("Aucun professionnel.")}</p>}</div></section>}
      {tab === "plans" && <section><p className="mb-4 text-sm text-muted-foreground">{t("Les tarifs des forfaits sont des valeurs par défaut, vous les contrôlez entièrement. Pensez à enregistrer chaque forfait après modification.")}</p><div className="grid gap-4 md:grid-cols-2">{plans.map((p) => <div key={p.id} className={`${box} space-y-3`}><p className="text-xs text-muted-foreground">{t("Durée :")} {p.months} {t("mois")}</p><input value={p.name} onChange={(e) => editPlan(p.id, { name: e.target.value })} className={`${input} w-full`} /><label className="block text-sm">{t("Prix (MAD)")}<input type="number" min="0" value={p.price} onChange={(e) => editPlan(p.id, { price: Number(e.target.value) })} className={`${input} mt-1 w-full`} /></label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={p.active} onChange={(e) => editPlan(p.id, { active: e.target.checked })} />{t("Forfait disponible")}</label><label className="block text-sm">{t("Durée (mois)")}<input type="number" min="1" max="60" value={p.months} onChange={(e) => editPlan(p.id, { months: Number(e.target.value) })} className={`${input} mt-1 w-full`} /></label><div className="flex gap-3"><button onClick={() => void savePlan({ ...p })} className="bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">{t("Enregistrer")}</button><button onClick={() => delPlan(p.id)} className="text-sm text-destructive">{t("Supprimer")}</button></div></div>)}</div><button onClick={() => void addPlan()} className="mt-4 border border-primary px-4 py-2 text-sm text-primary">{t("+ Nouveau forfait")}</button></section>}
      {tab === "offers" && <section className="space-y-3">{offers.map((o) => <article key={o.id} className={`${box} flex flex-wrap items-center justify-between gap-3 text-sm`}><div><strong>{o.serviceName}</strong> · {o.category} · {o.city}<p className="text-xs text-muted-foreground">{o.clientName || "—"} · {o.proposedPrice} {t("MAD")}</p></div><div className="flex gap-3"><select value={o.status} onChange={(e) => void offerStatus(o.id, e.target.value)} className={input}>{Object.keys(offerLabel).map((s) => <option key={s} value={s}>{t(offerLabel[s])}</option>)}</select><button onClick={() => delOffer(o.id)} aria-label={t("Supprimer")} className="text-destructive"><Trash2 size={16} /></button></div></article>)}{offers.length === 0 && <p className="text-sm text-muted-foreground">{t("Aucune offre.")}</p>}</section>}
      {tab === "audit" && <section className={box}><table className="w-full text-start text-sm"><thead><tr className="text-xs text-muted-foreground"><th className="text-start">{t("Date")}</th><th className="text-start">{t("Admin")}</th><th className="text-start">{t("Action")}</th><th className="text-start">{t("Cible")}</th></tr></thead><tbody>{log.map((a) => <tr key={a.id} className="border-t border-border"><td className="py-2">{new Date(a.createdAt).toLocaleString("fr-FR")}</td><td>{a.actor}</td><td>{a.action}</td><td className="font-mono text-xs">{a.target}</td></tr>)}</tbody></table>{log.length === 0 && <p className="text-sm text-muted-foreground">{t("Aucune action enregistrée.")}</p>}</section>}
      {editing && <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-foreground/60 p-4"><div className="w-full max-w-2xl space-y-3 bg-background p-6"><h2 className="text-2xl">{t("Modifier l'activité")}</h2>
        <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className={`${input} w-full`} />
        <div className="grid gap-3 sm:grid-cols-3"><select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className={input}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select><select value={editing.city} onChange={(e) => setEditing({ ...editing, city: e.target.value })} className={input}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select><input value={editing.phone ?? ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} placeholder={t("WhatsApp")} className={input} /></div>
        <textarea value={editing.bio ?? ""} onChange={(e) => setEditing({ ...editing, bio: e.target.value })} rows={3} placeholder={t("Présentation")} className={`${input} w-full`} />
        <h3 className="text-lg">{t("Services")}</h3>{editSvc.map((s) => <div key={s.id} className="flex gap-2"><input value={s.name} onChange={(e) => setEditSvc((p) => p.map((x) => x.id === s.id ? { ...x, name: e.target.value } : x))} className={`${input} flex-1`} /><input type="number" value={s.price} onChange={(e) => setEditSvc((p) => p.map((x) => x.id === s.id ? { ...x, price: Number(e.target.value) } : x))} className={`${input} w-24`} /><input type="number" min="5" max="600" value={s.durationMinutes} onChange={(e) => setEditSvc((p) => p.map((x) => x.id === s.id ? { ...x, durationMinutes: Number(e.target.value) } : x))} className={`${input} w-20`} aria-label={t("Durée (min)")} /><button onClick={() => void saveSvc(s)} className="text-sm text-primary">{t("Enregistrer")}</button><button onClick={() => void delSvc(s.id)} aria-label={t("Supprimer")} className="text-destructive"><Trash2 size={16} /></button></div>)}
        <h3 className="text-lg">{t("Réalisations")}</h3><div className="grid grid-cols-4 gap-2">{editWorks.map((w) => <div key={w.id}><img src={fileUrl(w.imageUrl)} alt={w.title} className="h-20 w-full object-cover" /><button onClick={() => void delWork(w.id)} className="text-xs text-destructive">{t("Supprimer")}</button></div>)}</div>
        <div className="flex gap-3 pt-2"><button onClick={() => void saveEdit()} className="bg-primary px-5 py-2 font-semibold text-primary-foreground">{t("Enregistrer")}</button><button onClick={() => setEditing(null)} className="border border-border px-5 py-2">{t("Fermer")}</button></div>
      </div></div>}
    </main>
  </div>
}
