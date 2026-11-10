# تصميم: بروفايل خاص بكل صنف (المرحلة 1)

- **التاريخ:** 2026-11-10
- **الحالة:** في انتظار مراجعة صاحب المشروع
- **القرّاء:** فريق الموقع (React)، فريق التطبيق (Flutter)، فريق الـ API (Express + MongoDB)

## 1. الهدف

لكل صنف هوية بصرية خاصة به، وميزات مغربية لا يقدمها أي منافس عالمي (Fresha، Booksy، Planity).

الـ API هو المصدر الوحيد للسمات والإعدادات. الموقع وتطبيق Flutter يقرآن منه نفس البيانات، فيعرضان نفس الشكل.

**المرحلة 1 تشمل:**
- الأساس المشترك: كتالوج الأصناف، السمات، المعلومات الإضافية لكل نشاط.
- الحلاق: الحالة الحية، الطابور عن بعد، وسوم الأعمال.
- الحمام والسبا: أوقات الرجال والنساء، "صاوب الطقس ديالك"، "شنو تجيب معاك"، الازدحام.
- لكل الأصناف: العنوان، "خذني ليه"، الاتصال، الأيقونات، "حالته اليوم"، والحجز بعدة خدمات.

**خارج المرحلة 1:**
- عدة حلاقين في نفس المحل.
- التقييمات.
- "بحال المرة اللي فاتت".
- حمام العروس.
- النكّافة وباقات المناسبات.
- وضع رمضان والعيد.
- اختبارات الشعر والبشرة.
- "بغيت بحال هادي" للأظافر.

## 2. الأصناف ومفاتيحها

قيمة `category` المخزنة تبقى كما هي (الاسم العربي)، لكي لا تنكسر البيانات الحالية. كل صنف يُعرف أيضاً بمفتاح ثابت `key` يستعمله التطبيق والموقع.

| `key` | `category` المخزن | الميزات في المرحلة 1 |
| --- | --- | --- |
| `barber` | حلاقة رجالية | `live_status`, `walkin_queue`, `style_tags` |
| `hammam` | الحمام والسبا | `crowd_status`, `gender_schedule`, `ritual_builder`, `bring_list` |
| `women_salon` | صالون نسائي | — (السمة فقط) |
| `hair` | الشعر والتصفيف | — |
| `skincare` | العناية بالبشرة | — |
| `nails` | الأظافر | — |
| `makeup` | المكياج | — |

كل الأصناف تأخذ الميزات العامة: `address`, `amenities`, `today_status`, `multi_service_booking`.

## 3. كتالوج الأصناف: `GET /api/catalog`

### 3.1 الملف المصدر
الملف `server/src/catalog/categories.js` يعرّف الأصناف. لا يوجد كتالوج في قاعدة البيانات في المرحلة 1: تغيير لون يعني تعديل هذا الملف ثم نشر السيرفر، دون أي تحديث للتطبيق.

### 3.2 شكل الرد

```json
{
  "version": "2026-11-10.1",
  "categories": [
    {
      "key": "barber",
      "value": "حلاقة رجالية",
      "labels": { "ar": "حلاقة رجالية", "fr": "Barbier", "en": "Barber", "es": "Barbería" },
      "features": ["live_status", "walkin_queue", "style_tags"],
      "styleTags": [
        { "key": "fade", "labels": { "ar": "فيد", "fr": "Dégradé", "en": "Fade", "es": "Degradado" } }
      ],
      "amenities": ["ac", "wifi", "kids", "card", "parking", "accessible"],
      "theme": {
        "mode": "dark",
        "colors": {
          "light": { "background": "#F4EDE4", "surface": "#FFFFFF", "text": "#1E1612", "muted": "#6B5B50", "primary": "#B4232A", "onPrimary": "#FFFFFF", "accent": "#B8893B", "border": "#D9CBBB", "success": "#2E7D4F", "warning": "#C9862B", "danger": "#B4232A" },
          "dark":  { "background": "#17110E", "surface": "#221A15", "text": "#F3E9DC", "muted": "#B8A693", "primary": "#C8373D", "onPrimary": "#FFFFFF", "accent": "#C99A4B", "border": "#3A2E26", "success": "#4CAF7A", "warning": "#E0A548", "danger": "#E2555A" }
        },
        "fonts": { "display": "Reem Kufi", "body": "IBM Plex Sans Arabic", "accent": "Special Elite" },
        "radius": 4,
        "assets": {
          "headerPattern": "/assets/themes/barber/pole.svg",
          "background": "/assets/themes/barber/wood.svg",
          "priceBoard": "chalkboard"
        }
      }
    }
  ]
}
```

