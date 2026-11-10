import { useTranslation } from "react-i18next"
import type { Live } from "@/lib/business-types"

const TONE: Record<string, string> = {
  free: "bg-emerald-600 text-white", quiet: "bg-emerald-600 text-white",
  busy: "bg-amber-500 text-black", moderate: "bg-amber-500 text-black",
  crowded: "bg-red-600 text-white", closed: "bg-neutral-700 text-white",
}

/** Live status pill. Renders nothing when the status is unknown/stale. */
export default function LiveBadge({ live, className = "" }: { live: Live | null | undefined; className?: string }) {
  const { t } = useTranslation()
  if (!live || live.state === "unknown") return null
  const text =
    live.state === "free" ? t("فاضي دابا")
    : live.state === "busy" ? (live.waiting > 0 ? t("{{n}} فالانتظار ≈ {{m}} دقيقة", { n: live.waiting, m: live.estimatedWaitMinutes ?? 0 }) : t("مشغول دابا"))
    : live.state === "quiet" ? t("خاوي دابا")
    : live.state === "moderate" ? t("متوسط دابا")
    : live.state === "crowded" ? t("عامر دابا")
    : t("مسدود دابا")
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${TONE[live.state] ?? ""} ${className}`}>
    <span className="h-2 w-2 rounded-full bg-current opacity-80" aria-hidden />{text}
  </span>
}
