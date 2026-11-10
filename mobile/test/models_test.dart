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
