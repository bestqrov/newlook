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
