// Client for the NewLook API (Express + MongoDB, see /server).
// The session lives in an httpOnly cookie: no token is ever stored in JS.
import { useSyncExternalStore } from "react"

const BASE = ((import.meta.env.VITE_API_URL as string | undefined) ?? "").replace(/\/$/, "")

export class ApiError extends Error {
  status: number
  code: string
  constructor(status: number, code: string) { super(code); this.status = status; this.code = code }
}

type Opts = { method?: string; body?: unknown; form?: FormData }

export async function api<T = any>(path: string, opts: Opts = {}): Promise<T> {
  const init: RequestInit = { method: opts.method ?? (opts.body || opts.form ? "POST" : "GET"), credentials: "include" }
  if (opts.form) init.body = opts.form
  else if (opts.body !== undefined) { init.body = JSON.stringify(opts.body); init.headers = { "Content-Type": "application/json" } }
  let res: Response
  try { res = await fetch(`${BASE}${path}`, init) } catch { throw new ApiError(0, "network") }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(res.status, data?.error ?? "error")
  return data as T
}

export const fileUrl = (u: string) => (u.startsWith("/") ? `${BASE}${u}` : u)
export const qs = (o: Record<string, string | number | undefined>) =>
  new URLSearchParams(Object.entries(o).filter(([, v]) => v !== undefined && v !== "").map(([k, v]) => [k, String(v)])).toString()

// ─── Auth store (shared by every page) ─────────────────────────────
export type User = { id: string; email: string; name: string; role: "user" | "admin" }
type AuthState = { user: User | null; mfa: boolean; ready: boolean }

let state: AuthState = { user: null, mfa: false, ready: false }
const listeners = new Set<() => void>()
const set = (s: Partial<AuthState>) => { state = { ...state, ...s }; listeners.forEach((l) => l()) }
let loading: Promise<void> | null = null

export function refreshAuth() {
  loading = api<{ user: User | null; mfa: boolean }>("/api/auth/me")
    .then((r) => set({ user: r.user, mfa: r.mfa, ready: true }))
    .catch(() => set({ user: null, mfa: false, ready: true }))
  return loading
}

export const auth = {
  async login(email: string, password: string): Promise<"ok" | "mfa"> {
    const r = await api<{ user?: User; mfa?: string }>("/api/auth/login", { body: { email, password } })
    if (r.mfa) return "mfa"
    set({ user: r.user ?? null, mfa: false, ready: true })
    return "ok"
  },
  async register(email: string, password: string, name: string) {
    const r = await api<{ user: User }>("/api/auth/register", { body: { email, password, name } })
    set({ user: r.user, mfa: false, ready: true })
  },
  async verifyMfa(code: string) {
    const r = await api<{ user: User }>("/api/auth/mfa/verify", { body: { code } })
    set({ user: r.user, mfa: true, ready: true })
  },
  async logout() {
    await api("/api/auth/logout", { method: "POST" }).catch(() => {})
    set({ user: null, mfa: false })
  },
}

export function useAuth(): AuthState {
  const s = useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l) }, () => state)
  if (!s.ready && !loading) void refreshAuth()
  return s
}

/** Human message (Darija) for an API error code. */
export function errorText(e: unknown, fallback = "وقع مشكل. عاود المحاولة."): string {
  const code = e instanceof ApiError ? e.code : ""
  const map: Record<string, string> = {
    network: "ما قدرناش نتصلو بالسيرفر. تأكد من الأنترنيت.",
    invalid_credentials: "البريد الإلكتروني أو كلمة المرور غالطين.",
    account_locked: "الحساب تبلوكا 15 دقيقة بسبب محاولات كثيرة.",
    email_taken: "هاد البريد الإلكتروني مسجل من قبل. دخل بحسابك.",
    invalid_input: "تأكد من المعلومات اللي دخلتي.",
    invalid_phone: "رقم الهاتف ماشي صحيح (مثال: 0612345678).",
    slot_unavailable: "هاد الوقت ما بقاش متاح. اختار وقت آخر.",
    too_many_bookings: "عندك بزاف ديال الحجوزات المفتوحة بهاد الرقم.",
    too_many_offers: "عندك 5 عروض مفتوحة. سالي ولا لغي شي واحد.",
    too_many_pending: "عندك وصولات فالانتظار. تسنى التحقق منهم.",
    offer_taken: "هاد العرض تقبل من مهني آخر.",
    subscription_inactive: "الاشتراك ديالك ماشي مفعل.",
    past_date: "اختار تاريخ فالمستقبل.",
    file_too_large: "الملف كبير بزاف (الحد 5 ميغا).",
    invalid_file_type: "نوع الملف ماشي مقبول. استعمل JPG أو PNG أو WEBP.",
    invalid_code: "الرمز غالط.",
    mfa_expired: "سالى الوقت. دخل من جديد.",
    mfa_not_configured: "التحقق الثنائي ما مفعلش لهاد الحساب.",
    already_processed: "هاد العملية تدارت من قبل.",
    plan_in_use: "هاد الباقة مستعملة وما يمكنش تتمسح.",
  }
  if (e instanceof ApiError && e.status === 429 && !map[code]) return "بزاف ديال المحاولات. تسنى شوية وعاود."
  return map[code] ?? fallback
}
