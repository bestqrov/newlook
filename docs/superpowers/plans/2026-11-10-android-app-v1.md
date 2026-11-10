# تطبيق نيولوك Android (النسخة 1): خطة التنفيذ

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** تطبيق Flutter في `mobile/` للزبون (بحث، بروفايل بسمة الصنف، حجز، صف) وللمهني (حالة حية، صف، حجوزات)، يُسلَّم كملف APK موقّع.

**Architecture:**
- **الـ API:** Dio واحد مع cookies محفوظة في ملف، يتكلم مع نفس الـ API الذي يستعمله الموقع.
- **السمات:** `/api/catalog` يتحول إلى `ThemeData` لكل صنف.
- **الحالة والتنقل:** Riverpod لحالة خفيفة (المستودع، الكتالوج، تذكرة الصف)، و go_router للتنقل.
- **النصوص:** عربية وفرنسية في ملف واحد بسيط.

**Tech Stack:** Flutter 3.19.6 / Dart 3.3، dio 5.11، cookie_jar 4.0.9، dio_cookie_manager 3.5، flutter_riverpod 2.6، go_router 14.6، google_fonts 6.3، flutter_svg 2.0.10، cached_network_image 3.4، url_launcher 6.3.1، shared_preferences 2.2.3، intl 0.18.1.

**قواعد:**
- **مجلد العمل:** كل الأوامر من `mobile/` إلا إذا ذُكر غير ذلك. المسار الكامل: `/Users/mac/Documents/lbienetre/nelook main/mobile`.
- **رسائل الـ commit** تنتهي بالسطر: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **مدة البناء:** `flutter build apk` يأخذ قرابة 5 دقائق على هذا الجهاز، لذلك لا يُشغَّل إلا في المهمة 13.

---

## خريطة الملفات (`mobile/`)

| الملف | المسؤولية |
| --- | --- |
| `pubspec.yaml`، `analysis_options.yaml` | الحزم وقواعد التحليل |
| `lib/config.dart` | عنوان الـ API، `resolveUrl` |
| `lib/api/client.dart` | `ApiClient` و `ApiException` |
| `lib/api/models.dart` | كل النماذج وقراءة JSON |
| `lib/api/repository.dart` | كل الواجهات |
| `lib/l10n/strings.dart` | النصوص (ar/fr) ورسائل الأخطاء |
| `lib/theme/category_theme.dart` | `themeFor()`، `NewlookStatusColors`، السمة الاحتياطية |
| `lib/util/links.dart` | واتساب، الخريطة، الهاتف |
| `lib/state/providers.dart` | providers + `TicketNotifier` |
| `lib/widgets/*.dart` | عناصر البروفايل |
| `lib/screens/*.dart` | الشاشات |
| `lib/app.dart`، `lib/main.dart` | التطبيق والتنقل واللغات |
| `test/*.dart` | الاختبارات |

---

### Task 0: إنشاء المشروع

**Files:**
- Create: `mobile/` (flutter create)
- Modify: `mobile/pubspec.yaml`, `mobile/analysis_options.yaml`, `mobile/android/app/src/main/AndroidManifest.xml`, `mobile/android/app/build.gradle`, `.gitignore`

- [ ] **Step 1: أنشئ المشروع** (من جذر المستودع)

```bash
cd "/Users/mac/Documents/lbienetre/nelook main" && flutter create --org ma.newlook --project-name newlook --platforms android mobile && rm mobile/test/widget_test.dart
```

- [ ] **Step 2: استبدل `mobile/pubspec.yaml`**

```yaml
name: newlook
description: NewLook — beauty & barbers in Morocco.
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.3.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  flutter_localizations:
    sdk: flutter
  dio: ^5.11.1
  cookie_jar: ^4.0.9
  dio_cookie_manager: ^3.5.0
  path_provider: ^2.1.4
  flutter_riverpod: ^2.6.1
  go_router: ^14.6.2
  google_fonts: ^6.3.0
  flutter_svg: ^2.0.10+1
  cached_network_image: ^3.4.0
  url_launcher: ^6.3.1
  shared_preferences: ^2.2.3
  intl: ^0.18.1

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.2

flutter:
  uses-material-design: true
```

- [ ] **Step 3: استبدل `mobile/analysis_options.yaml`**

```yaml
include: package:flutter_lints/flutter.yaml

linter:
  rules:
    prefer_const_constructors: false
    prefer_const_literals_to_create_immutables: false
    prefer_const_constructors_in_immutables: false
```

- [ ] **Step 4: الأذونات والاسم في `mobile/android/app/src/main/AndroidManifest.xml`**

**أ) سطر الأذونات.** مباشرة بعد سطر `<manifest xmlns:android="http://schemas.android.com/apk/res/android">` أضف:
```xml
    <uses-permission android:name="android.permission.INTERNET"/>
```

**ب) اسم التطبيق.** غيّر `android:label="newlook"` إلى:
```xml
android:label="نيولوك"
```

**ج) الروابط.** داخل `<queries>` الموجود، بعد `</intent>` الموجود، أضف:
```xml
        <intent>
            <action android:name="android.intent.action.VIEW" />
            <data android:scheme="https" />
        </intent>
        <intent>
            <action android:name="android.intent.action.DIAL" />
            <data android:scheme="tel" />
        </intent>
```

- [ ] **Step 5: معرّف التطبيق في `mobile/android/app/build.gradle`**

غيّر سطر `applicationId "ma.newlook.newlook"` إلى:
```groovy
        applicationId "ma.newlook.app"
```

- [ ] **Step 6: `.gitignore` في جذر المستودع.** أضف في آخره:

```
# Flutter app
mobile/build/
mobile/.dart_tool/
mobile/android/key.properties
mobile/android/*.jks
```

- [ ] **Step 7: الحزم**

Run: `cd mobile && flutter pub get`
Expected: `Got dependencies!`

- [ ] **Step 8: Commit**

```bash
cd "/Users/mac/Documents/lbienetre/nelook main" && git add .gitignore mobile && git commit -m "feat(mobile): Flutter project scaffold (ma.newlook.app)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 1: عميل الـ API

**Files:**
- Create: `mobile/lib/config.dart`, `mobile/lib/api/client.dart`, `mobile/test/client_test.dart`

- [ ] **Step 1: الاختبار `mobile/test/client_test.dart`**

```dart
import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:newlook/api/client.dart';
import 'package:newlook/config.dart';

void main() {
  final req = RequestOptions(path: '/x');

  test('server error body becomes ApiException(code, status)', () {
    final e = DioException(requestOptions: req, type: DioExceptionType.badResponse,
        response: Response(requestOptions: req, statusCode: 409, data: {'error': 'slot_unavailable'}));
    final a = toApiException(e);
    expect(a.code, 'slot_unavailable');
    expect(a.status, 409);
  });

  test('no response means network error', () {
    final a = toApiException(DioException(requestOptions: req, type: DioExceptionType.connectionError));
    expect(a.code, 'network');
    expect(a.status, 0);
  });

  test('response without error field', () {
    final e = DioException(requestOptions: req, type: DioExceptionType.badResponse,
        response: Response(requestOptions: req, statusCode: 500, data: 'oops'));
    expect(toApiException(e).code, 'error');
  });

  test('resolveUrl prefixes relative paths with the API base', () {
    expect(resolveUrl('/uploads/a.jpg'), '$apiBase/uploads/a.jpg');
    expect(resolveUrl('https://x/y.jpg'), 'https://x/y.jpg');
  });
}
```

- [ ] **Step 2: شغّله وتأكد من الفشل**

Run: `flutter test test/client_test.dart`
Expected: FAIL (ملفات غير موجودة).

- [ ] **Step 3: `mobile/lib/config.dart`**

```dart
/// API server. Override at build time: --dart-define=API_BASE=https://...
const apiBase = String.fromEnvironment('API_BASE', defaultValue: 'https://newlook.morosmartcitys.com');

/// Absolute URL for API-relative paths such as "/uploads/..." or "/assets/...".
String resolveUrl(String path) => path.startsWith('/') ? '$apiBase$path' : path;
```

- [ ] **Step 4: `mobile/lib/api/client.dart`**

```dart
import 'package:cookie_jar/cookie_jar.dart';
import 'package:dio/dio.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';
import 'package:path_provider/path_provider.dart';

import '../config.dart';

typedef Json = Map<String, dynamic>;

class ApiException implements Exception {
  ApiException(this.code, this.status);
  final String code;
  final int status;
  @override
  String toString() => 'ApiException($status, $code)';
}

ApiException toApiException(DioException e) {
  final res = e.response;
  if (res == null) return ApiException('network', 0);
  final data = res.data;
  final code = data is Map && data['error'] is String ? data['error'] as String : 'error';
  return ApiException(code, res.statusCode ?? 0);
}

/// One HTTP client for the whole app. The pro session (httpOnly cookie) is kept on disk.
class ApiClient {
  ApiClient(this.dio);
  final Dio dio;

  static Future<ApiClient> create({String baseUrl = apiBase}) async {
    final dir = await getApplicationSupportDirectory();
    final dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 20),
      headers: {'Accept': 'application/json'},
    ));
    dio.interceptors.add(CookieManager(PersistCookieJar(storage: FileStorage('${dir.path}/cookies'))));
    return ApiClient(dio);
  }

  Future<Json> get(String path, [Map<String, dynamic>? query]) => _send(() => dio.get(path, queryParameters: query));
  Future<Json> post(String path, [Object? body]) => _send(() => dio.post(path, data: body ?? const <String, dynamic>{}));
  Future<Json> patch(String path, Object body) => _send(() => dio.patch(path, data: body));

  Future<Json> _send(Future<Response<dynamic>> Function() call) async {
    try {
      final r = await call();
      final d = r.data;
      return d is Map<String, dynamic> ? d : <String, dynamic>{};
    } on DioException catch (e) {
      throw toApiException(e);
    }
  }
}
```

- [ ] **Step 5: شغّل الاختبار**

Run: `flutter test test/client_test.dart`
Expected: `All tests passed!`

- [ ] **Step 6: Commit**

```bash
cd "/Users/mac/Documents/lbienetre/nelook main" && git add mobile/lib/config.dart mobile/lib/api/client.dart mobile/test/client_test.dart && git commit -m "feat(mobile): API client with persisted cookies and error codes

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: النماذج

**Files:**
- Create: `mobile/lib/api/models.dart`, `mobile/test/models_test.dart`

- [ ] **Step 1: الاختبار `mobile/test/models_test.dart`**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:newlook/api/models.dart';

Map<String, dynamic> colors(String bg) => {
      'background': bg, 'surface': '#FFFFFF', 'text': '#1E1612', 'muted': '#5E5047', 'primary': '#A11D24',
      'onPrimary': '#FFFFFF', 'accent': '#8A6424', 'border': '#D9CBBB', 'success': '#2E7D4F', 'warning': '#9A6416', 'danger': '#B42318',
    };

Map<String, dynamic> category(String key, String value, {String mode = 'light', List<String> features = const []}) => {
      'key': key, 'value': value, 'labels': {'ar': value, 'fr': key},
      'features': features, 'liveStates': ['free', 'busy', 'closed'],
      'styleTags': [{'key': 'fade', 'labels': {'ar': 'فيد', 'fr': 'Dégradé'}}],
      'amenities': ['wifi'],
      'theme': {
        'mode': mode, 'colors': {'light': colors('#F4EDE4'), 'dark': colors('#17110E')},
        'fonts': {'display': 'Reem Kufi', 'body': 'IBM Plex Sans Arabic', 'accent': 'Special Elite'},
        'radius': 4, 'assets': {'headerPattern': '/assets/themes/barber/pole.svg', 'priceBoard': 'chalkboard'},
      },
    };

void main() {
  test('parseHex', () {
    expect(parseHex('#A11D24'), const Color(0xFFA11D24));
  });

  test('catalog parses categories, theme and default', () {
    final c = Catalog.fromJson({
      'version': 'v1',
      'amenities': {'wifi': {'ar': 'Wi-Fi', 'fr': 'Wi-Fi'}},
      'categories': [category('barber', 'حلاقة رجالية', mode: 'dark', features: ['live_status', 'walkin_queue'])],
      'default': category('default', ''),
    });
    final b = c.categoryOf('حلاقة رجالية');
    expect(b.key, 'barber');
    expect(b.has('walkin_queue'), isTrue);
    expect(b.theme.mode, Brightness.dark);
    expect(b.theme.colors.background, const Color(0xFF17110E));
    expect(b.theme.priceBoard, 'chalkboard');
    expect(b.theme.accentFont, 'Special Elite');
    expect(b.styleTags.first.label('fr'), 'Dégradé');
    expect(c.categoryOf('???').key, 'default');
    expect(c.amenityLabel('wifi', 'ar'), 'Wi-Fi');
  });

  test('profile parses business, extras, live, services and works', () {
    final p = Profile.fromJson({
      'business': {
        'id': 'b1', 'name': 'Hammam', 'category': 'الحمام والسبا', 'categoryKey': 'hammam', 'city': 'مراكش', 'bio': '', 'phone': '0611111111',
        'address': {'line': 'Rue', 'district': 'Medina', 'lat': 31.6, 'lng': -8},
        'amenities': ['towels'],
        'extras': {
          'genderSchedule': [{'weekday': 1, 'start': '08:00', 'end': '14:00', 'audience': 'women'}],
          'ritualSteps': ['s1', 's2'],
          'bringList': [{'label': 'كيس', 'available': true}],
        },
        'todayStatus': {'openNow': false, 'closesAt': null, 'nextOpen': {'weekday': 2, 'time': '09:00'}},
        'live': {'state': 'quiet', 'waiting': 0, 'estimatedWaitMinutes': null, 'updatedAt': null, 'stale': false},
        'currentAudience': {'now': 'women', 'until': '14:00', 'next': 'men'},
      },
      'services': [{'id': 's1', 'name': 'كيس', 'price': 50, 'durationMinutes': 30}, {'id': 's2', 'name': 'غاسول', 'price': 40.5, 'durationMinutes': 20}],
      'works': [{'id': 'w1', 'title': 'T', 'caption': '', 'imageUrl': '/uploads/x.jpg', 'tags': ['fade']}],
    });
    final b = p.business;
    expect(b.address.lat, 31.6);
    expect(b.address.lng, -8.0);
    expect(b.genderSchedule.single.audience, 'women');
    expect(b.ritualSteps, ['s1', 's2']);
    expect(b.bringList.single.available, isTrue);
    expect(b.todayStatus.nextOpenWeekday, 2);
    expect(b.live!.state, 'quiet');
    expect(b.currentAudience!.next, 'men');
    expect(p.services[1].price, 40.5);
    expect(p.works.single.tags, ['fade']);
  });

  test('search result carries service and price; missing live is null', () {
    final b = Business.fromJson({'id': 'x', 'name': 'N', 'category': 'الأظافر', 'city': 'طنجة', 'service': 'مانيكير', 'price': 90, 'live': null});
    expect(b.price, 90);
    expect(b.service, 'مانيكير');
    expect(b.live, isNull);
    expect(b.categoryKey, 'default');
  });

  test('queue ticket JSON round trip', () {
    final t = QueueTicket(businessId: 'b', id: 'q', token: 'tok', businessName: 'Salon');
    expect(QueueTicket.fromJson(t.toJson()).token, 'tok');
  });
}
```

- [ ] **Step 2: شغّله وتأكد من الفشل**

Run: `flutter test test/models_test.dart`
Expected: FAIL.

- [ ] **Step 3: `mobile/lib/api/models.dart`**

```dart
import 'package:flutter/material.dart';

