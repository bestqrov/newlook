import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../api/models.dart';
import '../api/repository.dart';

/// Overridden in main() once the HTTP client and preferences are ready.
final repositoryProvider = Provider<Repository>((ref) => throw UnimplementedError('repositoryProvider'));
final prefsProvider = Provider<SharedPreferences>((ref) => throw UnimplementedError('prefsProvider'));

/// Loaded once per app start.
final catalogProvider = FutureProvider<Catalog>((ref) => ref.watch(repositoryProvider).catalog());

/// The client's current walk-in ticket (one at a time), kept across restarts.
class TicketNotifier extends StateNotifier<QueueTicket?> {
  TicketNotifier(this.prefs) : super(_read(prefs));
  final SharedPreferences prefs;
  static const storageKey = 'queue_ticket';

  static QueueTicket? _read(SharedPreferences p) {
    final raw = p.getString(storageKey);
    if (raw == null) return null;
    try {
      return QueueTicket.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }

  Future<void> set(QueueTicket? ticket) async {
    state = ticket;
    if (ticket == null) {
      await prefs.remove(storageKey);
    } else {
      await prefs.setString(storageKey, jsonEncode(ticket.toJson()));
    }
  }
}

final ticketProvider = StateNotifierProvider<TicketNotifier, QueueTicket?>((ref) => TicketNotifier(ref.watch(prefsProvider)));