### 3.3 القواعد
- **التخزين المؤقت:** الرد يحمل `ETag` مبنياً على `version`، و`Cache-Control: public, max-age=300`. التطبيق يحفظ آخر نسخة ويرسل `If-None-Match`.
- **الألوان:** صيغة `#RRGGBB` دائماً، ولكل صنف وضع فاتح ووضع داكن. يكون `mode` هو الوضع الافتراضي لصفحة البروفايل. أي تركيبة نص/خلفية في السمة يجب أن تحقق تباين WCAG AA (4.5:1).
- **الخطوط:** أسماء عائلات Google Fonts. يقرؤها Flutter بحزمة `google_fonts`، والموقع يحمّلها من Google Fonts.
- **الأصول:** `assets` روابط نسبية إلى ملفات SVG خفيفة في `public/assets/themes/<key>/`. الملفات نفسها لا تغير معنى الصفحة، فهي زخرفة فقط.
- **قيمة `priceBoard`:** `"chalkboard"` | `"menu"` | `"tiles"`. تحدد شكل قائمة الأسعار.
- **صنف غير معروف:** تُطبق عليه السمة العامة `default` (ألوان الموقع الحالية).

### 3.4 تحويل السمة في Flutter

| مفتاح السمة | Flutter |
| --- | --- |
| `colors.<mode>.primary` | `ColorScheme.primary` |
| `colors.<mode>.onPrimary` | `ColorScheme.onPrimary` |
| `colors.<mode>.background` | `ColorScheme.surface` + `scaffoldBackgroundColor` |
| `colors.<mode>.surface` | `ColorScheme.surfaceContainer` |
| `colors.<mode>.text` | `ColorScheme.onSurface` |
| `colors.<mode>.muted` | `ColorScheme.onSurfaceVariant` |
| `colors.<mode>.accent` | `ColorScheme.tertiary` |
| `colors.<mode>.border` | `ColorScheme.outlineVariant` |
| `colors.<mode>.danger` | `ColorScheme.error` |
| `colors.<mode>.success`, `warning` | `ThemeExtension<NewlookStatusColors>` |
| `fonts.display` | `TextTheme.display*` / `headline*` |
| `fonts.body` | `TextTheme.body*` / `label*` |
| `radius` | `BorderRadius.circular(radius)` في `CardTheme` و `InputDecorationTheme` |

## 4. المعلومات الإضافية للنشاط

### 4.1 حقول جديدة في `Business` (لكل الأصناف)

| الحقل | النوع | القواعد |
| --- | --- | --- |
| `address` | `{ line: string ≤ 200, district: string ≤ 80, lat?: number, lng?: number }` | `lat` بين −90 و 90، و`lng` بين −180 و 180 |
| `amenities` | `string[]` | كل قيمة من `catalog.amenities` الخاصة بالصنف |
| `extras` | object | يتحقق منه zod حسب الصنف (4.2) |

### 4.2 `extras` حسب الصنف

**الحلاق `barber`:**
```json
{ "chairs": 2 }
```
`chairs` عدد صحيح بين 1 و 20، والقيمة الافتراضية 1.

**الحمام `hammam`:**
```json
{
  "genderSchedule": [ { "weekday": 5, "start": "08:00", "end": "14:00", "audience": "women" } ],
  "ritualSteps": ["<serviceId>", "<serviceId>"],
  "bringList": [ { "label": "صابون بلدي", "available": true } ]
}
```
- `audience` من القيم: `women` | `men` | `mixed` | `private`.
- فترات نفس اليوم لا تتداخل.
- `ritualSteps`: لائحة مرتبة من معرفات خدمات تابعة لنفس النشاط، 12 كحد أقصى.
- `bringList`: 15 عنصراً كحد أقصى، والنص 40 حرفاً كحد أقصى.

