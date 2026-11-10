import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../api/client.dart';
import '../api/models.dart';
import '../l10n/strings.dart';
import '../state/providers.dart';

class TicketScreen extends ConsumerStatefulWidget {
  const TicketScreen({super.key});
  @override
  ConsumerState<TicketScreen> createState() => _TicketScreenState();
}

class _TicketScreenState extends ConsumerState<TicketScreen> {
  QueueStatus? _status;
  String _final = '';
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _refresh();
    _timer = Timer.periodic(const Duration(seconds: 30), (_) => _refresh());
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _refresh() async {
    final ticket = ref.read(ticketProvider);
    if (ticket == null) return;
    try {
      final st = await ref.read(repositoryProvider).queueStatus(ticket);
      if (!mounted) return;
      if (st.status != 'waiting') {
        await ref.read(ticketProvider.notifier).set(null);
        if (mounted) setState(() => _final = st.status == 'served' ? 'queue.served' : 'queue.left');
      } else {
        setState(() => _status = st);
      }
    } on ApiException catch (e) {
      if (e.status == 404) {
        await ref.read(ticketProvider.notifier).set(null);
        if (mounted) setState(() => _final = 'queue.left');
      }
    } catch (_) {/* network blip: try again next tick */}
  }

  Future<void> _leave() async {
    final ticket = ref.read(ticketProvider);
    if (ticket != null) {
      try {
        await ref.read(repositoryProvider).leaveQueue(ticket);
      } catch (_) {/* clear locally anyway */}
    }
    await ref.read(ticketProvider.notifier).set(null);
    if (mounted) setState(() => _final = 'queue.left');
  }

  @override
  Widget build(BuildContext context) {
    final s = S.of(context);
    final theme = Theme.of(context);
    final ticket = ref.watch(ticketProvider);
    final st = _status;
    return Scaffold(
      appBar: AppBar(title: Text(s.t('ticket.title'))),
      body: Center(child: Padding(padding: const EdgeInsets.all(24), child: _final.isNotEmpty
          ? Text(s.t(_final), style: theme.textTheme.titleLarge, textAlign: TextAlign.center)
          : ticket == null
              ? Text(s.t('queue.none'))
              : Column(mainAxisSize: MainAxisSize.min, children: [
                  Text(ticket.businessName, style: theme.textTheme.titleLarge),
                  const SizedBox(height: 16),
                  Text(s.t('queue.youAre')),
                  Text(st?.position?.toString() ?? '…', style: theme.textTheme.displayLarge?.copyWith(color: theme.colorScheme.primary, fontWeight: FontWeight.bold)),
                  if (st != null) Text(st.position == 1 ? s.t('queue.next') : s.t('queue.about', {'m': st.estimatedWaitMinutes ?? 0}), textAlign: TextAlign.center),
                  const SizedBox(height: 24),
                  OutlinedButton(onPressed: _leave, child: Text(s.t('queue.leave'))),
                ]))),
    );
  }
}
