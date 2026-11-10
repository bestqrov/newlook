import { useEffect, type CSSProperties, type ReactNode } from "react"
import type { CategoryTheme } from "@/lib/catalog-api"

/** "#RRGGBB" → "H S% L%" (the format our Tailwind tokens expect). */
function hsl(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2
  let h = 0, s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
    h *= 60
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

const loaded = new Set<string>()
function loadFont(family?: string) {
  if (!family || loaded.has(family)) return
  loaded.add(family)
  const link = document.createElement("link")
  link.rel = "stylesheet"
  link.href = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@400;600;700&display=swap`
  document.head.appendChild(link)
}

/** Applies a category theme to everything inside it (Tailwind tokens + fonts). */
export default function ThemeScope({ theme, children, className = "" }: { theme: CategoryTheme | null | undefined; children: ReactNode; className?: string }) {
  useEffect(() => { if (theme) { loadFont(theme.fonts.display); loadFont(theme.fonts.body); loadFont(theme.fonts.accent) } }, [theme])
  if (!theme) return <div className={`bg-background text-foreground ${className}`}>{children}</div>
  const c = theme.colors[theme.mode]
  const vars = {
    "--background": hsl(c.background), "--foreground": hsl(c.text),
    "--card": hsl(c.surface), "--card-foreground": hsl(c.text),
    "--popover": hsl(c.surface), "--popover-foreground": hsl(c.text),
    "--primary": hsl(c.primary), "--primary-foreground": hsl(c.onPrimary), "--ring": hsl(c.primary),
    "--muted": hsl(c.surface), "--muted-foreground": hsl(c.muted),
    "--accent": hsl(c.accent), "--border": hsl(c.border), "--input": hsl(c.border),
    "--destructive": hsl(c.danger), "--success": hsl(c.success),
    "--radius": `${theme.radius}px`,
    "--font-display": `'${theme.fonts.display}', 'IBM Plex Sans Arabic', sans-serif`,
    "--font-sans": `'${theme.fonts.body}', sans-serif`,
    "--font-accent": theme.fonts.accent ? `'${theme.fonts.accent}', monospace` : "inherit",
    "--status-warning": c.warning,
  } as CSSProperties
  return <div style={vars} data-theme-mode={theme.mode} className={`bg-background font-sans text-foreground ${className}`}>{children}</div>
}
