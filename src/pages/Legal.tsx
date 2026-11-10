import { useEffect } from "react"
import { useLocation } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import legal from "@/data/legal.json"
import { useTranslation } from 'react-i18next'

const order = ["/privacy", "/terms", "/legal"]
const links = [["/privacy", "سياسة الخصوصية"], ["/terms", "شروط الاستعمال"], ["/legal", "الإشعارات القانونية"]]

export default function Legal() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const idx = Math.max(0, order.indexOf(pathname))
  const doc = (legal as { title: string; body: string }[])[idx]
  useEffect(() => { document.title = `${doc.title} — نيولوك` }, [doc.title])
  const blocks = doc.body.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean)
  return <div dir="rtl" className="min-h-screen bg-background text-foreground">
    <header className="border-b border-border"><div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5"><a href="/" className="font-display text-2xl font-bold">{t("نيولوك")}</a><a href="/" className="inline-flex items-center gap-2 text-sm text-primary">{t("الصفحة الرئيسية")} <ArrowLeft size={16} /></a></div></header>
    <main className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="text-4xl">{t(doc.title)}</h1>
      <div className="mt-8 space-y-5 leading-8">{blocks.map((b, i) => b.startsWith("#") ? <h2 key={i} className="pt-4 text-2xl">{b.replace(/^#+\s*/, "")}</h2> : <p key={i} className="whitespace-pre-line text-muted-foreground">{b}</p>)}</div>
      <nav className="mt-12 flex flex-wrap gap-5 border-t border-border pt-6 text-sm">{links.map(([h, l]) => <a key={h} href={h} className={h === pathname ? "font-semibold text-primary" : "text-muted-foreground hover:text-primary"}>{t(l)}</a>)}</nav>
    </main>
  </div>
}