import 'client.dart';

Color parseHex(String hex) => Color(int.parse('FF${hex.replaceFirst('#', '')}', radix: 16));
Map<String, String> parseLabels(Object? v) => v is Map ? v.map((k, val) => MapEntry('$k', '$val')) : <String, String>{};
String labelIn(Map<String, String> l, String lang) => l[lang] ?? l['ar'] ?? '';
List<String> _strings(Object? v) => v is List ? v.map((e) => '$e').toList() : <String>[];
num _num(Object? v) => v is num ? v : num.tryParse('$v') ?? 0;
int? _intOrNull(Object? v) => v is num ? v.toInt() : null;
Json _map(Object? v) => v is Map<String, dynamic> ? v : <String, dynamic>{};
List<Json> _maps(Object? v) => v is List ? v.whereType<Map<String, dynamic>>().toList() : <Json>[];

class ThemeColors {
  const ThemeColors({required this.background, required this.surface, required this.text, required this.muted, required this.primary, required this.onPrimary, required this.accent, required this.border, required this.success, required this.warning, required this.danger});
  final Color background, surface, text, muted, primary, onPrimary, accent, border, success, warning, danger;

  factory ThemeColors.fromJson(Json j) => ThemeColors(
        background: parseHex('${j['background']}'), surface: parseHex('${j['surface']}'), text: parseHex('${j['text']}'),
        muted: parseHex('${j['muted']}'), primary: parseHex('${j['primary']}'), onPrimary: parseHex('${j['onPrimary']}'),
        accent: parseHex('${j['accent']}'), border: parseHex('${j['border']}'), success: parseHex('${j['success']}'),
        warning: parseHex('${j['warning']}'), danger: parseHex('${j['danger']}'),
      );
}

class CategoryTheme {
  const CategoryTheme({required this.mode, required this.light, required this.dark, required this.displayFont, required this.bodyFont, this.accentFont, required this.radius, this.headerPattern, this.background, required this.priceBoard});
  final Brightness mode;
  final ThemeColors light, dark;
  final String displayFont, bodyFont;
  final String? accentFont, headerPattern, background;
  final double radius;
  final String priceBoard; // chalkboard | menu | tiles

  ThemeColors get colors => mode == Brightness.dark ? dark : light;

  factory CategoryTheme.fromJson(Json j) {
    final colors = _map(j['colors']), fonts = _map(j['fonts']), assets = _map(j['assets']);
    return CategoryTheme(
      mode: j['mode'] == 'dark' ? Brightness.dark : Brightness.light,
      light: ThemeColors.fromJson(_map(colors['light'])),
      dark: ThemeColors.fromJson(_map(colors['dark'])),
      displayFont: '${fonts['display'] ?? 'Reem Kufi'}',
      bodyFont: '${fonts['body'] ?? 'IBM Plex Sans Arabic'}',
      accentFont: fonts['accent'] as String?,
      radius: _num(j['radius']).toDouble(),
      headerPattern: assets['headerPattern'] as String?,
      background: assets['background'] as String?,
      priceBoard: '${assets['priceBoard'] ?? 'menu'}',
    );
  }
}

class StyleTag {
  const StyleTag(this.key, this.labels);
  final String key;
  final Map<String, String> labels;
  String label(String lang) => labelIn(labels, lang);
}

class CategoryDef {
  const CategoryDef({required this.key, required this.value, required this.labels, required this.features, required this.liveStates, required this.styleTags, required this.amenities, required this.theme});
  final String key, value;
  final Map<String, String> labels;
  final List<String> features, liveStates, amenities;
  final List<StyleTag> styleTags;
  final CategoryTheme theme;

  bool has(String feature) => features.contains(feature);
  String label(String lang) => labelIn(labels, lang);

  factory CategoryDef.fromJson(Json j) => CategoryDef(
        key: '${j['key']}', value: '${j['value']}', labels: parseLabels(j['labels']),
        features: _strings(j['features']), liveStates: _strings(j['liveStates']), amenities: _strings(j['amenities']),
        styleTags: _maps(j['styleTags']).map((t) => StyleTag('${t['key']}', parseLabels(t['labels']))).toList(),
        theme: CategoryTheme.fromJson(_map(j['theme'])),
      );
}

class Catalog {
  const Catalog({required this.version, required this.amenities, required this.categories, required this.fallback});
  final String version;
  final Map<String, Map<String, String>> amenities;
  final List<CategoryDef> categories;
  final CategoryDef fallback;

  CategoryDef categoryOf(String value) => categories.firstWhere((c) => c.value == value, orElse: () => fallback);
  String amenityLabel(String key, String lang) => labelIn(amenities[key] ?? const {}, lang);

  factory Catalog.fromJson(Json j) => Catalog(
        version: '${j['version']}',
        amenities: _map(j['amenities']).map((k, v) => MapEntry(k, parseLabels(v))),
        categories: _maps(j['categories']).map(CategoryDef.fromJson).toList(),
        fallback: CategoryDef.fromJson(_map(j['default'])),
      );
}

class Live {
  const Live({required this.state, required this.waiting, this.estimatedWaitMinutes, required this.stale});
  final String state; // free busy closed quiet moderate crowded unknown
  final int waiting;
  final int? estimatedWaitMinutes;
  final bool stale;
  factory Live.fromJson(Json j) => Live(state: '${j['state']}', waiting: _intOrNull(j['waiting']) ?? 0, estimatedWaitMinutes: _intOrNull(j['estimatedWaitMinutes']), stale: j['stale'] == true);
}

class TodayStatus {
  const TodayStatus({required this.openNow, this.closesAt, this.nextOpenWeekday, this.nextOpenTime});
  final bool openNow;
  final String? closesAt, nextOpenTime;
  final int? nextOpenWeekday;
  factory TodayStatus.fromJson(Json j) {
    final next = j['nextOpen'] is Map ? _map(j['nextOpen']) : null;
    return TodayStatus(openNow: j['openNow'] == true, closesAt: j['closesAt'] as String?, nextOpenWeekday: _intOrNull(next?['weekday']), nextOpenTime: next?['time'] as String?);
  }
}

class ScheduleRange {
  const ScheduleRange({required this.weekday, required this.start, required this.end, required this.audience});
  final int weekday;
  final String start, end, audience; // women men mixed private
  factory ScheduleRange.fromJson(Json j) => ScheduleRange(weekday: _intOrNull(j['weekday']) ?? 0, start: '${j['start']}', end: '${j['end']}', audience: '${j['audience']}');
}

class CurrentAudience {
  const CurrentAudience({required this.now, required this.until, this.next});
  final String now, until;
  final String? next;
  factory CurrentAudience.fromJson(Json j) => CurrentAudience(now: '${j['now']}', until: '${j['until']}', next: j['next'] as String?);
}

class BringItem {
  const BringItem(this.label, this.available);
  final String label;
  final bool available;
  factory BringItem.fromJson(Json j) => BringItem('${j['label']}', j['available'] == true);
}

class Address {
  const Address({this.line = '', this.district = '', this.lat, this.lng});
  final String line, district;
  final double? lat, lng;
  factory Address.fromJson(Json j) => Address(line: '${j['line'] ?? ''}', district: '${j['district'] ?? ''}', lat: (j['lat'] as num?)?.toDouble(), lng: (j['lng'] as num?)?.toDouble());
}

class Business {
  const Business({required this.id, required this.name, required this.category, required this.city, this.bio = '', this.phone = '', this.categoryKey = 'default', this.address = const Address(), this.amenities = const [], this.chairs, this.genderSchedule = const [], this.ritualSteps = const [], this.bringList = const [], this.todayStatus = const TodayStatus(openNow: false), this.live, this.currentAudience, this.cover, this.service, this.price});
  final String id, name, category, city, bio, phone, categoryKey;
  final Address address;
  final List<String> amenities, ritualSteps;
  final int? chairs;
  final List<ScheduleRange> genderSchedule;
  final List<BringItem> bringList;
  final TodayStatus todayStatus;
  final Live? live;
  final CurrentAudience? currentAudience;
  final String? cover, service;
  final num? price;

  factory Business.fromJson(Json j) {
    final extras = _map(j['extras']);
    return Business(
      id: '${j['id']}', name: '${j['name']}', category: '${j['category']}', city: '${j['city']}',
      bio: '${j['bio'] ?? ''}', phone: '${j['phone'] ?? ''}', categoryKey: '${j['categoryKey'] ?? 'default'}',
      address: Address.fromJson(_map(j['address'])),
      amenities: _strings(j['amenities']),
      chairs: _intOrNull(extras['chairs']),
      genderSchedule: _maps(extras['genderSchedule']).map(ScheduleRange.fromJson).toList(),
      ritualSteps: _strings(extras['ritualSteps']),
      bringList: _maps(extras['bringList']).map(BringItem.fromJson).toList(),
      todayStatus: j['todayStatus'] is Map ? TodayStatus.fromJson(_map(j['todayStatus'])) : const TodayStatus(openNow: false),
      live: j['live'] is Map ? Live.fromJson(_map(j['live'])) : null,
      currentAudience: j['currentAudience'] is Map ? CurrentAudience.fromJson(_map(j['currentAudience'])) : null,
      cover: j['cover'] as String?,
      service: j['service'] as String?,
      price: j['price'] == null ? null : _num(j['price']),
    );
  }
}

class Service {
  const Service({required this.id, required this.name, required this.price, required this.durationMinutes});
  final String id, name;
  final num price;
  final int durationMinutes;
  factory Service.fromJson(Json j) => Service(id: '${j['id']}', name: '${j['name']}', price: _num(j['price']), durationMinutes: _intOrNull(j['durationMinutes']) ?? 30);
}

class Work {
  const Work({required this.id, required this.title, required this.caption, required this.imageUrl, required this.tags});
  final String id, title, caption, imageUrl;
  final List<String> tags;
  factory Work.fromJson(Json j) => Work(id: '${j['id']}', title: '${j['title']}', caption: '${j['caption'] ?? ''}', imageUrl: '${j['imageUrl']}', tags: _strings(j['tags']));
}

class Profile {
  const Profile({required this.business, required this.services, required this.works});
  final Business business;
  final List<Service> services;
  final List<Work> works;
  factory Profile.fromJson(Json j) => Profile(
        business: Business.fromJson(_map(j['business'])),
        services: _maps(j['services']).map(Service.fromJson).toList(),
        works: _maps(j['works']).map(Work.fromJson).toList(),
      );
}

class QueueTicket {
  const QueueTicket({required this.businessId, required this.id, required this.token, required this.businessName});
  final String businessId, id, token, businessName;
  Json toJson() => {'businessId': businessId, 'id': id, 'token': token, 'businessName': businessName};
  factory QueueTicket.fromJson(Json j) => QueueTicket(businessId: '${j['businessId']}', id: '${j['id']}', token: '${j['token']}', businessName: '${j['businessName'] ?? ''}');
}

class QueueStatus {
  const QueueStatus({required this.status, this.position, this.estimatedWaitMinutes});
  final String status; // waiting served no_show cancelled
  final int? position, estimatedWaitMinutes;
  factory QueueStatus.fromJson(Json j) => QueueStatus(status: '${j['status']}', position: _intOrNull(j['position']), estimatedWaitMinutes: _intOrNull(j['estimatedWaitMinutes']));
}

class QueueEntry {
  const QueueEntry({required this.id, required this.name, required this.phone, required this.createdAt});
  final String id, name, phone;
  final DateTime createdAt;
  factory QueueEntry.fromJson(Json j) => QueueEntry(id: '${j['id']}', name: '${j['name']}', phone: '${j['phone']}', createdAt: DateTime.parse('${j['createdAt']}').toLocal());
}

class ProBooking {
  const ProBooking({required this.id, required this.serviceName, required this.price, required this.startsAt, required this.clientName, required this.clientPhone, required this.status});
  final String id, serviceName, clientName, clientPhone, status; // pending confirmed cancelled done
  final num price;
  final DateTime startsAt;
  factory ProBooking.fromJson(Json j) => ProBooking(id: '${j['id']}', serviceName: '${j['serviceName']}', price: _num(j['price']), startsAt: DateTime.parse('${j['startsAt']}').toLocal(), clientName: '${j['clientName']}', clientPhone: '${j['clientPhone']}', status: '${j['status']}');
}

class ProBusiness {
  const ProBusiness({required this.id, required this.name, required this.category, this.live});
  final String id, name, category;
  final Live? live;
  factory ProBusiness.fromJson(Json j) => ProBusiness(id: '${j['id']}', name: '${j['name']}', category: '${j['category']}', live: j['live'] is Map ? Live.fromJson(_map(j['live'])) : null);
}
```

- [ ] **Step 4: شغّل الاختبار**

Run: `flutter test test/models_test.dart`
Expected: `All tests passed!`

- [ ] **Step 5: Commit**

```bash
cd "/Users/mac/Documents/lbienetre/nelook main" && git add mobile/lib/api/models.dart mobile/test/models_test.dart && git commit -m "feat(mobile): API models (catalog, themes, business, queue, bookings)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: النصوص والروابط

**Files:**
- Create: `mobile/lib/l10n/strings.dart`, `mobile/lib/util/links.dart`, `mobile/test/strings_links_test.dart`

- [ ] **Step 1: الاختبار `mobile/test/strings_links_test.dart`**

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:newlook/api/client.dart';
import 'package:newlook/api/models.dart';
import 'package:newlook/l10n/strings.dart';
import 'package:newlook/util/links.dart';

void main() {
  test('translations with arguments in ar and fr', () {
    expect(S('ar').t('live.waiting', {'n': 2, 'm': 30}), '2 فالانتظار ≈ 30 دقيقة');
    expect(S('fr').t('live.waiting', {'n': 2, 'm': 30}), '2 en attente ≈ 30 min');
    expect(S('fr').t('unknown.key'), 'unknown.key');
  });

  test('error messages from API codes', () {
    expect(S('ar').error(ApiException('slot_unavailable', 409)), 'هاد الوقت ما بقاش متاح. اختار وقت آخر.');
    expect(S('fr').error(ApiException('network', 0)), 'Pas de connexion. Vérifiez Internet.');
    expect(S('ar').error(ApiException('weird', 429)), S('ar').t('err.rate'));
    expect(S('ar').error(Exception('x')), S('ar').t('err.error'));
  });

  test('every key has ar and fr', () {
    for (final e in strings.entries) {
      expect(e.value['ar'], isNotNull, reason: e.key);
      expect(e.value['fr'], isNotNull, reason: e.key);
    }
  });

  test('waNumber normalises Moroccan numbers', () {
    expect(waNumber('06 12 34 56 78'), '212612345678');
    expect(waNumber('+212612345678'), '212612345678');
    expect(waNumber('00212612345678'), '212612345678');
    expect(waNumber('612345678'), '212612345678');
    expect(waNumber('123'), '');
    expect(isValidPhone('0712345678'), isTrue);
  });

  test('directions prefer coordinates', () {
    const b = Business(id: 'x', name: 'N', category: 'c', city: 'مراكش', address: Address(line: 'Rue 1', lat: 31.6, lng: -8.0));
    expect(directionsUri(b).toString(), 'https://www.google.com/maps/dir/?api=1&destination=31.6,-8.0');
    const c = Business(id: 'x', name: 'N', category: 'c', city: 'Fes', address: Address(line: 'Rue 1'));
    expect(directionsUri(c).queryParameters['query'], 'Rue 1, Fes');
  });
}
```

- [ ] **Step 2: شغّله وتأكد من الفشل**

Run: `flutter test test/strings_links_test.dart`
Expected: FAIL.

- [ ] **Step 3: `mobile/lib/util/links.dart`**

```dart
import '../api/models.dart';

/// "212XXXXXXXXX" for wa.me from any Moroccan format, or "" if invalid.
String waNumber(String? raw) {
  var p = (raw ?? '').replaceAll(RegExp(r'[^\d+]'), '').replaceFirst(RegExp(r'^(\+|00)212'), '0');
  if (RegExp(r'^[5-7]\d{8}$').hasMatch(p)) p = '0$p';
  return RegExp(r'^0[5-7]\d{8}$').hasMatch(p) ? '212${p.substring(1)}' : '';
}

bool isValidPhone(String phone) => waNumber(phone).isNotEmpty;

Uri? whatsappUri(String? phone, String text) {
  final n = waNumber(phone);
  return n.isEmpty ? null : Uri.parse('https://wa.me/$n?text=${Uri.encodeComponent(text)}');
}

Uri directionsUri(Business b) {
  final a = b.address;
  if (a.lat != null && a.lng != null) return Uri.parse('https://www.google.com/maps/dir/?api=1&destination=${a.lat},${a.lng}');
  final q = [a.line, a.district, b.city].where((s) => s.isNotEmpty).join(', ');
  return Uri.https('www.google.com', '/maps/search/', {'api': '1', 'query': q.isEmpty ? b.name : q});
}
```

- [ ] **Step 4: `mobile/lib/l10n/strings.dart`**

```dart
import 'package:flutter/widgets.dart';

import '../api/client.dart';

/// Tiny i18n: Arabic (default, RTL) and French.
class S {
  const S(this.lang);
  final String lang;

  static S of(BuildContext context) => S(Localizations.localeOf(context).languageCode == 'fr' ? 'fr' : 'ar');

  String t(String key, [Map<String, Object?> args = const {}]) {
    final entry = strings[key];
    var s = entry?[lang] ?? entry?['ar'] ?? key;
    args.forEach((k, v) => s = s.replaceAll('{$k}', '$v'));
    return s;
  }

  String error(Object e) {
    if (e is ApiException) {
      if (strings.containsKey('err.${e.code}')) return t('err.${e.code}');
      if (e.status == 429) return t('err.rate');
    }
    return t('err.error');
  }

  String day(int weekday) => t('day.$weekday');
}

const strings = <String, Map<String, String>>{
  'app.name': {'ar': 'نيولوك', 'fr': 'NewLook'},
  'home.pro': {'ar': 'أنا مهني', 'fr': 'Espace pro'},
  'home.search': {'ar': 'قلّب على خدمة: فيد، صبغة، حمام…', 'fr': 'Chercher un service : dégradé, couleur, hammam…'},
  'home.allCities': {'ar': 'كل المدن', 'fr': 'Toutes les villes'},
  'home.all': {'ar': 'الكل', 'fr': 'Tout'},
  'home.availableNow': {'ar': 'فاضيين دابا', 'fr': 'Libres maintenant'},
  'home.empty': {'ar': 'ما لقينا والو بهاد الشروط.', 'fr': 'Aucun résultat pour ces critères.'},
  'home.from': {'ar': 'من {p} درهم', 'fr': 'dès {p} MAD'},
  'home.ticket': {'ar': 'عندك بلاصة فالصف عند {name}', 'fr': 'Vous êtes dans la file chez {name}'},
  'common.retry': {'ar': 'عاود', 'fr': 'Réessayer'},
  'common.min': {'ar': 'دقيقة', 'fr': 'min'},
  'common.mad': {'ar': 'درهم', 'fr': 'MAD'},
  'profile.directions': {'ar': 'خذني ليه', 'fr': 'Itinéraire'},
  'profile.call': {'ar': 'عيّط', 'fr': 'Appeler'},
  'profile.whatsapp': {'ar': 'واتساب', 'fr': 'WhatsApp'},
  'profile.waText': {'ar': 'سلام، بغيت ناخد موعد عند {name}.', 'fr': 'Bonjour, je voudrais un rendez-vous chez {name}.'},
  'profile.openUntil': {'ar': 'مفتوح حتى {t}', 'fr': 'Ouvert jusqu’à {t}'},
  'profile.closedOpens': {'ar': 'مسدود · كيحل {d} {t}', 'fr': 'Fermé · ouvre {d} à {t}'},
  'profile.noHours': {'ar': 'أوقات العمل غير محددة', 'fr': 'Horaires non renseignés'},
  'profile.services': {'ar': 'الخدمات والأسعار', 'fr': 'Prestations et tarifs'},
  'profile.prices': {'ar': 'الأسعار', 'fr': 'Tarifs'},
  'profile.noServices': {'ar': 'الخدمات غادي تزاد قريباً.', 'fr': 'Prestations bientôt disponibles.'},
  'profile.works': {'ar': 'آخر الأعمال', 'fr': 'Réalisations'},
  'profile.noWorks': {'ar': 'ما تنشرات حتى أعمال دابا.', 'fr': 'Pas encore de réalisations.'},
  'live.free': {'ar': 'فاضي دابا', 'fr': 'Libre maintenant'},
  'live.waiting': {'ar': '{n} فالانتظار ≈ {m} دقيقة', 'fr': '{n} en attente ≈ {m} min'},
  'live.busy': {'ar': 'مشغول دابا', 'fr': 'Occupé'},
  'live.quiet': {'ar': 'خاوي دابا', 'fr': 'Calme en ce moment'},
  'live.moderate': {'ar': 'متوسط دابا', 'fr': 'Affluence moyenne'},
  'live.crowded': {'ar': 'عامر دابا', 'fr': 'Très fréquenté'},
  'live.closed': {'ar': 'مسدود دابا', 'fr': 'Fermé maintenant'},
  'state.free': {'ar': '🟢 فاضي', 'fr': '🟢 Libre'},
  'state.busy': {'ar': '🟡 مشغول', 'fr': '🟡 Occupé'},
  'state.closed': {'ar': '🔴 مسدود', 'fr': '🔴 Fermé'},
  'state.quiet': {'ar': '🟢 خاوي', 'fr': '🟢 Calme'},
  'state.moderate': {'ar': '🟡 متوسط', 'fr': '🟡 Moyen'},
  'state.crowded': {'ar': '🔴 عامر', 'fr': '🔴 Bondé'},
  'aud.women': {'ar': '👩 نساء', 'fr': '👩 Femmes'},
  'aud.men': {'ar': '👨 رجال', 'fr': '👨 Hommes'},
  'aud.mixed': {'ar': '👨‍👩‍👧 عائلي', 'fr': '👨‍👩‍👧 Familles'},
  'aud.private': {'ar': '🔒 حمام خاص', 'fr': '🔒 Hammam privatif'},
  'sched.now': {'ar': 'دابا: {a} حتى {t}', 'fr': 'Maintenant : {a} jusqu’à {t}'},
  'sched.next': {'ar': 'من بعد: {a}', 'fr': 'Ensuite : {a}'},
  'sched.none': {'ar': 'ما كاين حتى فترة دابا', 'fr': 'Aucune séance en ce moment'},
  'sched.week': {'ar': 'جدول الأسبوع', 'fr': 'Planning de la semaine'},
  'ritual.title': {'ar': 'صاوب الطقس ديالك', 'fr': 'Composez votre rituel'},
  'ritual.total': {'ar': '{n} مراحل · {m} دقيقة · {p} درهم', 'fr': '{n} étapes · {m} min · {p} MAD'},
  'ritual.pick': {'ar': 'اختار الوقت', 'fr': 'Choisir l’horaire'},
  'bring.title': {'ar': 'شنو تجيب معاك', 'fr': 'À apporter'},
  'bring.available': {'ar': 'متوفر عندنا', 'fr': 'Disponible sur place'},
  'queue.title': {'ar': 'زيدني فالصف', 'fr': 'Rejoindre la file'},
  'queue.intro': {'ar': 'ما تحتاجش تتسنى فالمحل: دير سميتك وتبع النوبة ديالك من التطبيق.', 'fr': 'Inutile d’attendre sur place : inscrivez-vous et suivez votre tour ici.'},
  'queue.closed': {'ar': 'المحل مسدود دابا. الصف كيتحل غير ملي يكون مفتوح.', 'fr': 'Le salon est fermé. La file ouvre avec le salon.'},
  'queue.open': {'ar': 'شوف النوبة ديالي', 'fr': 'Voir ma position'},
  'queue.youAre': {'ar': 'نتا فالصف', 'fr': 'Votre position'},
  'queue.next': {'ar': 'نتا اللي جاي! سير للمحل.', 'fr': 'C’est bientôt vous ! Rendez-vous au salon.'},
  'queue.about': {'ar': 'تقريباً {m} دقيقة', 'fr': 'Environ {m} min'},
  'queue.leave': {'ar': 'خرجني من الصف', 'fr': 'Quitter la file'},
  'queue.served': {'ar': 'مرحبا بيك! وصلات نوبتك.', 'fr': 'Bienvenue ! C’est votre tour.'},
  'queue.left': {'ar': 'خرجتي من الصف.', 'fr': 'Vous n’êtes plus dans la file.'},
  'queue.none': {'ar': 'ما عندك حتى بلاصة فالصف.', 'fr': 'Vous n’êtes dans aucune file.'},
  'ticket.title': {'ar': 'النوبة ديالي', 'fr': 'Ma place'},
  'form.name': {'ar': 'اسمك', 'fr': 'Votre nom'},
  'form.phone': {'ar': 'الهاتف (06…)', 'fr': 'Téléphone (06…)'},
  'book.cta': {'ar': 'احجز موعدك', 'fr': 'Réserver'},
  'book.chooseAudience': {'ar': 'اختار نساء ولا رجال باش تبان الأوقات.', 'fr': 'Choisissez femmes ou hommes pour voir les horaires.'},
  'book.noSlots': {'ar': 'ما كاين حتى وقت متاح هاد النهار.', 'fr': 'Aucun horaire disponible ce jour-là.'},
  'book.cash': {'ar': 'الدفع كاش فالمحل بعد الخدمة.', 'fr': 'Paiement en espèces au salon après la prestation.'},
  'book.confirm': {'ar': 'تأكيد الحجز', 'fr': 'Confirmer'},
  'book.done': {'ar': 'توصل الطلب ديالك. المهني غادي يأكد ليك الموعد.', 'fr': 'Demande envoyée. Le professionnel va confirmer.'},
  'book.pickSlot': {'ar': 'اختار ساعة من الساعات المتاحة.', 'fr': 'Choisissez un horaire disponible.'},
  'book.change': {'ar': 'بدّل الخدمة', 'fr': 'Changer de prestation'},
  'pro.title': {'ar': 'فضاء المهنيين', 'fr': 'Espace pro'},
  'pro.email': {'ar': 'البريد الإلكتروني', 'fr': 'E-mail'},
  'pro.password': {'ar': 'كلمة المرور', 'fr': 'Mot de passe'},
  'pro.login': {'ar': 'دخول', 'fr': 'Se connecter'},
  'pro.mfa': {'ar': 'هاد الحساب ديال الإدارة. استعمل الموقع.', 'fr': 'Compte administrateur : utilisez le site.'},
  'pro.noBusiness': {'ar': 'ما عندكش نشاط مسجل. سجّلو من الموقع.', 'fr': 'Aucun établissement. Créez-le sur le site.'},
  'pro.openSite': {'ar': 'فتح الموقع', 'fr': 'Ouvrir le site'},
  'pro.status': {'ar': 'الحالة دابا', 'fr': 'Statut en direct'},
  'pro.queue': {'ar': 'الصف ({n})', 'fr': 'File ({n})'},
  'pro.queueEmpty': {'ar': 'ما كاين حتى واحد فالصف.', 'fr': 'Personne dans la file.'},
  'pro.served': {'ar': 'دخل', 'fr': 'Servi'},
  'pro.noShow': {'ar': 'ما جاش', 'fr': 'Absent'},
  'pro.bookings': {'ar': 'الحجوزات', 'fr': 'Réservations'},
  'pro.noBookings': {'ar': 'ما كاين حتى حجز.', 'fr': 'Aucune réservation.'},
  'pro.confirm': {'ar': 'تأكيد', 'fr': 'Confirmer'},
  'pro.cancel': {'ar': 'إلغاء', 'fr': 'Annuler'},
  'pro.done': {'ar': 'تم', 'fr': 'Terminé'},
  'pro.logout': {'ar': 'خروج', 'fr': 'Déconnexion'},
  'pro.editOnSite': {'ar': 'عدّل البروفايل فالموقع', 'fr': 'Modifier le profil sur le site'},
  'bstatus.pending': {'ar': 'فالانتظار', 'fr': 'En attente'},
  'bstatus.confirmed': {'ar': 'مؤكد', 'fr': 'Confirmé'},
  'bstatus.cancelled': {'ar': 'ملغى', 'fr': 'Annulé'},
  'bstatus.done': {'ar': 'تم', 'fr': 'Terminé'},
  'day.0': {'ar': 'الأحد', 'fr': 'dimanche'},
  'day.1': {'ar': 'الإثنين', 'fr': 'lundi'},
  'day.2': {'ar': 'الثلاثاء', 'fr': 'mardi'},
  'day.3': {'ar': 'الأربعاء', 'fr': 'mercredi'},
  'day.4': {'ar': 'الخميس', 'fr': 'jeudi'},
  'day.5': {'ar': 'الجمعة', 'fr': 'vendredi'},
  'day.6': {'ar': 'السبت', 'fr': 'samedi'},
  'err.network': {'ar': 'ما كاينش الأنترنيت. تأكد من الاتصال.', 'fr': 'Pas de connexion. Vérifiez Internet.'},
  'err.invalid_phone': {'ar': 'رقم الهاتف ماشي صحيح (مثال: 0612345678).', 'fr': 'Numéro invalide (ex. : 0612345678).'},
  'err.invalid_input': {'ar': 'تأكد من المعلومات اللي دخلتي.', 'fr': 'Vérifiez les informations saisies.'},
  'err.slot_unavailable': {'ar': 'هاد الوقت ما بقاش متاح. اختار وقت آخر.', 'fr': 'Ce créneau n’est plus disponible.'},
  'err.too_many_bookings': {'ar': 'عندك بزاف ديال الحجوزات المفتوحة بهاد الرقم.', 'fr': 'Trop de réservations en cours avec ce numéro.'},
  'err.audience_required': {'ar': 'اختار نساء ولا رجال.', 'fr': 'Choisissez femmes ou hommes.'},
  'err.already_in_queue': {'ar': 'هاد الرقم ديجا فالصف.', 'fr': 'Ce numéro est déjà dans une file.'},
  'err.closed_now': {'ar': 'المحل مسدود دابا.', 'fr': 'Le salon est fermé.'},
  'err.queue_full': {'ar': 'الصف عامر. عاود من بعد.', 'fr': 'La file est pleine. Réessayez plus tard.'},
  'err.invalid_credentials': {'ar': 'البريد الإلكتروني أو كلمة المرور غالطين.', 'fr': 'E-mail ou mot de passe incorrect.'},
  'err.account_locked': {'ar': 'الحساب تبلوكا 15 دقيقة بسبب محاولات كثيرة.', 'fr': 'Compte bloqué 15 minutes.'},
  'err.mfa_not_configured': {'ar': 'هاد الحساب ديال الإدارة. استعمل الموقع.', 'fr': 'Compte administrateur : utilisez le site.'},
  'err.not_found': {'ar': 'ما لقيناش هاد الصفحة.', 'fr': 'Introuvable.'},
  'err.rate': {'ar': 'بزاف ديال المحاولات. تسنى شوية وعاود.', 'fr': 'Trop de tentatives. Patientez un peu.'},
  'err.error': {'ar': 'وقع مشكل. عاود المحاولة.', 'fr': 'Une erreur est survenue. Réessayez.'},
};
```

- [ ] **Step 5: شغّل الاختبار**

Run: `flutter test test/strings_links_test.dart`
Expected: `All tests passed!`

- [ ] **Step 6: Commit**

```bash
cd "/Users/mac/Documents/lbienetre/nelook main" && git add mobile/lib/l10n mobile/lib/util mobile/test/strings_links_test.dart && git commit -m "feat(mobile): ar/fr strings, error messages, phone and map links

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: تحويل السمات

**Files:**
- Create: `mobile/lib/theme/category_theme.dart`, `mobile/test/theme_test.dart`

> ملاحظة: Flutter 3.19 لا يحتوي على `ColorScheme.surfaceContainer`، لذلك `surface` في السمة → `ColorScheme.surface` (البطاقات) و`background` → `ColorScheme.background`.

- [ ] **Step 1: الاختبار `mobile/test/theme_test.dart`**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:newlook/api/models.dart';
import 'package:newlook/theme/category_theme.dart';

void main() {
  test('dark barber theme maps colours, radius and status extension', () {
    final t = CategoryTheme(
      mode: Brightness.dark, light: fallbackCategoryTheme.light, dark: fallbackCategoryTheme.dark,
      displayFont: 'Reem Kufi', bodyFont: 'IBM Plex Sans Arabic', radius: 4, priceBoard: 'chalkboard',
    );
    final th = themeFor(t, withFonts: false);
    expect(th.brightness, Brightness.dark);
    expect(th.colorScheme.primary, t.dark.primary);
    expect(th.colorScheme.onPrimary, t.dark.onPrimary);
    expect(th.scaffoldBackgroundColor, t.dark.background);
    expect(th.colorScheme.onSurfaceVariant, t.dark.muted);
    expect(th.extension<NewlookStatusColors>()!.success, t.dark.success);
    final shape = th.cardTheme.shape as RoundedRectangleBorder;
    expect(shape.borderRadius, BorderRadius.circular(4));
  });

  test('fallback theme is light', () {
    expect(themeFor(fallbackCategoryTheme, withFonts: false).brightness, Brightness.light);
  });
}
```

- [ ] **Step 2: شغّله وتأكد من الفشل**

Run: `flutter test test/theme_test.dart`
Expected: FAIL.

- [ ] **Step 3: `mobile/lib/theme/category_theme.dart`**

```dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../api/models.dart';

class NewlookStatusColors extends ThemeExtension<NewlookStatusColors> {
  const NewlookStatusColors({required this.success, required this.warning});
  final Color success, warning;
  @override
  NewlookStatusColors copyWith({Color? success, Color? warning}) => NewlookStatusColors(success: success ?? this.success, warning: warning ?? this.warning);
  @override
  NewlookStatusColors lerp(ThemeExtension<NewlookStatusColors>? other, double t) {
    if (other is! NewlookStatusColors) return this;
    return NewlookStatusColors(success: Color.lerp(success, other.success, t)!, warning: Color.lerp(warning, other.warning, t)!);
  }
}

/// Used before the catalog is loaded (same colours as the website).
const fallbackCategoryTheme = CategoryTheme(
  mode: Brightness.light,
  light: ThemeColors(background: Color(0xFFF5FAF7), surface: Color(0xFFFFFFFF), text: Color(0xFF182720), muted: Color(0xFF5A5F70), primary: Color(0xFF267A54), onPrimary: Color(0xFFFFFFFF), accent: Color(0xFF7A5A1F), border: Color(0xFFDCE8E1), success: Color(0xFF2E7D4F), warning: Color(0xFF9A6416), danger: Color(0xFFB42318)),
  dark: ThemeColors(background: Color(0xFF0F1813), surface: Color(0xFF16221B), text: Color(0xFFE6F1EB), muted: Color(0xFFA6B5AD), primary: Color(0xFF5CC596), onPrimary: Color(0xFF0F1813), accent: Color(0xFFD8B061), border: Color(0xFF26362D), success: Color(0xFF4CAF7A), warning: Color(0xFFE0A548), danger: Color(0xFFF07167)),
  displayFont: 'Reem Kufi', bodyFont: 'IBM Plex Sans Arabic', radius: 12, priceBoard: 'menu',
);

/// Google font, or the plain style when the family is unknown / offline.
TextStyle? safeFont(String? family, TextStyle? style) {
  if (family == null) return style;
  try {
    return GoogleFonts.getFont(family, textStyle: style);
  } catch (_) {
    return style;
  }
}

ThemeData themeFor(CategoryTheme t, {bool withFonts = true}) {
  final c = t.colors;
  final radius = BorderRadius.circular(t.radius);
  final scheme = ColorScheme(
    brightness: t.mode,
    primary: c.primary, onPrimary: c.onPrimary,
    secondary: c.primary, onSecondary: c.onPrimary,
    tertiary: c.accent, onTertiary: c.onPrimary,
    error: c.danger, onError: Colors.white,
    background: c.background, onBackground: c.text,
    surface: c.surface, onSurface: c.text,
    surfaceVariant: c.surface, onSurfaceVariant: c.muted,
    outline: c.border, outlineVariant: c.border,
  );
  final base = (t.mode == Brightness.dark ? ThemeData.dark() : ThemeData.light()).textTheme.apply(bodyColor: c.text, displayColor: c.text);
  TextStyle? display(TextStyle? s) => withFonts ? safeFont(t.displayFont, s) : s;
  TextStyle? body(TextStyle? s) => withFonts ? safeFont(t.bodyFont, s) : s;
  final text = base.copyWith(
    displayLarge: display(base.displayLarge), displayMedium: display(base.displayMedium), displaySmall: display(base.displaySmall),
    headlineLarge: display(base.headlineLarge), headlineMedium: display(base.headlineMedium), headlineSmall: display(base.headlineSmall),
    titleLarge: display(base.titleLarge),
    titleMedium: body(base.titleMedium), titleSmall: body(base.titleSmall),
    bodyLarge: body(base.bodyLarge), bodyMedium: body(base.bodyMedium), bodySmall: body(base.bodySmall),
    labelLarge: body(base.labelLarge), labelMedium: body(base.labelMedium), labelSmall: body(base.labelSmall),
  );
  final shape = RoundedRectangleBorder(borderRadius: radius);
  return ThemeData(
    useMaterial3: true,
    brightness: t.mode,
    colorScheme: scheme,
    scaffoldBackgroundColor: c.background,
    textTheme: text,
    dividerColor: c.border,
    appBarTheme: AppBarTheme(backgroundColor: c.surface, foregroundColor: c.text, elevation: 0, scrolledUnderElevation: 0, titleTextStyle: text.titleLarge),
    cardTheme: CardTheme(color: c.surface, elevation: 0, margin: EdgeInsets.zero, shape: RoundedRectangleBorder(borderRadius: radius, side: BorderSide(color: c.border))),
    inputDecorationTheme: InputDecorationTheme(
      filled: true, fillColor: c.background,
      border: OutlineInputBorder(borderRadius: radius, borderSide: BorderSide(color: c.border)),
      enabledBorder: OutlineInputBorder(borderRadius: radius, borderSide: BorderSide(color: c.border)),
      focusedBorder: OutlineInputBorder(borderRadius: radius, borderSide: BorderSide(color: c.primary, width: 2)),
    ),
    filledButtonTheme: FilledButtonThemeData(style: FilledButton.styleFrom(backgroundColor: c.primary, foregroundColor: c.onPrimary, shape: shape, minimumSize: const Size(0, 48))),
    outlinedButtonTheme: OutlinedButtonThemeData(style: OutlinedButton.styleFrom(foregroundColor: c.text, side: BorderSide(color: c.border), shape: shape, minimumSize: const Size(0, 48))),
    chipTheme: ChipThemeData(backgroundColor: c.surface, selectedColor: c.primary, side: BorderSide(color: c.border), labelStyle: TextStyle(color: c.text), secondaryLabelStyle: TextStyle(color: c.onPrimary)),
    bottomSheetTheme: BottomSheetThemeData(backgroundColor: c.background),
    extensions: [NewlookStatusColors(success: c.success, warning: c.warning)],
  );
}
```

- [ ] **Step 4: شغّل الاختبار**

Run: `flutter test test/theme_test.dart`
Expected: `All tests passed!`

- [ ] **Step 5: Commit**

```bash
cd "/Users/mac/Documents/lbienetre/nelook main" && git add mobile/lib/theme mobile/test/theme_test.dart && git commit -m "feat(mobile): category theme to ThemeData

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: المستودع والحالة

**Files:**
- Create: `mobile/lib/api/repository.dart`, `mobile/lib/state/providers.dart`, `mobile/lib/values.dart`, `mobile/test/ticket_test.dart`

- [ ] **Step 1: الاختبار `mobile/test/ticket_test.dart`**

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:newlook/api/models.dart';
import 'package:newlook/state/providers.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  test('ticket is saved, reloaded and cleared', () async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    final n = TicketNotifier(prefs);
    expect(n.state, isNull);
    await n.set(const QueueTicket(businessId: 'b', id: 'q', token: 't', businessName: 'Salon'));
    expect(TicketNotifier(prefs).state!.businessName, 'Salon');
    await n.set(null);
    expect(TicketNotifier(prefs).state, isNull);
  });

  test('corrupted stored ticket is ignored', () async {
    SharedPreferences.setMockInitialValues({TicketNotifier.storageKey: '{bad json'});
    expect(TicketNotifier(await SharedPreferences.getInstance()).state, isNull);
  });
}
```

- [ ] **Step 2: شغّله وتأكد من الفشل**

Run: `flutter test test/ticket_test.dart`
Expected: FAIL.

- [ ] **Step 3: `mobile/lib/values.dart`**

```dart
/// Must match server/src/lib/common.js (the server validates against it).
const cities = ['الدار البيضاء', 'الرباط', 'مراكش', 'طنجة', 'فاس', 'أكادير', 'وجدة', 'تطوان', 'مدينة أخرى'];
const cityFr = {
  'الدار البيضاء': 'Casablanca', 'الرباط': 'Rabat', 'مراكش': 'Marrakech', 'طنجة': 'Tanger', 'فاس': 'Fès',
  'أكادير': 'Agadir', 'وجدة': 'Oujda', 'تطوان': 'Tétouan', 'مدينة أخرى': 'Autre ville',
};
String cityLabel(String city, String lang) => lang == 'fr' ? (cityFr[city] ?? city) : city;
```

- [ ] **Step 4: `mobile/lib/api/repository.dart`**

```dart
import 'client.dart';
import 'models.dart';

