# NewLook API — Flutter integration (category profiles, phase 1)

Base URL: the site domain (e.g. `https://newlook.morosmartcitys.com`). All JSON. Times are `Africa/Casablanca`; weekdays 0 = Sunday … 6 = Saturday; dates `YYYY-MM-DD`; instants ISO-8601 UTC.

## 1. Catalog — `GET /api/catalog`
Cache it. Send `If-None-Match: <etag>`; `304` means keep your copy. `Cache-Control: max-age=300`.

```json
{ "version": "2026-11-10.1",
  "amenities": { "wifi": { "ar": "Wi-Fi", "fr": "Wi-Fi", "en": "Wi-Fi", "es": "Wi-Fi" } },
  "categories": [ { "key": "barber", "value": "حلاقة رجالية", "labels": {…}, "features": ["live_status","walkin_queue","style_tags"],
                    "liveStates": ["free","busy","closed"], "styleTags": [{ "key": "fade", "labels": {…} }],
                    "amenities": ["ac","wifi","kids","card","parking","accessible"],
                    "theme": { "mode": "dark", "colors": { "light": {…}, "dark": {…} },
                               "fonts": { "display": "Reem Kufi", "body": "IBM Plex Sans Arabic", "accent": "Special Elite" },
                               "radius": 4, "assets": { "headerPattern": "/assets/themes/barber/pole.svg", "background": "/assets/themes/barber/wood.svg", "priceBoard": "chalkboard" } } } ],
  "default": { "key": "default", … } }
```

A business's `category` (Arabic value) maps to a catalog entry by `value`; unknown → `default`.

### Theme → `ThemeData`
| Theme key | Flutter |
| --- | --- |
| `colors.<mode>.primary` / `onPrimary` | `ColorScheme.primary` / `onPrimary` |
| `background` | `ColorScheme.surface`, `scaffoldBackgroundColor` |
| `surface` | `ColorScheme.surfaceContainer` (cards) |
| `text` / `muted` | `onSurface` / `onSurfaceVariant` |
| `accent` | `tertiary` (decoration only) |
| `border` | `outlineVariant` |
| `danger` | `error` |
| `success`, `warning` | `ThemeExtension<NewlookStatusColors>` |
| `fonts.display` / `fonts.body` | `GoogleFonts.getFont(name)` for display/headline vs body/label |
| `radius` | `BorderRadius.circular(radius)` in `CardTheme`, `InputDecorationTheme`, buttons |
| `assets.*` | SVG via `flutter_svg` (`headerPattern` repeated horizontally, 12 px high) |
| `assets.priceBoard` | `chalkboard` (dark board, accent font), `menu` (list), `tiles` (2-column grid) |

Default brightness of a profile screen = `theme.mode`.

## 2. Business profile — `GET /api/businesses/:id`
```json
{ "business": {
    "id": "…", "name": "…", "category": "حلاقة رجالية", "categoryKey": "barber", "city": "مراكش", "bio": "…", "phone": "0612345678",
    "address": { "line": "12 زنقة الورد", "district": "جليز", "lat": 31.63, "lng": -8.01 },
    "amenities": ["wifi","ac"],
    "extras": { "chairs": 2 },
    "todayStatus": { "openNow": true, "closesAt": "21:00", "nextOpen": null },
    "live": { "state": "busy", "waiting": 3, "estimatedWaitMinutes": 45, "updatedAt": "…", "stale": false },
    "currentAudience": null },
  "services": [ { "id": "…", "name": "قصة فيد", "price": 60, "durationMinutes": 30 } ],
  "works": [ { "id": "…", "title": "…", "caption": "…", "imageUrl": "/uploads/…", "tags": ["fade"] } ] }
```
- `live.state`: `free|busy|closed` (barber), `quiet|moderate|crowded|closed` (hammam), `unknown` = show nothing. `live` is `null` for categories without the feature.
- Hammam `extras`: `{ "genderSchedule": [{ "weekday": 5, "start": "08:00", "end": "14:00", "audience": "women|men|mixed|private" }], "ritualSteps": ["<serviceId>"], "bringList": [{ "label": "صابون بلدي", "available": true }] }`; `currentAudience`: `{ "now": "women", "until": "14:00", "next": "men" }` or `null`.
- Refresh every 60 s while the screen is visible. Directions: `https://www.google.com/maps/dir/?api=1&destination=lat,lng` (fallback: search by `address.line, district, city`).

Lists (`GET /api/businesses`, `GET /api/search?city=&category=&keyword=&budget=&availableNow=1`) return the same business object (plus `cover`, or `service` + `price` for search).

## 3. Walk-in queue (barber, feature `walkin_queue`)
- Join: `POST /api/businesses/:id/queue` `{ "name": "Ali", "phone": "0612345678" }` → `201 { "id", "token", "position", "estimatedWaitMinutes" }`. **Store `id` + `token` securely** (they are the only proof of the ticket).
- Status: `GET /api/queue/:id?token=…` → `{ "status": "waiting|served|no_show|cancelled", "position", "estimatedWaitMinutes", "businessName" }`. Poll every 30 s while `waiting`; delete the ticket otherwise.
- Cancel: `POST /api/queue/:id/cancel` `{ "token" }`.

## 4. Slots and bookings
- `GET /api/businesses/:id/slots?services=<id1,id2>&day=YYYY-MM-DD[&audience=women|men]` → `{ "slots": ["2026-11-12T09:00:00.000Z", …] }`. `audience` is required for a hammam whose `genderSchedule` is not empty (`400 audience_required` otherwise).
- `POST /api/businesses/:id/bookings` `{ "serviceIds": ["…"], "startsAt": "<a slot, unchanged>", "name", "phone", "audience"? }` → `201 { "id", "status": "pending" }`.

## 5. Pro (signed-in) endpoints used by the app
Session = httpOnly cookie from `POST /api/auth/login` (keep a cookie jar).
- `PATCH /api/me/live` `{ "state": "free" }` → `{ "live": {…} }`
- `GET /api/me/queue` → `{ "entries": [{ "id", "name", "phone", "createdAt" }] }`; `POST /api/me/queue/:id/serve`, `/:id/no-show`, `POST /api/me/queue/clear`
- `PUT /api/me/business` with `address`, `amenities`, `extras` (+ the base fields)
- `PATCH /api/me/portfolio/:id` `{ "tags": ["fade"] }`

## 6. Errors
Body: `{ "error": "<code>" }`.
| HTTP | code | Meaning |
| --- | --- | --- |
| 400 | `invalid_input` | Bad field / not allowed for this category |
| 400 | `invalid_phone` | Phone is not a Moroccan mobile/landline |
| 400 | `schedule_outside_hours` | Women/men range outside opening hours |
| 400 | `audience_required` | Hammam slots need `audience` |
| 400 | `feature_unavailable` | Category has no such feature |
| 401 | `unauthenticated` | Not signed in |
| 404 | `not_found` | Unknown id, unpublished business, or wrong queue token |
| 409 | `slot_unavailable` | Slot taken / wrong audience |
| 409 | `closed_now` / `queue_full` | Queue cannot be joined |
| 429 | `already_in_queue` / `too_many_bookings` | Limits per phone |
| 429 | (none) | Rate limit — retry later |
