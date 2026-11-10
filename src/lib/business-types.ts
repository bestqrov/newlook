export type LiveState = "free" | "busy" | "closed" | "quiet" | "moderate" | "crowded" | "unknown"
export type Live = { state: LiveState; waiting: number; estimatedWaitMinutes: number | null; updatedAt: string | null; stale: boolean }
export type TodayStatus = { openNow: boolean; closesAt: string | null; nextOpen: { weekday: number; time: string } | null }
export type Audience = "women" | "men" | "mixed" | "private"
export type ScheduleRange = { weekday: number; start: string; end: string; audience: Audience }
export type BringItem = { label: string; available: boolean }
export type Extras = { chairs?: number; genderSchedule?: ScheduleRange[]; ritualSteps?: string[]; bringList?: BringItem[] }
export type Address = { line: string; district: string; lat: number | null; lng: number | null }
export type PublicBusiness = {
  id: string; name: string; category: string; city: string; bio: string; phone: string
  categoryKey: string; address: Address; amenities: string[]; extras: Extras
  todayStatus: TodayStatus; live: Live | null
  currentAudience: { now: Audience; until: string; next: Audience | null } | null
  cover?: string | null
}
export type Service = { id: string; name: string; price: number; durationMinutes: number }
export type Work = { id: string; title: string; caption: string; imageUrl: string; tags: string[] }

export const DAY_NAMES = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]