/// Every API call the app makes (see docs/api/flutter-integration.md).
class Repository {
  Repository(this.api);
  final ApiClient api;

  Future<Catalog> catalog() async => Catalog.fromJson(await api.get('/api/catalog'));

  Future<List<Business>> search({String? city, String? category, String keyword = '', bool availableNow = false}) async {
    final d = await api.get('/api/search', {
      if (city != null) 'city': city,
      if (category != null) 'category': category,
      if (keyword.trim().isNotEmpty) 'keyword': keyword.trim(),
      if (availableNow) 'availableNow': '1',
    });
    return (d['results'] as List? ?? []).whereType<Map<String, dynamic>>().map(Business.fromJson).toList();
  }

  Future<Profile> profile(String id) async => Profile.fromJson(await api.get('/api/businesses/$id'));

  Future<List<String>> slots(String businessId, List<String> serviceIds, String day, {String? audience}) async {
    final d = await api.get('/api/businesses/$businessId/slots', {'services': serviceIds.join(','), 'day': day, if (audience != null) 'audience': audience});
    return (d['slots'] as List? ?? []).map((e) => '$e').toList();
  }

  Future<void> book(String businessId, {required List<String> serviceIds, required String startsAt, required String name, required String phone, String? audience}) =>
      api.post('/api/businesses/$businessId/bookings', {'serviceIds': serviceIds, 'startsAt': startsAt, 'name': name, 'phone': phone, if (audience != null) 'audience': audience});

