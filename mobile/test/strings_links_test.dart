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
