import { useLocation } from "react-router-dom"
import { useTranslation } from 'react-i18next'

// Legal links only. The admin entry point is no longer advertised on public pages:
// admins open /admin directly.
export default function AdminShortcut() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  if (pathname.startsWith("/admin") || ["/privacy", "/terms", "/legal"].includes(pathname)) return null
  return <nav className="fixed bottom-4 end-4 z-40 flex gap-3 border border-border bg-card px-4 py-2 text-xs text-muted-foreground shadow-md"><a href="/privacy" className="hover:text-primary">{t("سياسة الخصوصية")}</a><a href="/terms" className="hover:text-primary">{t("شروط الاستعمال")}</a><a href="/legal" className="hover:text-primary">{t("الإشعارات القانونية")}</a></nav>
}