  Future<(QueueTicket, QueueStatus)> joinQueue(Business b, {required String name, required String phone}) async {
    final d = await api.post('/api/businesses/${b.id}/queue', {'name': name, 'phone': phone});
    return (
      QueueTicket(businessId: b.id, id: '${d['id']}', token: '${d['token']}', businessName: b.name),
      QueueStatus(status: 'waiting', position: (d['position'] as num?)?.toInt(), estimatedWaitMinutes: (d['estimatedWaitMinutes'] as num?)?.toInt()),
    );
  }

  Future<QueueStatus> queueStatus(QueueTicket t) async => QueueStatus.fromJson(await api.get('/api/queue/${t.id}', {'token': t.token}));
  Future<void> leaveQueue(QueueTicket t) => api.post('/api/queue/${t.id}/cancel', {'token': t.token});

  // ─── Pro ───
  /// "ok", or "mfa" for admin accounts (not allowed in the app).
  Future<String> login(String email, String password) async {
    final d = await api.post('/api/auth/login', {'email': email.trim(), 'password': password});
    return d['mfa'] != null ? 'mfa' : 'ok';
  }

  Future<void> logout() => api.post('/api/auth/logout');
  Future<bool> signedIn() async => (await api.get('/api/auth/me'))['user'] != null;

  Future<ProBusiness?> myBusiness() async {
    final b = (await api.get('/api/me/business'))['business'];
    return b is Map<String, dynamic> ? ProBusiness.fromJson(b) : null;
  }

