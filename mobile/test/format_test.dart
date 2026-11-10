import 'package:flutter_test/flutter_test.dart';
import 'package:newlook/util/format.dart';

void main() {
  test('formatPrice drops trailing .0', () {
    expect(formatPrice(60.0), '60');
    expect(formatPrice(40.5), '40.5');
    expect(formatPrice(90), '90');
  });
}
