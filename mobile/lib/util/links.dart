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
