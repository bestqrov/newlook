import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:newlook/api/client.dart';
import 'package:newlook/api/models.dart';
import 'package:newlook/api/repository.dart';

void main() {
  Repository failing() {
    final dio = Dio(BaseOptions(baseUrl: 'http://localhost'));
    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (o, h) => h.reject(DioException(requestOptions: o, type: DioExceptionType.connectionError)),
    ));
    return Repository(ApiClient(dio));
  }

  test('void API methods can be safely caught with catchError', () async {
    final repo = failing();
    const ticket = QueueTicket(businessId: 'b', id: 't', token: 'k', businessName: 'n');
    await repo.leaveQueue(ticket).catchError((_) {});
    await expectLater(repo.logout(), throwsA(isA<ApiException>().having((e) => e.code, 'code', 'network')));
  });
}
