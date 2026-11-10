# تصميم: تطبيق نيولوك على Android (النسخة 1)

- **التاريخ:** 2026-11-10
- **الحالة:** موافَق عليه شفهياً، في انتظار مراجعة الوثيقة
- **المرجع:** `docs/api/flutter-integration.md`، و `docs/superpowers/specs/2026-11-10-category-profiles-design.md`

## 1. الهدف
تطبيق Flutter واحد للزبون وللمهني، يعيد في الهاتف تجربة "بروفايل خاص بكل صنف". البيانات والسمات كلها تأتي من نفس الـ API الذي يستعمله الموقع.

**داخل النسخة 1:**
- **الزبون:** البحث، والبروفايل بسمة الصنف، والحجز (بعدة خدمات، وبجمهور للحمام)، والصف عن بعد.
- **المهني:** الدخول، والحالة الحية، وإدارة الصف، والحجوزات.

**خارج النسخة 1:** إشعارات Push، والعروض، والدفع، ورفع الصور، وتعديل البروفايل، و iOS، والنشر على Play Store.

## 2. البيئة
- **الأدوات:** Flutter 3.19.6 (Dart 3.3)، و Android SDK 36، و Java 17، على Intel macOS 12.
- **الحزم:** يجب أن تكون نسخها متوافقة مع Dart 3.3.

| الحزمة | الاستعمال |
| --- | --- |
| `dio` + `cookie_jar` + `dio_cookie_manager` + `path_provider` | HTTP، وحفظ جلسة المهني (cookie) في ملف |
| `flutter_riverpod` | إدارة الحالة |
| `go_router` | التنقل |
| `google_fonts` | خطوط السمات |
| `flutter_svg` | زخارف الأصناف |
| `cached_network_image` | صور الأعمال |
| `url_launcher` | الخريطة، الاتصال، واتساب، الموقع |
| `shared_preferences` | تذكرة الصف المحفوظة |
| `flutter_localizations` + `intl` | العربية (RTL) والفرنسية |

- **عنوان الـ API:** `https://newlook.morosmartcitys.com`، ويمكن تغييره عند البناء بـ `--dart-define=API_BASE=...`.

## 3. البنية (`mobile/lib/`)

| المسار | المسؤولية |
| --- | --- |
| `api/client.dart` | Dio واحد: العنوان الأساسي، الـ cookies المحفوظة، تحويل `{error}` إلى `ApiException(code, status)` |
| `api/models.dart` | النماذج: `Catalog`، `CategoryDef`، `CategoryTheme`، `Business`، `Live`، `TodayStatus`، `Service`، `Work`، `QueueTicket`، `Booking` |
| `api/repository.dart` | كل الواجهات المستعملة (القسم 6) |
| `theme/category_theme.dart` | `CategoryTheme` → `ThemeData`، حسب الجدول 3.4 في وثيقة Flutter |
| `state/providers.dart` | providers لـ Riverpod: الكتالوج، البحث، البروفايل (يتحدث كل 60 ثانية)، التذكرة (كل 30 ثانية)، جلسة المهني |
| `l10n/strings.dart` | النصوص بالعربية والفرنسية |
| `screens/home_screen.dart` | البحث والبطاقات |
| `screens/profile_screen.dart` | البروفايل بسمة الصنف |
| `screens/booking_sheet.dart` | الحجز |
| `screens/ticket_screen.dart` | رتبتي في الصف |
| `screens/pro_login_screen.dart`، `screens/pro_dashboard_screen.dart` | جانب المهني |
| `widgets/` | `LiveBadge`، `PriceBoard`، `GenderScheduleBar`، `RitualBuilder`، `BringList`، `AmenityChips`، `HeaderPattern` |

## 4. السمات
- **غلاف الشاشة:** كل شاشة بروفايل تُلفّ بـ `Theme(data: themeFor(category), child: ...)`.
- **الوضع:** `theme.mode` يحدد الوضع الفاتح أو الداكن.
- **الألوان:** تحوَّل حسب الجدول 3.4، وألوان `success` و `warning` في `ThemeExtension<NewlookStatusColors>`.
- **الخطوط:** `GoogleFonts.getFont(display / body)`. إذا لم يتوفر الإنترنت لتحميل الخط، يُستعمل الخط الافتراضي.
- **`priceBoard`:**
  - `chalkboard`: لوح أخضر داكن، بإطار خشبي، وخط `accent`
  - `menu`: لائحة
  - `tiles`: شبكة من عمودين
- **الزخارف:** `headerPattern` ملف SVG يتكرر أفقياً بارتفاع 12 px، و`background` خلفية للبروفايل بشفافية خفيفة.
- **الكتالوج:** يُحفظ في الذاكرة، ويُطلب مرة واحدة لكل تشغيل.
- **صنف غير معروف:** يأخذ سمة `default`.

