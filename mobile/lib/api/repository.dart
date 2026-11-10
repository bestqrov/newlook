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
  Future<void> leaveQueue(QueueTicket t) async {
    await api.post('/api/queue/${t.id}/cancel', {'token': t.token});
  }

  // ─── Pro ───
  /// "ok", or "mfa" for admin accounts (not allowed in the app).
  Future<String> login(String email, String password) async {
    final d = await api.post('/api/auth/login', {'email': email.trim(), 'password': password});
    return d['mfa'] != null ? 'mfa' : 'ok';
  }

  Future<void> logout() async {
    await api.post('/api/auth/logout');
  }
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
  Future<void> serve(String id) async {
    await api.post('/api/me/queue/$id/serve');
  }
  Future<void> noShow(String id) async {
    await api.post('/api/me/queue/$id/no-show');
  }

  Future<List<ProBooking>> myBookings() async => ((await api.get('/api/me/bookings'))['bookings'] as List? ?? []).whereType<Map<String, dynamic>>().map(ProBooking.fromJson).toList();
  Future<void> setBookingStatus(String id, String status) async {
    await api.patch('/api/me/bookings/$id', {'status': status});
  }
}