**الأصناف الأخرى:** `extras` فارغ `{}`.

### 4.3 الوسوم على الأعمال
تضاف إلى `Portfolio` الخاصية `tags: string[]`، وكل وسم من `catalog.styleTags` الخاصة بالصنف (5 وسوم كحد أقصى للصورة الواحدة).

### 4.4 الواجهات
- `PUT /api/me/business`: يقبل `address` و `amenities` و `extras`. يرفض أي قيمة لا تناسب الصنف بخطأ `400 invalid_input`.
- `POST /api/me/portfolio` و `PATCH /api/me/portfolio/:id`: يقبلان `tags`.
- `GET /api/businesses/:id`: يضيف `categoryKey` و `address` و `amenities` و `extras` و `live` (القسم 5) و `todayStatus` (القسم 7).

## 5. الحالة الحية (الحلاق: `live_status`، الحمام: `crowd_status`)

### 5.1 البيانات
تضاف إلى `Business` الخاصية:
```json
"live": { "state": "free", "waiting": 0, "updatedAt": "..." }
```

| الصنف | قيم `state` |
| --- | --- |
| الحلاق | `free`, `busy`, `closed` |
| الحمام | `quiet`, `moderate`, `crowded`, `closed` |

### 5.2 الواجهات
- `PATCH /api/me/live` مع `{ "state": "...", "waiting"?: 0..50 }`. صاحب النشاط فقط. حد الطلبات: 120 في الساعة.
- القراءة تكون ضمن `GET /api/businesses/:id`، وضمن بطاقات `GET /api/businesses` و `GET /api/search` (الحقل `live` المحسوب).

### 5.3 الحالة المحسوبة (ما يراه الزبون)
يحسبها السيرفر، ولا يحسبها الموقع أو التطبيق:
1. **خارج أوقات العمل** (حسب `hours` وتوقيت الدار البيضاء): `closed`، مهما كانت القيمة المخزنة.
2. **`updatedAt` أقدم من 3 ساعات:** `unknown`، فلا تظهر أي شارة.
3. **غير ذلك:** القيمة المخزنة.
4. **عند الحلاق:** إذا كان الطابور (القسم 6) مفعلاً، يُحسب `waiting` من عدد من في الطابور بحالة `waiting`، ولا يُقرأ من القيمة المخزنة.
5. **وقت الانتظار التقريبي:** `estimatedWaitMinutes = ceil(waiting / chairs) × متوسط مدة خدمات النشاط` (30 دقيقة إذا لم توجد خدمات).

**شكل الرد:**
```json
"live": { "state": "busy", "waiting": 3, "estimatedWaitMinutes": 45, "updatedAt": "...", "stale": false }
```

### 5.4 البحث
`GET /api/search?availableNow=1` يرجع فقط النشاطات التي حالتها المحسوبة `free` (عند الحلاق) أو `quiet` (عند الحمام).

## 6. الطابور عن بعد (الحلاق: `walkin_queue`)

### 6.1 البيانات: مجموعة جديدة `QueueEntry`
```json
{
  "businessId": "...",
  "name": "...",
  "phone": "0612345678",
  "status": "waiting",
  "createdAt": "...",
  "calledAt": null,
  "token": "<سر عشوائي>"
}
```
- **قيم `status`:** `waiting` | `served` | `no_show` | `cancelled`.
- **فهرس:** `{ businessId, status, createdAt }`.

### 6.2 الواجهات
**للزبون (بدون حساب):**
- `POST /api/businesses/:id/queue` مع `{ name, phone, website? }`:
  - **الشروط:** النشاط مفتوح الآن، ولا توجد حالة يدوية `closed`.
  - **حد الطابور:** 30 شخصاً في الانتظار.
  - **رقم الهاتف:** لا يكون في أي طابور آخر بحالة `waiting`.
  - **الحماية:** حد الطلبات 6 في الساعة لكل IP، و honeypot.
  - **الرد:** `{ id, token, position, estimatedWaitMinutes }`.
- `GET /api/queue/:id?token=` → `{ status, position, estimatedWaitMinutes, businessName }`. بدون `token` صحيح: `404`.
- `POST /api/queue/:id/cancel` مع `{ token }`.