  Future<Live?> setLive(String state) async {
    final l = (await api.patch('/api/me/live', {'state': state}))['live'];
    return l is Map<String, dynamic> ? Live.fromJson(l) : null;
  }

  Future<List<QueueEntry>> myQueue() async => ((await api.get('/api/me/queue'))['entries'] as List? ?? []).whereType<Map<String, dynamic>>().map(QueueEntry.fromJson).toList();
  Future<void> serve(String id) => api.post('/api/me/queue/$id/serve');
  Future<void> noShow(String id) => api.post('/api/me/queue/$id/no-show');

  Future<List<ProBooking>> myBookings() async => ((await api.get('/api/me/bookings'))['bookings'] as List? ?? []).whereType<Map<String, dynamic>>().map(ProBooking.fromJson).toList();
  Future<void> setBookingStatus(String id, String status) => api.patch('/api/me/bookings/$id', {'status': status});
}
```

- [ ] **Step 5: `mobile/lib/state/providers.dart`**

```dart
import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../api/models.dart';
import '../api/repository.dart';

/// Overridden in main() once the HTTP client and preferences are ready.
final repositoryProvider = Provider<Repository>((ref) => throw UnimplementedError('repositoryProvider'));
final prefsProvider = Provider<SharedPreferences>((ref) => throw UnimplementedError('prefsProvider'));

/// Loaded once per app start.
final catalogProvider = FutureProvider<Catalog>((ref) => ref.watch(repositoryProvider).catalog());

/// The client's current walk-in ticket (one at a time), kept across restarts.
class TicketNotifier extends StateNotifier<QueueTicket?> {
  TicketNotifier(this.prefs) : super(_read(prefs));
  final SharedPreferences prefs;
  static const storageKey = 'queue_ticket';

  static QueueTicket? _read(SharedPreferences p) {
    final raw = p.getString(storageKey);
    if (raw == null) return null;
    try {
      return QueueTicket.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }

  Future<void> set(QueueTicket? ticket) async {
    state = ticket;
    if (ticket == null) {
      await prefs.remove(storageKey);
    } else {
      await prefs.setString(storageKey, jsonEncode(ticket.toJson()));
    }
  }
}

final ticketProvider = StateNotifierProvider<TicketNotifier, QueueTicket?>((ref) => TicketNotifier(ref.watch(prefsProvider)));
```

- [ ] **Step 6: شغّل الاختبار**

Run: `flutter test test/ticket_test.dart`
Expected: `All tests passed!`

- [ ] **Step 7: Commit**

```bash
cd "/Users/mac/Documents/lbienetre/nelook main" && git add mobile/lib/api/repository.dart mobile/lib/state mobile/lib/values.dart mobile/test/ticket_test.dart && git commit -m "feat(mobile): repository, providers and persisted queue ticket

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: عناصر البروفايل

**Files:**
- Create: `mobile/lib/widgets/live_badge.dart`, `mobile/lib/widgets/price_board.dart`, `mobile/lib/widgets/profile_parts.dart`, `mobile/test/widgets_test.dart`

- [ ] **Step 1: الاختبار `mobile/test/widgets_test.dart`**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:newlook/api/models.dart';
import 'package:newlook/widgets/live_badge.dart';
import 'package:newlook/widgets/price_board.dart';

Widget wrap(Widget child, {Locale locale = const Locale('ar')}) => MaterialApp(
      locale: locale,
      supportedLocales: const [Locale('ar'), Locale('fr')],
      localizationsDelegates: const [GlobalMaterialLocalizations.delegate, GlobalWidgetsLocalizations.delegate, GlobalCupertinoLocalizations.delegate],
      home: Scaffold(body: child),
    );

void main() {
  testWidgets('LiveBadge texts per state; unknown renders nothing', (t) async {
    await t.pumpWidget(wrap(const LiveBadge(live: Live(state: 'free', waiting: 0, stale: false))));
    expect(find.text('فاضي دابا'), findsOneWidget);
    await t.pumpWidget(wrap(const LiveBadge(live: Live(state: 'busy', waiting: 3, estimatedWaitMinutes: 45, stale: false))));
    expect(find.text('3 فالانتظار ≈ 45 دقيقة'), findsOneWidget);
    await t.pumpWidget(wrap(const LiveBadge(live: Live(state: 'crowded', waiting: 0, stale: false)), locale: const Locale('fr')));
    expect(find.text('Très fréquenté'), findsOneWidget);
    await t.pumpWidget(wrap(const LiveBadge(live: Live(state: 'unknown', waiting: 0, stale: true))));
    expect(find.byType(Text), findsNothing);
  });

  const services = [Service(id: 'a', name: 'قصة فيد', price: 60, durationMinutes: 30), Service(id: 'b', name: 'لحية', price: 40, durationMinutes: 20)];

  for (final variant in ['chalkboard', 'menu', 'tiles']) {
    testWidgets('PriceBoard $variant shows every service and price', (t) async {
      await t.pumpWidget(wrap(SingleChildScrollView(child: PriceBoard(services: services, variant: variant))));
      expect(find.textContaining('قصة فيد'), findsOneWidget);
      expect(find.textContaining('60'), findsWidgets);
      expect(find.textContaining('لحية'), findsOneWidget);
    });
  }

  testWidgets('PriceBoard empty message', (t) async {
    await t.pumpWidget(wrap(const PriceBoard(services: [], variant: 'menu')));
    expect(find.text('الخدمات غادي تزاد قريباً.'), findsOneWidget);
  });
}
```

- [ ] **Step 2: شغّله وتأكد من الفشل**

Run: `flutter test test/widgets_test.dart`
Expected: FAIL.

- [ ] **Step 3: `mobile/lib/widgets/live_badge.dart`**

```dart
import 'package:flutter/material.dart';

import '../api/models.dart';
import '../l10n/strings.dart';

/// Live status pill. Nothing is shown when the status is unknown / stale.
class LiveBadge extends StatelessWidget {
  const LiveBadge({super.key, required this.live});
  final Live? live;

  @override
  Widget build(BuildContext context) {
    final l = live;
    if (l == null || l.state == 'unknown') return const SizedBox.shrink();
    final s = S.of(context);
    final (bg, fg) = switch (l.state) {
      'free' || 'quiet' => (const Color(0xFF15803D), Colors.white),
      'busy' || 'moderate' => (const Color(0xFFF59E0B), Colors.black),
      'crowded' => (const Color(0xFFDC2626), Colors.white),
      _ => (const Color(0xFF404040), Colors.white),
    };
    final text = switch (l.state) {
      'free' => s.t('live.free'),
      'busy' => l.waiting > 0 ? s.t('live.waiting', {'n': l.waiting, 'm': l.estimatedWaitMinutes ?? 0}) : s.t('live.busy'),
      'quiet' => s.t('live.quiet'),
      'moderate' => s.t('live.moderate'),
      'crowded' => s.t('live.crowded'),
      _ => s.t('live.closed'),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(99)),
      child: Text(text, style: TextStyle(color: fg, fontSize: 12, fontWeight: FontWeight.w600)),
    );
  }
}
```

- [ ] **Step 4: `mobile/lib/widgets/price_board.dart`**

```dart
import 'package:flutter/material.dart';

import '../api/models.dart';
import '../l10n/strings.dart';
import '../theme/category_theme.dart';

/// Price list: chalkboard (barber), menu (most), tiles (nails).
class PriceBoard extends StatelessWidget {
  const PriceBoard({super.key, required this.services, required this.variant, this.accentFont});
  final List<Service> services;
  final String variant;
  final String? accentFont;

  String _price(num p) => p == p.roundToDouble() ? p.toInt().toString() : p.toString();

  @override
  Widget build(BuildContext context) {
    final s = S.of(context);
    final theme = Theme.of(context);
    if (services.isEmpty) return Text(s.t('profile.noServices'), style: TextStyle(color: theme.colorScheme.onSurfaceVariant));
    if (variant == 'chalkboard') {
      const chalk = Color(0xFFF1EFE6);
      final accent = safeFont(accentFont, const TextStyle(color: chalk, fontSize: 16));
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: const Color(0xFF1F2A24), border: Border.all(color: const Color(0xFF5A3E2B), width: 8), borderRadius: BorderRadius.circular(6)),
        child: Column(children: [
          Text('— ${s.t('profile.prices')} —', style: accent),
          const SizedBox(height: 12),
          for (final sv in services)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Text(sv.name, style: const TextStyle(color: chalk)),
                  const SizedBox(width: 6),
                  const Expanded(child: Text('· · · · · · · · · · · · · · · · · · · · · ·', maxLines: 1, overflow: TextOverflow.clip, style: TextStyle(color: Color(0x88F1EFE6)))),
                  const SizedBox(width: 6),
                  Text('${_price(sv.price)} ${s.t('common.mad')}', style: accent?.copyWith(fontWeight: FontWeight.bold)),
                ]),
                Text('${sv.durationMinutes} ${s.t('common.min')}', style: const TextStyle(color: Color(0xAAF1EFE6), fontSize: 12)),
              ]),
            ),
        ]),
      );
    }
    if (variant == 'tiles') {
      return GridView.count(
        crossAxisCount: 2, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
        mainAxisSpacing: 10, crossAxisSpacing: 10, childAspectRatio: 1.4,
        children: [
          for (final sv in services)
            Card(child: Padding(padding: const EdgeInsets.all(10), child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
              Text(sv.name, textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.w600)),
              Text(_price(sv.price), style: theme.textTheme.headlineSmall?.copyWith(color: theme.colorScheme.primary)),
              Text('${s.t('common.mad')} · ${sv.durationMinutes} ${s.t('common.min')}', style: theme.textTheme.bodySmall),
            ]))),
        ],
      );
    }
    return Card(child: Column(children: [
      for (final (i, sv) in services.indexed) ...[
        if (i > 0) const Divider(height: 1),
        ListTile(
          title: Text(sv.name, style: const TextStyle(fontWeight: FontWeight.w600)),
          subtitle: Text('${sv.durationMinutes} ${s.t('common.min')}'),
          trailing: Text('${_price(sv.price)} ${s.t('common.mad')}', style: const TextStyle(fontWeight: FontWeight.bold)),
        ),
      ],
    ]));
  }
}
```

- [ ] **Step 5: `mobile/lib/widgets/profile_parts.dart`**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../api/models.dart';
import '../config.dart';
import '../l10n/strings.dart';

/// Category pattern (e.g. barber pole) repeated across the width, 12 px high.
class HeaderPattern extends StatelessWidget {
  const HeaderPattern({super.key, required this.path});
  final String path;
  @override
  Widget build(BuildContext context) => SizedBox(
        height: 12,
        child: LayoutBuilder(builder: (context, c) {
          final n = (c.maxWidth / 48).ceil() + 1;
          return ClipRect(child: OverflowBox(alignment: AlignmentDirectional.centerStart, maxWidth: n * 48.0, child: Row(children: [
            for (var i = 0; i < n; i++) SvgPicture.network(resolveUrl(path), width: 48, height: 12, fit: BoxFit.fill),
          ])));
        }),
      );
}

class AmenityChips extends StatelessWidget {
  const AmenityChips({super.key, required this.keys, required this.catalog});
  final List<String> keys;
  final Catalog? catalog;
  static const _icons = {
    'ac': Icons.ac_unit, 'wifi': Icons.wifi, 'kids': Icons.child_care, 'card': Icons.credit_card, 'parking': Icons.local_parking,
    'accessible': Icons.accessible, 'towels': Icons.dry_cleaning, 'private_room': Icons.lock, 'female_staff': Icons.face_3,
  };
  @override
  Widget build(BuildContext context) {
    final c = catalog;
    if (keys.isEmpty || c == null) return const SizedBox.shrink();
    final lang = S.of(context).lang;
    return Wrap(spacing: 6, runSpacing: 6, children: [
      for (final k in keys) Chip(avatar: Icon(_icons[k] ?? Icons.check, size: 16), label: Text(c.amenityLabel(k, lang)), visualDensity: VisualDensity.compact),
    ]);
  }
}

class GenderScheduleBar extends StatelessWidget {
  const GenderScheduleBar({super.key, required this.business});
  final Business business;
  @override
  Widget build(BuildContext context) {
    final s = S.of(context);
    final sched = business.genderSchedule;
    if (sched.isEmpty) return const SizedBox.shrink();
    final cur = business.currentAudience;
    final days = [1, 2, 3, 4, 5, 6, 0].where((d) => sched.any((r) => r.weekday == d));
    return Card(child: ExpansionTile(
      title: Text(cur == null ? s.t('sched.none') : s.t('sched.now', {'a': s.t('aud.${cur.now}'), 't': cur.until}), style: const TextStyle(fontWeight: FontWeight.bold)),
      subtitle: cur?.next == null ? Text(s.t('sched.week')) : Text(s.t('sched.next', {'a': s.t('aud.${cur!.next}')})),
      children: [
        for (final d in days)
          ListTile(dense: true, title: Text(s.day(d)), subtitle: Text(
            (sched.where((r) => r.weekday == d).toList()..sort((a, b) => a.start.compareTo(b.start))).map((r) => '${r.start}–${r.end} ${s.t('aud.${r.audience}')}').join('   '),
          )),
      ],
    ));
  }
}

class RitualBuilder extends StatefulWidget {
  const RitualBuilder({super.key, required this.services, required this.ritualSteps, required this.onChoose});
  final List<Service> services;
  final List<String> ritualSteps;
  final ValueChanged<List<String>> onChoose;
  @override
  State<RitualBuilder> createState() => _RitualBuilderState();
}

class _RitualBuilderState extends State<RitualBuilder> {
  late final List<Service> steps = [for (final id in widget.ritualSteps) ...widget.services.where((s) => s.id == id)];
  late final Set<String> picked = {if (steps.isNotEmpty) steps.first.id};

  @override
  Widget build(BuildContext context) {
    if (steps.length < 2) return const SizedBox.shrink();
    final s = S.of(context);
    final chosen = steps.where((x) => picked.contains(x.id)).toList();
    final minutes = chosen.fold<int>(0, (n, x) => n + x.durationMinutes);
    final price = chosen.fold<num>(0, (n, x) => n + x.price);
    return Card(child: Padding(padding: const EdgeInsets.all(12), child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      Text('✨ ${s.t('ritual.title')}', style: Theme.of(context).textTheme.titleLarge),
      for (final (i, x) in steps.indexed)
        CheckboxListTile(
          value: picked.contains(x.id),
          onChanged: (v) => setState(() => v == true ? picked.add(x.id) : picked.remove(x.id)),
          title: Text('${i + 1}. ${x.name}'),
          subtitle: Text('${x.durationMinutes} ${s.t('common.min')} · ${x.price} ${s.t('common.mad')}'),
          controlAffinity: ListTileControlAffinity.leading,
        ),
      Text(s.t('ritual.total', {'n': chosen.length, 'm': minutes, 'p': price})),
      const SizedBox(height: 8),
      FilledButton(onPressed: chosen.isEmpty ? null : () => widget.onChoose(chosen.map((x) => x.id).toList()), child: Text(s.t('ritual.pick'))),
    ])));
  }
}

class BringList extends StatelessWidget {
  const BringList({super.key, required this.items});
  final List<BringItem> items;
  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) return const SizedBox.shrink();
    final s = S.of(context);
    return Card(child: Padding(padding: const EdgeInsets.all(12), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(s.t('bring.title'), style: Theme.of(context).textTheme.titleLarge),
      for (final it in items)
        ListTile(dense: true, leading: const Icon(Icons.check), title: Text(it.label), trailing: it.available ? Chip(label: Text(s.t('bring.available')), visualDensity: VisualDensity.compact) : null),
    ])));
  }
}
```

