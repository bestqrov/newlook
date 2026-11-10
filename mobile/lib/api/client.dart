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
