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