- [ ] **Step 6: شغّل الاختبار**

Run: `flutter test test/widgets_test.dart`
Expected: `All tests passed!`

- [ ] **Step 7: Commit**

```bash
cd "/Users/mac/Documents/lbienetre/nelook main" && git add mobile/lib/widgets mobile/test/widgets_test.dart && git commit -m "feat(mobile): live badge, price boards, schedule bar, ritual builder, bring list

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: التطبيق والتنقل واللغات

**Files:**
- Create: `mobile/lib/app.dart`
- Modify: `mobile/lib/main.dart` (استبدال كامل)

- [ ] **Step 1: `mobile/lib/app.dart`**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'screens/home_screen.dart';
import 'screens/pro_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/ticket_screen.dart';
import 'state/providers.dart';
import 'theme/category_theme.dart';

final _router = GoRouter(routes: [
  GoRoute(path: '/', builder: (_, __) => const HomeScreen()),
  GoRoute(path: '/b/:id', builder: (_, st) => ProfileScreen(id: st.pathParameters['id']!)),
  GoRoute(path: '/ticket', builder: (_, __) => const TicketScreen()),
  GoRoute(path: '/pro', builder: (_, __) => const ProScreen()),
]);

class NewlookApp extends ConsumerWidget {
  const NewlookApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final catalog = ref.watch(catalogProvider).valueOrNull;
    return MaterialApp.router(
      title: 'NewLook',
      debugShowCheckedModeBanner: false,
      theme: themeFor(catalog?.fallback.theme ?? fallbackCategoryTheme),
      routerConfig: _router,
      supportedLocales: const [Locale('ar'), Locale('fr')],
      localizationsDelegates: const [GlobalMaterialLocalizations.delegate, GlobalWidgetsLocalizations.delegate, GlobalCupertinoLocalizations.delegate],
      // French phones get French, everybody else Arabic (RTL).
      localeResolutionCallback: (device, _) => device?.languageCode == 'fr' ? const Locale('fr') : const Locale('ar'),
    );
  }
}
```

- [ ] **Step 2: `mobile/lib/main.dart`**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'api/client.dart';
import 'api/repository.dart';
import 'app.dart';
import 'state/providers.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final prefs = await SharedPreferences.getInstance();
  final api = await ApiClient.create();
  runApp(ProviderScope(
    overrides: [
      repositoryProvider.overrideWithValue(Repository(api)),
      prefsProvider.overrideWithValue(prefs),
    ],
    child: const NewlookApp(),
  ));
}
```

(الشاشات المستوردة تُنشأ في المهام 8 إلى 12، والتحقق يكون في المهمة 12.)

- [ ] **Step 3: Commit**

```bash
cd "/Users/mac/Documents/lbienetre/nelook main" && git add mobile/lib/app.dart mobile/lib/main.dart && git commit -m "feat(mobile): app shell, routes and ar/fr locales

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: الشاشة الرئيسية

**Files:**
- Create: `mobile/lib/screens/home_screen.dart`, `mobile/lib/widgets/async_view.dart`

- [ ] **Step 1: `mobile/lib/widgets/async_view.dart`**

```dart
import 'package:flutter/material.dart';

import '../l10n/strings.dart';

/// Error box with a retry button (network or API error).
class ErrorRetry extends StatelessWidget {
  const ErrorRetry({super.key, required this.error, required this.onRetry});
  final Object error;
  final VoidCallback onRetry;
  @override
  Widget build(BuildContext context) {
    final s = S.of(context);
    return Padding(padding: const EdgeInsets.all(24), child: Column(mainAxisSize: MainAxisSize.min, children: [
      Text(s.error(error), textAlign: TextAlign.center),
      const SizedBox(height: 12),
      OutlinedButton(onPressed: onRetry, child: Text(s.t('common.retry'))),
    ]));
  }
}
```

- [ ] **Step 2: `mobile/lib/screens/home_screen.dart`**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../api/models.dart';
import '../l10n/strings.dart';
import '../state/providers.dart';
import '../values.dart';
import '../widgets/async_view.dart';
import '../widgets/live_badge.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});
  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final _keyword = TextEditingController();
  String? _city;
  String? _category;
  bool _availableNow = false;
  late Future<List<Business>> _results = _load();

  Future<List<Business>> _load() => ref.read(repositoryProvider).search(city: _city, category: _category, keyword: _keyword.text, availableNow: _availableNow);
  Future<void> _reload() async {
    final f = _load();
    setState(() => _results = f);
    await f.catchError((_) => <Business>[]);
  }

  @override
  void dispose() {
    _keyword.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final s = S.of(context);
    final catalog = ref.watch(catalogProvider).valueOrNull;
    final ticket = ref.watch(ticketProvider);
    return Scaffold(
      appBar: AppBar(title: Text(s.t('app.name')), actions: [
        TextButton.icon(onPressed: () => context.push('/pro'), icon: const Icon(Icons.storefront), label: Text(s.t('home.pro'))),
      ]),
      body: RefreshIndicator(
        onRefresh: _reload,
        child: ListView(padding: const EdgeInsets.all(16), children: [
          if (ticket != null) ...[
            Card(child: ListTile(leading: const Icon(Icons.confirmation_number), title: Text(s.t('home.ticket', {'name': ticket.businessName})), trailing: const Icon(Icons.chevron_left), onTap: () => context.push('/ticket'))),
            const SizedBox(height: 12),
          ],
          TextField(controller: _keyword, textInputAction: TextInputAction.search, onSubmitted: (_) => _reload(), decoration: InputDecoration(hintText: s.t('home.search'), prefixIcon: const Icon(Icons.search))),
          const SizedBox(height: 12),
          SingleChildScrollView(scrollDirection: Axis.horizontal, child: Row(children: [
            Padding(padding: const EdgeInsetsDirectional.only(end: 6), child: ChoiceChip(label: Text(s.t('home.all')), selected: _category == null, onSelected: (_) { _category = null; _reload(); })),
            for (final c in catalog?.categories ?? const <CategoryDef>[])
              Padding(padding: const EdgeInsetsDirectional.only(end: 6), child: ChoiceChip(label: Text(c.label(s.lang)), selected: _category == c.value, onSelected: (_) { _category = c.value; _reload(); })),
          ])),
          const SizedBox(height: 8),
          Row(children: [
            Expanded(child: DropdownButtonFormField<String?>(
              value: _city,
              decoration: const InputDecoration(contentPadding: EdgeInsets.symmetric(horizontal: 12)),
              items: [DropdownMenuItem(value: null, child: Text(s.t('home.allCities'))), for (final c in cities) DropdownMenuItem(value: c, child: Text(cityLabel(c, s.lang)))],
              onChanged: (v) { _city = v; _reload(); },
            )),
            const SizedBox(width: 8),
            FilterChip(label: Text(s.t('home.availableNow')), selected: _availableNow, onSelected: (v) { _availableNow = v; _reload(); }),
          ]),
          const SizedBox(height: 16),
          FutureBuilder<List<Business>>(
            future: _results,
            builder: (context, snap) {
              if (snap.connectionState != ConnectionState.done) return const Padding(padding: EdgeInsets.all(32), child: Center(child: CircularProgressIndicator()));
              if (snap.hasError) return ErrorRetry(error: snap.error!, onRetry: _reload);
              final list = snap.data!;
              if (list.isEmpty) return Padding(padding: const EdgeInsets.all(32), child: Text(s.t('home.empty'), textAlign: TextAlign.center));
              return Column(children: [for (final b in list) Padding(padding: const EdgeInsets.only(bottom: 10), child: _BusinessCard(b: b, catalog: catalog))]);
            },
          ),
        ]),
      ),
    );
  }
}

class _BusinessCard extends StatelessWidget {
  const _BusinessCard({required this.b, required this.catalog});
  final Business b;
  final Catalog? catalog;
  @override
  Widget build(BuildContext context) {
    final s = S.of(context);
    final cat = catalog?.categoryOf(b.category);
    final color = cat?.theme.colors.primary ?? Theme.of(context).colorScheme.primary;
    return Card(clipBehavior: Clip.antiAlias, child: InkWell(
      onTap: () => context.push('/b/${b.id}'),
      child: Row(children: [
        Container(width: 8, height: 110, color: color),
        Expanded(child: Padding(padding: const EdgeInsets.all(12), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(cat?.label(s.lang) ?? b.category, style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600)),
          Text(b.name, style: Theme.of(context).textTheme.titleLarge, maxLines: 1, overflow: TextOverflow.ellipsis),
          const SizedBox(height: 4),
          Wrap(spacing: 8, crossAxisAlignment: WrapCrossAlignment.center, children: [
            Text('📍 ${cityLabel(b.city, s.lang)}'),
            LiveBadge(live: b.live),
          ]),
          if (b.price != null) Padding(padding: const EdgeInsets.only(top: 4), child: Text('${b.service ?? ''} · ${s.t('home.from', {'p': b.price})}', style: const TextStyle(fontWeight: FontWeight.w600))),
        ]))),
      ]),
    ));
  }
}
```

- [ ] **Step 3: Commit**

```bash
cd "/Users/mac/Documents/lbienetre/nelook main" && git add mobile/lib/screens/home_screen.dart mobile/lib/widgets/async_view.dart && git commit -m "feat(mobile): home screen with search, filters and live badges

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: نافذة الحجز

**Files:**
- Create: `mobile/lib/screens/booking_sheet.dart`

- [ ] **Step 1: `mobile/lib/screens/booking_sheet.dart`**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../api/models.dart';
import '../l10n/strings.dart';
import '../state/providers.dart';
import '../util/links.dart';

class BookingSheet extends ConsumerStatefulWidget {
  const BookingSheet({super.key, required this.business, required this.services, this.preset, required this.needsAudience});
  final Business business;
  final List<Service> services;
  final List<String>? preset;
  final bool needsAudience;
  @override
  ConsumerState<BookingSheet> createState() => _BookingSheetState();
}

class _BookingSheetState extends ConsumerState<BookingSheet> {
  late String? _single = widget.services.isEmpty ? null : widget.services.first.id;
  late List<String>? _preset = widget.preset;
  String? _audience;
  int _day = 0;
  String? _slot;
  Future<List<String>>? _slots;
  final _name = TextEditingController();
  final _phone = TextEditingController();
  bool _busy = false;
  String _msg = '';
  bool _done = false;
  final _days = List.generate(14, (i) => DateTime.now().add(Duration(days: i)));

  List<String> get _ids => (_preset?.isNotEmpty ?? false) ? _preset! : [if (_single != null) _single!];
  bool get _ready => _ids.isNotEmpty && (!widget.needsAudience || _audience != null);

  @override
  void initState() {
    super.initState();
    _loadSlots();
  }

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    super.dispose();
  }

  void _loadSlots() {
    _slot = null;
    // 'en' keeps Latin digits (the API rejects Arabic-Indic digits).
    _slots = _ready ? ref.read(repositoryProvider).slots(widget.business.id, _ids, DateFormat('yyyy-MM-dd', 'en').format(_days[_day]), audience: widget.needsAudience ? _audience : null) : null;
  }

  Future<void> _submit() async {
    final s = S.of(context);
    if (_slot == null) return setState(() => _msg = s.t('book.pickSlot'));
    if (!isValidPhone(_phone.text)) return setState(() => _msg = s.t('err.invalid_phone'));
    setState(() { _busy = true; _msg = ''; });
    try {
      await ref.read(repositoryProvider).book(widget.business.id, serviceIds: _ids, startsAt: _slot!, name: _name.text.trim(), phone: _phone.text, audience: widget.needsAudience ? _audience : null);
      setState(() => _done = true);
    } catch (e) {
      setState(() { _msg = s.error(e); _loadSlots(); });
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = S.of(context);
    final theme = Theme.of(context);
    final chosen = [for (final id in _ids) ...widget.services.where((x) => x.id == id)];
    final dayFmt = DateFormat.E(s.lang);
    if (_done) {
      return Padding(padding: const EdgeInsets.all(24), child: Column(mainAxisSize: MainAxisSize.min, children: [
        Icon(Icons.check_circle, size: 56, color: theme.colorScheme.primary),
        const SizedBox(height: 12),
        Text(s.t('book.done'), textAlign: TextAlign.center),
        const SizedBox(height: 16),
        FilledButton(onPressed: () => Navigator.of(context).pop(), child: const Text('OK')),
      ]));
    }
    return Padding(
      padding: EdgeInsets.only(left: 16, right: 16, top: 16, bottom: MediaQuery.of(context).viewInsets.bottom + 16),
      child: SingleChildScrollView(child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Text(s.t('book.cta'), style: theme.textTheme.headlineSmall),
        const SizedBox(height: 12),
        if (_preset?.isNotEmpty ?? false)
          Card(child: ListTile(
            title: Text(chosen.map((x) => x.name).join(' + ')),
            subtitle: Text('${chosen.fold<int>(0, (n, x) => n + x.durationMinutes)} ${s.t('common.min')} · ${chosen.fold<num>(0, (n, x) => n + x.price)} ${s.t('common.mad')}'),
            trailing: TextButton(onPressed: () => setState(() { _preset = null; _loadSlots(); }), child: Text(s.t('book.change'))),
          ))
        else
          DropdownButtonFormField<String>(
            value: _single,
            isExpanded: true,
            items: [for (final x in widget.services) DropdownMenuItem(value: x.id, child: Text('${x.name} — ${x.price} ${s.t('common.mad')} · ${x.durationMinutes} ${s.t('common.min')}', overflow: TextOverflow.ellipsis))],
            onChanged: (v) => setState(() { _single = v; _loadSlots(); }),
          ),
        if (widget.needsAudience) ...[
          const SizedBox(height: 12),
          SegmentedButton<String>(
            segments: [ButtonSegment(value: 'women', label: Text(s.t('aud.women'))), ButtonSegment(value: 'men', label: Text(s.t('aud.men')))],
            selected: {if (_audience != null) _audience!},
            emptySelectionAllowed: true,
            onSelectionChanged: (v) => setState(() { _audience = v.isEmpty ? null : v.first; _loadSlots(); }),
          ),
        ],
        const SizedBox(height: 12),
        SizedBox(height: 64, child: ListView.separated(
          scrollDirection: Axis.horizontal,
          itemCount: _days.length,
          separatorBuilder: (_, __) => const SizedBox(width: 6),
          itemBuilder: (_, i) => ChoiceChip(
            label: Column(mainAxisSize: MainAxisSize.min, children: [Text(dayFmt.format(_days[i]), style: const TextStyle(fontSize: 11)), Text('${_days[i].day}', style: const TextStyle(fontWeight: FontWeight.bold))]),
            selected: i == _day,
            onSelected: (_) => setState(() { _day = i; _loadSlots(); }),
          ),
        )),
        const SizedBox(height: 8),
        if (!_ready)
          Text(s.t('book.chooseAudience'))
        else
          FutureBuilder<List<String>>(
            future: _slots,
            builder: (context, snap) {
              if (snap.connectionState != ConnectionState.done) return const Padding(padding: EdgeInsets.all(16), child: Center(child: CircularProgressIndicator()));
              if (snap.hasError) return Text(s.error(snap.error!));
              final slots = snap.data ?? const [];
              if (slots.isEmpty) return Text(s.t('book.noSlots'));
              return Wrap(spacing: 6, runSpacing: 6, children: [
                for (final iso in slots)
                  ChoiceChip(label: Text(DateFormat.Hm('en').format(DateTime.parse(iso).toLocal())), selected: _slot == iso, onSelected: (_) => setState(() => _slot = iso)),
              ]);
            },
          ),
        const SizedBox(height: 12),
        TextField(controller: _name, textInputAction: TextInputAction.next, decoration: InputDecoration(labelText: s.t('form.name'))),
        const SizedBox(height: 8),
        TextField(controller: _phone, keyboardType: TextInputType.phone, decoration: InputDecoration(labelText: s.t('form.phone'))),
        const SizedBox(height: 8),
        Text(s.t('book.cash'), style: theme.textTheme.bodySmall),
        const SizedBox(height: 12),
        FilledButton(onPressed: _busy ? null : _submit, child: Text(s.t('book.confirm'))),
        if (_msg.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 8), child: Text(_msg, style: TextStyle(color: theme.colorScheme.error))),
      ])),
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
cd "/Users/mac/Documents/lbienetre/nelook main" && git add mobile/lib/screens/booking_sheet.dart && git commit -m "feat(mobile): booking sheet (multi-service, women/men, slots)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: البروفايل بسمة الصنف + "زيدني فالصف"