**للحلاق (صاحب النشاط):**
- `GET /api/me/queue` → لائحة `waiting` مرتبة، مع الاسم والهاتف ووقت الانضمام.
- `POST /api/me/queue/:id/serve` و `POST /api/me/queue/:id/no-show`.
- `POST /api/me/queue/clear` يحول كل `waiting` إلى `cancelled` (عند الإغلاق).

### 6.3 القواعد
- **الترتيب:** حسب `createdAt`، و`position` = عدد `waiting` قبله + 1.
- **التنظيف التلقائي:** كل `waiting` أقدم من 4 ساعات يُعتبر `no_show`. يُطبق عند كل قراءة، فلا حاجة إلى cron.
- **حفظ الدخول عند الزبون:** الموقع يحفظ `{id, token}` في `localStorage` ليرى رتبته إذا رجع إلى الصفحة. التطبيق يحفظها بنفس الطريقة.
- **التحديث:** الصفحة تسأل السيرفر كل 30 ثانية ما دام الزبون في الطابور. لا يوجد WebSocket في المرحلة 1.

## 7. "حالته اليوم"
`todayStatus` يُحسب في السيرفر:
```json
{ "openNow": true, "closesAt": "21:00", "nextOpen": null }
```
أو:
```json
{ "openNow": false, "closesAt": null, "nextOpen": { "weekday": 1, "time": "09:00" } }
```

## 8. أوقات الرجال والنساء (الحمام: `gender_schedule`)

- **الصلة بأوقات العمل:** `genderSchedule` يجب أن يكون داخل أوقات العمل `hours`. أي فترة خارجها تُرفض بـ `400 schedule_outside_hours`.
- **`currentAudience`:** يضاف إلى البروفايل والبطاقات:
  ```json
  { "now": "women", "until": "14:00", "next": "men" }
  ```
  أو `null` إذا لا توجد فترة الآن.
- **المواعيد:** `GET /api/businesses/:id/slots` يقبل `audience=women|men`. للحمام يكون مطلوباً إذا كان `genderSchedule` غير فارغ.
- **قاعدة اختيار الموعد:** يُقبل الموعد إذا كانت مدته كاملة داخل فترة واحدة جمهورها `audience` المطلوب أو `mixed`.
- **فترات `private`:** تظهر في الجدول للزبون ("حمام خاص")، لكنها لا تعطي أي موعد للحجز في المرحلة 1. الحجز الخاص يتم عبر الاتصال أو واتساب.
- **الحجز:** يخزن `audience`، والسيرفر يعيد التحقق منه داخل القفل.

## 9. الحجز بعدة خدمات (كل الأصناف) و"صاوب الطقس ديالك"

### 9.1 الحجز
يتغير `Booking`:
- `items: [{ serviceId, name, price, durationMinutes }]`، من 1 إلى 6 عناصر.
- `price` و `endsAt` = المجموع.
- يبقى `serviceName` (أسماء الخدمات مفصولة بـ « + ») لكي تعمل اللوحات الحالية.
- الحجوزات القديمة تُقرأ كأن فيها عنصراً واحداً.

### 9.2 الواجهات
- `GET /api/businesses/:id/slots?services=id1,id2&day=...&audience=...`
- `POST /api/businesses/:id/bookings` مع `{ serviceIds: [...], startsAt, name, phone, audience? }`.
- `serviceId` الواحد يبقى مقبولاً للتوافق مع الإصدار الحالي.
- كل الخدمات يجب أن تكون تابعة لنفس النشاط، وإلا `400 invalid_input`.

### 9.3 "صاوب الطقس ديالك" (الحمام)
- يعرض خدمات `ritualSteps` بالترتيب، ولكل واحدة مفتاح تشغيل.
- المجموع (الثمن والمدة) يظهر مباشرة.
- زر "اختار الوقت" يرسل الخدمات المختارة إلى نفس واجهة الحجز.
- لا يوجد منطق خاص في السيرفر غير الحجز بعدة خدمات.

