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