**Files:**
- Create: `mobile/lib/screens/profile_screen.dart`, `mobile/lib/widgets/walkin_queue_card.dart`

- [ ] **Step 1: `mobile/lib/widgets/walkin_queue_card.dart`**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../api/models.dart';
import '../l10n/strings.dart';
import '../state/providers.dart';
import '../util/links.dart';

class WalkinQueueCard extends ConsumerStatefulWidget {
  const WalkinQueueCard({super.key, required this.business});
  final Business business;
  @override
  ConsumerState<WalkinQueueCard> createState() => _WalkinQueueCardState();
}

class _WalkinQueueCardState extends ConsumerState<WalkinQueueCard> {
  final _name = TextEditingController();
  final _phone = TextEditingController();
  bool _busy = false;
  String _msg = '';

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    super.dispose();
  }

  Future<void> _join() async {
    final s = S.of(context);
    if (_name.text.trim().length < 2) return setState(() => _msg = s.t('err.invalid_input'));
    if (!isValidPhone(_phone.text)) return setState(() => _msg = s.t('err.invalid_phone'));
    setState(() { _busy = true; _msg = ''; });
    try {
      final (ticket, _) = await ref.read(repositoryProvider).joinQueue(widget.business, name: _name.text.trim(), phone: _phone.text);
      await ref.read(ticketProvider.notifier).set(ticket);
      if (mounted) context.push('/ticket');
    } catch (e) {
      setState(() => _msg = s.error(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = S.of(context);
    final ticket = ref.watch(ticketProvider);
    final closed = widget.business.live?.state == 'closed';
    return Card(child: Padding(padding: const EdgeInsets.all(12), child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      Text('👥 ${s.t('queue.title')}', style: Theme.of(context).textTheme.titleLarge),
      const SizedBox(height: 8),
      if (ticket != null && ticket.businessId == widget.business.id)
        FilledButton(onPressed: () => context.push('/ticket'), child: Text(s.t('queue.open')))
      else if (closed)
        Text(s.t('queue.closed'))
      else ...[
        Text(s.t('queue.intro')),
        const SizedBox(height: 8),
        TextField(controller: _name, decoration: InputDecoration(labelText: s.t('form.name'))),
        const SizedBox(height: 8),
        TextField(controller: _phone, keyboardType: TextInputType.phone, decoration: InputDecoration(labelText: s.t('form.phone'))),
        const SizedBox(height: 8),
        FilledButton(onPressed: _busy ? null : _join, child: Text(s.t('queue.title'))),
        if (_msg.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 8), child: Text(_msg, style: TextStyle(color: Theme.of(context).colorScheme.error))),
      ],
    ])));
  }
}
```

- [ ] **Step 2: `mobile/lib/screens/profile_screen.dart`**

```dart
import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../api/models.dart';
import '../config.dart';
import '../l10n/strings.dart';
import '../state/providers.dart';
import '../theme/category_theme.dart';
import '../util/links.dart';
import '../values.dart';
import '../widgets/async_view.dart';
import '../widgets/live_badge.dart';
import '../widgets/price_board.dart';
import '../widgets/profile_parts.dart';
import '../widgets/walkin_queue_card.dart';
import 'booking_sheet.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key, required this.id});
  final String id;
  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  Profile? _data;
  Object? _error;
  Timer? _timer;
  String? _tag;

  @override
  void initState() {
    super.initState();
    _load();
    // Live status changes during the day: refresh every minute.
    _timer = Timer.periodic(const Duration(seconds: 60), (_) => _load(silent: true));
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _load({bool silent = false}) async {
    try {
      final p = await ref.read(repositoryProvider).profile(widget.id);
      if (mounted) setState(() { _data = p; _error = null; });
    } catch (e) {
      if (mounted && !silent) setState(() => _error = e);
    }
  }

  void _book(BuildContext context, Profile p, CategoryDef? cat, [List<String>? preset]) {
    final theme = Theme.of(context);
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => Theme(data: theme, child: BookingSheet(
        business: p.business, services: p.services, preset: preset,
        needsAudience: (cat?.has('gender_schedule') ?? false) && p.business.genderSchedule.isNotEmpty,
      )),
    );
  }

  @override
  Widget build(BuildContext context) {
    final catalog = ref.watch(catalogProvider).valueOrNull;
    final p = _data;
    if (p == null) {
      return Scaffold(appBar: AppBar(), body: Center(child: _error != null ? ErrorRetry(error: _error!, onRetry: _load) : const CircularProgressIndicator()));
    }
    final cat = catalog?.categoryOf(p.business.category);
    return Theme(
      data: cat != null ? themeFor(cat.theme) : Theme.of(context),
      child: Builder(builder: (context) => _body(context, p, cat, catalog)),
    );
  }

  Widget _body(BuildContext context, Profile p, CategoryDef? cat, Catalog? catalog) {
    final s = S.of(context);
    final theme = Theme.of(context);
    final b = p.business;
    final ts = b.todayStatus;
    final today = ts.openNow
        ? s.t('profile.openUntil', {'t': ts.closesAt})
        : ts.nextOpenWeekday != null
            ? s.t('profile.closedOpens', {'d': s.day(ts.nextOpenWeekday!), 't': ts.nextOpenTime})
            : s.t('profile.noHours');
    final wa = whatsappUri(b.phone, s.t('profile.waText', {'name': b.name}));
    final has = cat?.has ?? (String _) => false;
    final usedTags = (cat?.styleTags ?? const <StyleTag>[]).where((t) => p.works.any((w) => w.tags.contains(t.key))).toList();
    final works = _tag == null ? p.works : p.works.where((w) => w.tags.contains(_tag)).toList();
    const gap = SizedBox(height: 16);

    return Scaffold(
      appBar: AppBar(title: Text(b.name, overflow: TextOverflow.ellipsis)),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(children: [
          if (cat?.theme.headerPattern != null) HeaderPattern(path: cat!.theme.headerPattern!),
          Padding(padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(cat?.label(s.lang) ?? b.category, style: TextStyle(color: theme.colorScheme.primary, fontWeight: FontWeight.w600)),
            Text(b.name, style: theme.textTheme.headlineMedium),
            const SizedBox(height: 8),
            Wrap(spacing: 8, runSpacing: 6, crossAxisAlignment: WrapCrossAlignment.center, children: [
              LiveBadge(live: b.live),
              Text('🕒 $today'),
              Text('📍 ${[b.address.district, cityLabel(b.city, s.lang)].where((x) => x.isNotEmpty).join(' · ')}'),
            ]),
            if (b.address.line.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 4), child: Text(b.address.line, style: TextStyle(color: theme.colorScheme.onSurfaceVariant))),
            if (b.bio.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 12), child: Text(b.bio)),
            const SizedBox(height: 12),
            AmenityChips(keys: b.amenities, catalog: catalog),
            const SizedBox(height: 12),
            Wrap(spacing: 8, runSpacing: 8, children: [
              FilledButton.icon(onPressed: () => launchUrl(directionsUri(b), mode: LaunchMode.externalApplication), icon: const Icon(Icons.navigation), label: Text(s.t('profile.directions'))),
              if (b.phone.isNotEmpty) OutlinedButton.icon(onPressed: () => launchUrl(Uri(scheme: 'tel', path: b.phone)), icon: const Icon(Icons.call), label: Text(s.t('profile.call'))),
              if (wa != null) OutlinedButton.icon(onPressed: () => launchUrl(wa, mode: LaunchMode.externalApplication), icon: const Icon(Icons.chat), label: Text(s.t('profile.whatsapp'))),
            ]),
          ])),
          Padding(padding: const EdgeInsets.symmetric(horizontal: 16), child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            if (has('gender_schedule')) ...[GenderScheduleBar(business: b), gap],
            Text(s.t('profile.services'), style: theme.textTheme.titleLarge),
            const SizedBox(height: 8),
            PriceBoard(services: p.services, variant: cat?.theme.priceBoard ?? 'menu', accentFont: cat?.theme.accentFont),
            gap,
            if (has('walkin_queue')) ...[WalkinQueueCard(business: b), gap],
            if (has('ritual_builder')) ...[RitualBuilder(services: p.services, ritualSteps: b.ritualSteps, onChoose: (ids) => _book(context, p, cat, ids)), gap],
            if (has('bring_list')) ...[BringList(items: b.bringList), gap],
            Text(s.t('profile.works'), style: theme.textTheme.titleLarge),
            if (usedTags.isNotEmpty)
              SingleChildScrollView(scrollDirection: Axis.horizontal, child: Row(children: [
                Padding(padding: const EdgeInsetsDirectional.only(end: 6), child: ChoiceChip(label: Text(s.t('home.all')), selected: _tag == null, onSelected: (_) => setState(() => _tag = null))),
                for (final t in usedTags) Padding(padding: const EdgeInsetsDirectional.only(end: 6), child: ChoiceChip(label: Text(t.label(s.lang)), selected: _tag == t.key, onSelected: (_) => setState(() => _tag = t.key))),
              ])),
            const SizedBox(height: 8),
            if (works.isEmpty)
              Text(s.t('profile.noWorks'))
            else
              GridView.count(crossAxisCount: 2, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(), mainAxisSpacing: 8, crossAxisSpacing: 8, children: [
                for (final w in works)
                  ClipRRect(borderRadius: BorderRadius.circular(8), child: CachedNetworkImage(imageUrl: resolveUrl(w.imageUrl), fit: BoxFit.cover, errorWidget: (_, __, ___) => const Icon(Icons.image_not_supported))),
              ]),
            const SizedBox(height: 96),
          ])),
        ]),
      ),
      bottomNavigationBar: p.services.isEmpty ? null : SafeArea(child: Padding(padding: const EdgeInsets.all(12), child: FilledButton(onPressed: () => _book(context, p, cat), child: Text(s.t('book.cta'))))),
    );
  }
}
```

- [ ] **Step 3: Commit**

```bash
cd "/Users/mac/Documents/lbienetre/nelook main" && git add mobile/lib/screens/profile_screen.dart mobile/lib/widgets/walkin_queue_card.dart && git commit -m "feat(mobile): category-themed profile and walk-in queue card

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: تذكرة الصف

**Files:**
- Create: `mobile/lib/screens/ticket_screen.dart`

- [ ] **Step 1: `mobile/lib/screens/ticket_screen.dart`**

```dart
import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../api/client.dart';
import '../api/models.dart';
import '../l10n/strings.dart';
import '../state/providers.dart';

class TicketScreen extends ConsumerStatefulWidget {
  const TicketScreen({super.key});
  @override
  ConsumerState<TicketScreen> createState() => _TicketScreenState();
}

class _TicketScreenState extends ConsumerState<TicketScreen> {
  QueueStatus? _status;
  String _final = '';
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _refresh();
    _timer = Timer.periodic(const Duration(seconds: 30), (_) => _refresh());
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _refresh() async {
    final ticket = ref.read(ticketProvider);
    if (ticket == null) return;
    try {
      final st = await ref.read(repositoryProvider).queueStatus(ticket);
      if (!mounted) return;
      if (st.status != 'waiting') {
        await ref.read(ticketProvider.notifier).set(null);
        setState(() => _final = st.status == 'served' ? 'queue.served' : 'queue.left');
      } else {
        setState(() => _status = st);
      }
    } on ApiException catch (e) {
      if (e.status == 404) {
        await ref.read(ticketProvider.notifier).set(null);
        if (mounted) setState(() => _final = 'queue.left');
      }
    } catch (_) {/* network blip: try again next tick */}
  }

  Future<void> _leave() async {
    final ticket = ref.read(ticketProvider);
    if (ticket != null) await ref.read(repositoryProvider).leaveQueue(ticket).catchError((_) {});
    await ref.read(ticketProvider.notifier).set(null);
    if (mounted) setState(() => _final = 'queue.left');
  }

  @override
  Widget build(BuildContext context) {
    final s = S.of(context);
    final theme = Theme.of(context);
    final ticket = ref.watch(ticketProvider);
    final st = _status;
    return Scaffold(
      appBar: AppBar(title: Text(s.t('ticket.title'))),
      body: Center(child: Padding(padding: const EdgeInsets.all(24), child: _final.isNotEmpty
          ? Text(s.t(_final), style: theme.textTheme.titleLarge, textAlign: TextAlign.center)
          : ticket == null
              ? Text(s.t('queue.none'))
              : Column(mainAxisSize: MainAxisSize.min, children: [
                  Text(ticket.businessName, style: theme.textTheme.titleLarge),
                  const SizedBox(height: 16),
                  Text(s.t('queue.youAre')),
                  Text(st?.position?.toString() ?? '…', style: theme.textTheme.displayLarge?.copyWith(color: theme.colorScheme.primary, fontWeight: FontWeight.bold)),
                  if (st != null) Text(st.position == 1 ? s.t('queue.next') : s.t('queue.about', {'m': st.estimatedWaitMinutes ?? 0}), textAlign: TextAlign.center),
                  const SizedBox(height: 24),
                  OutlinedButton(onPressed: _leave, child: Text(s.t('queue.leave'))),
                ]))),
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
cd "/Users/mac/Documents/lbienetre/nelook main" && git add mobile/lib/screens/ticket_screen.dart && git commit -m "feat(mobile): walk-in ticket screen with live position

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: جانب المهني + تحقق شامل

**Files:**
- Create: `mobile/lib/screens/pro_screen.dart`

- [ ] **Step 1: `mobile/lib/screens/pro_screen.dart`**

```dart
import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../api/models.dart';
import '../config.dart';
import '../l10n/strings.dart';
import '../state/providers.dart';
import '../widgets/live_badge.dart';