## 10. "شنو تجيب معاك" (الحمام)
لائحة `extras.bringList` تُعرض كنقاط، ومع كل عنصر `available: true` تظهر علامة "متوفر عندنا". لا تحتاج واجهة خاصة.

## 11. الموقع (React)

| العنصر | المسؤولية |
| --- | --- |
| `src/lib/catalog-api.ts` | يجلب `/api/catalog` مرة واحدة في كل جلسة، ويقدم `useCategory(value)` |
| `ThemeScope` | يحول `theme.colors` إلى متغيرات CSS على حاوية البروفايل، ويحمّل الخطوط |
| `ProfileHeader` | الاسم، الصنف، شارة الحالة الحية، "حالته اليوم"، العنوان، "خذني ليه"، الاتصال، واتساب |
| `PriceBoard` | قائمة الأسعار حسب `priceBoard` (لوح طباشير / قائمة / مربعات) |
| `PortfolioGallery` | المعرض مع التصفية بالوسوم |
| `AmenityIcons` | الأيقونات |
| `LiveBadge` | الشارة في البروفايل والبطاقات |
| `WalkinQueue` | "زيدني فالصف" وعرض الرتبة |
| `GenderScheduleBar` | شريط "دابا: وقت النساء" وجدول الأسبوع |
| `RitualBuilder` | "صاوب الطقس ديالك" |
| `BringList` | "شنو تجيب معاك" |
| `BookingWidget` | يقبل عدة خدمات و `audience` |

- **في فضاء المهنيين (`/pro`):** نضيف:
  - أزرار الحالة الحية (كبيرة، صالحة للهاتف)
  - لائحة الطابور
  - العنوان والأيقونات
  - عدد الكراسي
  - جدول الرجال والنساء
  - ترتيب مراحل الطقس
  - "شنو تجيب معاك"
  - وسوم الصور
- **الحدود:** كل ميزة في ملف مستقل، و`BusinessProfile.tsx` يركّب العناصر حسب `features` فقط.

## 12. الأخطاء

| الحالة | الرد |
| --- | --- |
| `extras` أو `amenities` لا تناسب الصنف | `400 invalid_input` |
| فترة حمام خارج أوقات العمل | `400 schedule_outside_hours` |
| الانضمام للطابور والمحل مغلق | `409 closed_now` |
| الطابور ممتلئ | `409 queue_full` |
| رقم الهاتف في طابور آخر | `429 already_in_queue` |
| `token` الطابور خاطئ | `404 not_found` |
| موعد لا يناسب `audience` | `409 slot_unavailable` |
| تغيير الصنف لنشاط له `extras` | تُحذف `extras` التي لا تناسب الصنف الجديد، وتبقى `address` و `amenities` المسموح بها |

## 13. الاختبارات
تمتد اختبارات `e2e` الحالية بهذه الحالات:
- `/api/catalog`: الشكل، و`ETag`، و`304`.
- `extras`: قبول القيم الصحيحة ورفض الخاطئة لكل صنف.
- **الحالة الحية:** التحديث، والقيمة القديمة (أكثر من 3 ساعات) = `unknown`، وخارج الأوقات = `closed`، ووقت الانتظار المحسوب.
- **الطابور:** الانضمام، والرتبة، وعدم التكرار بنفس الرقم، و`token` الخاطئ، و`serve`/`no-show`، والتنظيف بعد 4 ساعات، والمحل مغلق.
- **الحمام:** مواعيد `women` لا تظهر في فترة `men`، وحجز خارج الفترة مرفوض، وفترة خارج أوقات العمل مرفوضة.
- **الحجز بعدة خدمات:** المدة الكاملة، وعدم التداخل، وخدمة من نشاط آخر مرفوضة، والتوافق مع `serviceId` الواحد.
- **البحث:** `availableNow=1`.

## 14. وثيقة فريق Flutter
تُكتب الوثيقة `docs/api/flutter-integration.md` مع المرحلة 1، وتشمل:
- شكل `/api/catalog` وتحويل السمة (3.4).
- واجهات البروفايل والطابور والحجز مع أمثلة JSON.
- قواعد التخزين المؤقت (`ETag`) والتحديث الدوري (30 ثانية للطابور، و60 ثانية للبروفايل).
- رموز الأخطاء (القسم 12).