## 5. الشاشات

### الزبون
1. **الرئيسية:**
   - **البحث:** شريط بحث بكلمة.
   - **الفلاتر:** شرائح للأصناف من الكتالوج، وقائمة المدن، وخانة "غير اللي فاضيين دابا".
   - **النتائج:** لائحة بطاقات فيها الصورة والاسم والصنف والمدينة و`LiveBadge` وأرخص ثمن.
   - **في الأعلى:** زر "أنا مهني".
2. **البروفايل:** نفس عناصر الموقع وبنفس الترتيب:
   - رأس فيه الزخرفة والشارة و"حالته اليوم" والعنوان والأيقونات وأزرار خذني ليه / عيّط / واتساب.
   - شريط النساء والرجال إذا كان حماماً.
   - لوح الأسعار.
   - الصف إذا كان حلاقاً.
   - الطقس و"شنو تجيب معاك" إذا كان حماماً.
   - المعرض بالوسوم.
   - زر "احجز موعدك" ثابت أسفل الشاشة.
3. **نافذة الحجز** (من الأسفل):
   - الخدمة، أو مراحل الطقس المختارة.
   - نساء أو رجال إذا لزم.
   - 14 يوماً، ثم الأوقات، ثم الاسم والهاتف، ثم التأكيد.
   - **رسائل الأخطاء:** بالعربية حسب الرمز، مثل `slot_unavailable` و `too_many_bookings`.
4. **تذكرة الصف:**
   - تُحفظ `{businessId, id, token, businessName}` في `shared_preferences`.
   - تظهر رتبتي والوقت التقريبي، مع زر "خرجني".
   - تُحذف التذكرة عند `served` / `no_show` / `cancelled`.
   - إذا كانت هناك تذكرة نشطة، تظهر بطاقة في الرئيسية.

### المهني
5. **الدخول:**
   - `POST /api/auth/login`.
   - **إذا كان الرد `mfa`:** تظهر رسالة "حساب الإدارة: استعمل الموقع".
   - **بعد النجاح:** `GET /api/me/business`. إذا لم يكن له نشاط، تظهر رسالة مع رابط `/pro` في الموقع.
6. **اللوحة:**
   - أزرار الحالة الكبيرة حسب `liveStates`.
   - قسم "الصف" إذا كانت الميزة `walkin_queue`، يتحدث كل 20 ثانية، مع زري دخل / ما جاش.
   - قسم "الحجوزات" القادمة، مع أزرار تأكيد / إلغاء / تم حسب الحالة.
   - زر "خروج"، ورابط "عدّل البروفايل فالموقع".

## 6. الواجهات المستعملة
- `GET /api/catalog`
- `GET /api/businesses`
- `GET /api/search`
- `GET /api/businesses/:id`
- `GET /api/businesses/:id/slots`
- `POST /api/businesses/:id/bookings`
- `POST /api/businesses/:id/queue`
- `GET /api/queue/:id`
- `POST /api/queue/:id/cancel`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/me/business`
- `PATCH /api/me/live`
- `GET /api/me/queue`
- `POST /api/me/queue/:id/serve`
- `POST /api/me/queue/:id/no-show`
- `GET /api/me/bookings`
- `PATCH /api/me/bookings/:id`

**تعديل على السيرفر غير مطلوب.**

## 7. الأخطاء
- **`ApiException.code`:** يتحول إلى رسالة بالعربية أو الفرنسية، بنفس قائمة `errorText` في الموقع.
- **الشبكة:**
  - انقطاعها يظهر رسالة "ما كاينش الأنترنيت" مع زر "عاود".
  - التحديث الدوري يتوقف بصمت عند الخطأ، ويعيد المحاولة في الدورة التالية.

## 8. التسليم
- **المعرّف والاسم:** `applicationId` هو `ma.newlook.app`، والاسم "نيولوك"، وأيقونة بسيطة بلون الموقع.
- **الإصدار:** `minSdk 21`، و `targetSdk` حسب Flutter 3.19.
- **التوقيع:**
  - مفتاح `mobile/android/newlook-release.jks`، معلوماته في `mobile/android/key.properties`.
  - **الملفان في `.gitignore`.** نسخة احتياطية منهما عند صاحب المشروع.
- **المخرج:** `mobile/build/app/outputs/flutter-apk/app-release.apk`.

## 9. الاختبارات
- **وحدات:**
  - قراءة JSON النماذج من أمثلة حقيقية للـ API.
  - تحويل السمة: الألوان، والوضع، و`priceBoard`.
  - ترجمة رموز الأخطاء.
- **Widget:** `LiveBadge` لكل حالة، و`PriceBoard` لكل نوع.
- **التحقق النهائي:** `flutter analyze` بدون أخطاء، و`flutter test`، و`flutter build apk --release`.