/// Login form, or the pro dashboard when a session exists.
class ProScreen extends ConsumerStatefulWidget {
  const ProScreen({super.key});
  @override
  ConsumerState<ProScreen> createState() => _ProScreenState();
}

class _ProScreenState extends ConsumerState<ProScreen> {
  bool _loading = true;
  ProBusiness? _business;
  bool _signedIn = false;
  final _email = TextEditingController();
  final _password = TextEditingController();
  String _msg = '';
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _check();
  }

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _check() async {
    final repo = ref.read(repositoryProvider);
    try {
      _signedIn = await repo.signedIn();
      _business = _signedIn ? await repo.myBusiness() : null;
    } catch (_) {
      _signedIn = false;
    }
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _login() async {
    final s = S.of(context);
    setState(() { _busy = true; _msg = ''; });
    try {
      final r = await ref.read(repositoryProvider).login(_email.text, _password.text);
      if (r == 'mfa') {
        setState(() => _msg = s.t('pro.mfa'));
      } else {
        await _check();
      }
    } catch (e) {
      setState(() => _msg = s.error(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _logout() async {
    await ref.read(repositoryProvider).logout().catchError((_) {});
    if (mounted) setState(() { _signedIn = false; _business = null; });
  }

  @override
  Widget build(BuildContext context) {
    final s = S.of(context);
    if (_loading) return Scaffold(appBar: AppBar(title: Text(s.t('pro.title'))), body: const Center(child: CircularProgressIndicator()));
    if (_signedIn && _business != null) return _ProDashboard(business: _business!, onLogout: _logout);
    return Scaffold(
      appBar: AppBar(title: Text(s.t('pro.title'))),
      body: ListView(padding: const EdgeInsets.all(24), children: [
        if (_signedIn) ...[
          Text(s.t('pro.noBusiness')),
          const SizedBox(height: 12),
          FilledButton(onPressed: () => launchUrl(Uri.parse('$apiBase/pro'), mode: LaunchMode.externalApplication), child: Text(s.t('pro.openSite'))),
          TextButton(onPressed: _logout, child: Text(s.t('pro.logout'))),
        ] else ...[
          TextField(controller: _email, keyboardType: TextInputType.emailAddress, autofillHints: const [AutofillHints.email], decoration: InputDecoration(labelText: s.t('pro.email'))),
          const SizedBox(height: 12),
          TextField(controller: _password, obscureText: true, autofillHints: const [AutofillHints.password], decoration: InputDecoration(labelText: s.t('pro.password'))),
          const SizedBox(height: 16),
          FilledButton(onPressed: _busy ? null : _login, child: Text(s.t('pro.login'))),
          if (_msg.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 12), child: Text(_msg, style: TextStyle(color: Theme.of(context).colorScheme.error))),
        ],
      ]),
    );
  }
}

class _ProDashboard extends ConsumerStatefulWidget {
  const _ProDashboard({required this.business, required this.onLogout});
  final ProBusiness business;
  final Future<void> Function() onLogout;
  @override
  ConsumerState<_ProDashboard> createState() => _ProDashboardState();
}

class _ProDashboardState extends ConsumerState<_ProDashboard> {
  late Live? _live = widget.business.live;
  List<QueueEntry> _queue = const [];
  List<ProBooking> _bookings = const [];
  String _msg = '';
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _refresh();
    _timer = Timer.periodic(const Duration(seconds: 20), (_) => _refresh());
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  bool get _hasQueue => ref.read(catalogProvider).valueOrNull?.categoryOf(widget.business.category).has('walkin_queue') ?? false;

  Future<void> _refresh() async {
    final repo = ref.read(repositoryProvider);
    try {
      final results = await Future.wait([repo.myBookings(), if (_hasQueue) repo.myQueue()]);
      if (!mounted) return;
      setState(() {
        final cutoff = DateTime.now().subtract(const Duration(hours: 12));
        _bookings = (results[0] as List<ProBooking>).where((b) => b.startsAt.isAfter(cutoff) && (b.status == 'pending' || b.status == 'confirmed')).toList();
        if (results.length > 1) _queue = results[1] as List<QueueEntry>;
      });
    } catch (_) {/* keep last data; retry next tick */}
  }

  Future<void> _run(Future<void> Function() action) async {
    try {
      await action();
      setState(() => _msg = '');
    } catch (e) {
      if (mounted) setState(() => _msg = S.of(context).error(e));
    }
    await _refresh();
  }

  Future<void> _setLive(String state) => _run(() async {
        final l = await ref.read(repositoryProvider).setLive(state);
        if (mounted) setState(() => _live = l);
      });

  @override
  Widget build(BuildContext context) {
    final s = S.of(context);
    final theme = Theme.of(context);
    final repo = ref.read(repositoryProvider);
    final cat = ref.watch(catalogProvider).valueOrNull?.categoryOf(widget.business.category);
    final states = cat?.liveStates ?? const <String>[];
    final time = DateFormat('dd/MM HH:mm', 'en');
    return Scaffold(
      appBar: AppBar(title: Text(widget.business.name), actions: [IconButton(onPressed: widget.onLogout, icon: const Icon(Icons.logout), tooltip: s.t('pro.logout'))]),
      body: RefreshIndicator(onRefresh: _refresh, child: ListView(padding: const EdgeInsets.all(16), children: [
        if (_msg.isNotEmpty) Padding(padding: const EdgeInsets.only(bottom: 8), child: Text(_msg, style: TextStyle(color: theme.colorScheme.error))),
        if (states.isNotEmpty) ...[
          Row(children: [Expanded(child: Text(s.t('pro.status'), style: theme.textTheme.titleLarge)), LiveBadge(live: _live)]),
          const SizedBox(height: 8),
          GridView.count(crossAxisCount: 2, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(), childAspectRatio: 2.6, mainAxisSpacing: 8, crossAxisSpacing: 8, children: [
            for (final st in states)
              _live?.state == st
                  ? FilledButton(onPressed: () => _setLive(st), child: Text(s.t('state.$st'), style: const TextStyle(fontSize: 18)))
                  : OutlinedButton(onPressed: () => _setLive(st), child: Text(s.t('state.$st'), style: const TextStyle(fontSize: 18))),
          ]),
          const SizedBox(height: 24),
        ],
        if (_hasQueue) ...[
          Text(s.t('pro.queue', {'n': _queue.length}), style: theme.textTheme.titleLarge),
          if (_queue.isEmpty) Text(s.t('pro.queueEmpty')),
          for (final (i, e) in _queue.indexed)
            Card(child: ListTile(
              leading: CircleAvatar(child: Text('${i + 1}')),
              title: Text(e.name),
              subtitle: Text('${e.phone} · ${DateFormat.Hm('en').format(e.createdAt)}'),
              trailing: Wrap(spacing: 4, children: [
                FilledButton(onPressed: () => _run(() => repo.serve(e.id)), child: Text(s.t('pro.served'))),
                OutlinedButton(onPressed: () => _run(() => repo.noShow(e.id)), child: Text(s.t('pro.noShow'))),
              ]),
            )),
          const SizedBox(height: 24),
        ],
        Text(s.t('pro.bookings'), style: theme.textTheme.titleLarge),
        if (_bookings.isEmpty) Text(s.t('pro.noBookings')),
        for (final b in _bookings)
          Card(child: Padding(padding: const EdgeInsets.all(12), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [Expanded(child: Text(b.clientName, style: const TextStyle(fontWeight: FontWeight.bold))), Text(s.t('bstatus.${b.status}'))]),
            Text('${b.serviceName} · ${b.price} ${s.t('common.mad')} · ${time.format(b.startsAt)}'),
            InkWell(onTap: () => launchUrl(Uri(scheme: 'tel', path: b.clientPhone)), child: Text(b.clientPhone, style: TextStyle(color: theme.colorScheme.primary))),
            Wrap(spacing: 8, children: [
              if (b.status == 'pending') FilledButton(onPressed: () => _run(() => repo.setBookingStatus(b.id, 'confirmed')), child: Text(s.t('pro.confirm'))),
              if (b.status == 'confirmed') OutlinedButton(onPressed: () => _run(() => repo.setBookingStatus(b.id, 'done')), child: Text(s.t('pro.done'))),
              TextButton(onPressed: () => _run(() => repo.setBookingStatus(b.id, 'cancelled')), child: Text(s.t('pro.cancel'))),
            ]),
          ]))),
        const SizedBox(height: 24),
        OutlinedButton.icon(onPressed: () => launchUrl(Uri.parse('$apiBase/pro'), mode: LaunchMode.externalApplication), icon: const Icon(Icons.open_in_new), label: Text(s.t('pro.editOnSite'))),
      ])),
    );
  }
}
```

- [ ] **Step 2: التحليل والاختبارات**

Run: `flutter analyze && flutter test`
Expected: `No issues found!` و `All tests passed!`
إذا ظهرت ملاحظات من `flutter analyze` (lints)، صحّحها في الملفات المعنية، ثم أعد التشغيل.

- [ ] **Step 3: Commit**

```bash
cd "/Users/mac/Documents/lbienetre/nelook main" && git add mobile && git commit -m "feat(mobile): pro login and dashboard (live status, queue, bookings)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: الأيقونة والتوقيع وبناء الـ APK

**Files:**
- Create: `mobile/android/app/src/main/res/mipmap-*/ic_launcher.png` (مولّدة)، `mobile/android/newlook-release.jks`، `mobile/android/key.properties` (غير مرفوعَين)
- Modify: `mobile/android/app/build.gradle`

- [ ] **Step 1: ولّد الأيقونة (512 px) ثم المقاسات**

```bash
cd "/Users/mac/Documents/lbienetre/nelook main/mobile" && T=$(mktemp -d) && cat > $T/icon.html <<'EOF'
<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Reem+Kufi:wght@700&display=swap" rel="stylesheet">
<style>html,body{margin:0;width:512px;height:512px;background:#267A54}div{width:512px;height:512px;display:flex;align-items:center;justify-content:center;font:700 330px 'Reem Kufi',sans-serif;color:#fff}</style></head>
<body><div>ن</div></body></html>
EOF
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars --window-size=512,512 --virtual-time-budget=5000 --screenshot=$T/icon.png "file://$T/icon.html" 2>/dev/null
for d in mdpi:48 hdpi:72 xhdpi:96 xxhdpi:144 xxxhdpi:192; do sips -z ${d#*:} ${d#*:} $T/icon.png --out android/app/src/main/res/mipmap-${d%%:*}/ic_launcher.png >/dev/null; done
sips -g pixelWidth android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png
```

Expected: `pixelWidth: 192`

- [ ] **Step 2: مفتاح التوقيع** (يبقى على الجهاز فقط)

```bash
cd "/Users/mac/Documents/lbienetre/nelook main/mobile/android" && PW=$(openssl rand -hex 16) && keytool -genkeypair -v -keystore newlook-release.jks -storetype JKS -keyalg RSA -keysize 2048 -validity 10000 -alias newlook -storepass "$PW" -keypass "$PW" -dname "CN=NewLook, O=NewLook, C=MA" >/dev/null 2>&1 && printf 'storePassword=%s\nkeyPassword=%s\nkeyAlias=newlook\nstoreFile=../newlook-release.jks\n' "$PW" "$PW" > key.properties && chmod 600 key.properties newlook-release.jks && git -C .. check-ignore -q android/key.properties android/newlook-release.jks && echo "keystore ready (ignored by git)"
```

Expected: `keystore ready (ignored by git)`

- [ ] **Step 3: التوقيع في `mobile/android/app/build.gradle`**

**أ) قبل `android {` أضف:**
```groovy
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

**ب) داخل `android {`، قبل `buildTypes {`، أضف:**
```groovy
    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
            storePassword keystoreProperties['storePassword']
        }
    }
```

**ج) داخل `buildTypes { release {`** استبدل السطر `signingConfig signingConfigs.debug` بـ:
```groovy
            signingConfig keystorePropertiesFile.exists() ? signingConfigs.release : signingConfigs.debug
```

- [ ] **Step 4: البناء** (حوالي 5 إلى 10 دقائق)

Run: `flutter build apk --release`
Expected: `✓ Built build/app/outputs/flutter-apk/app-release.apk`

- [ ] **Step 5: تحقق من التوقيع والمعرّف**

```bash
cd "/Users/mac/Documents/lbienetre/nelook main/mobile" && BT=$(ls -d ~/Library/Android/sdk/build-tools/* | sort -V | tail -1) && $BT/apksigner verify --print-certs build/app/outputs/flutter-apk/app-release.apk | grep -m1 "Signer #1 certificate DN" && $BT/aapt2 dump badging build/app/outputs/flutter-apk/app-release.apk | grep -E "^package:|application-label:" | head -2 && ls -lh build/app/outputs/flutter-apk/app-release.apk
```

Expected:
- `CN=NewLook, O=NewLook, C=MA`
- `package: name='ma.newlook.app'`
- `application-label:'نيولوك'`
- حجم الملف (حوالي 20 MB)

- [ ] **Step 6: Commit** (بدون المفتاح)

```bash
cd "/Users/mac/Documents/lbienetre/nelook main" && git add mobile/android/app/build.gradle mobile/android/app/src/main/res && git status --short | grep -E "jks|key.properties" ; git commit -m "feat(mobile): launcher icon and release signing

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

السطر `grep` يجب ألا يُظهر شيئاً، أي أن المفتاح لا يُرفع.

---

### Task 14: تحقق نهائي على الـ API الحقيقي

- [ ] **Step 1: التحليل والاختبارات**

Run: `cd mobile && flutter analyze && flutter test`
Expected: `No issues found!` و `All tests passed!`

- [ ] **Step 2: تأكد أن الـ API الحقيقي يعطي ما ينتظره التطبيق** (بعد Redeploy)

```bash
curl -s https://newlook.morosmartcitys.com/api/catalog | head -c 120; echo; curl -s "https://newlook.morosmartcitys.com/api/search" | head -c 200; echo
```

Expected:
- الأول يبدأ بـ `{"version":"2026-11-10.1"`.
- الثاني فيه `"categoryKey"`.
- إذا رجع `/api/catalog` بـ 404، فالسيرفر لم يُحدَّث بعد (Redeploy). التطبيق يعمل حينها بالسمة الاحتياطية.

- [ ] **Step 3: سلّم الـ APK**

انسخ الملف `mobile/build/app/outputs/flutter-apk/app-release.apk` إلى المستخدم. للتثبيت، ينقله إلى الهاتف ويفعّل "تثبيت من مصادر غير معروفة".
