import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../api/models.dart';
import '../l10n/strings.dart';
import '../state/providers.dart';
import '../util/links.dart';

class WalkinQueueCard extends ConsumerStatefulWidget {
  const WalkinQueueCard({super.key, required this.business});
  final Business business;
  @override
  ConsumerState<WalkinQueueCard> createState() => _WalkinQueueCardState();
}

class _WalkinQueueCardState extends ConsumerState<WalkinQueueCard> {
  final _name = TextEditingController();
  final _phone = TextEditingController();
  bool _busy = false;
  String _msg = '';

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    super.dispose();
  }

  Future<void> _join() async {
    final s = S.of(context);
    if (_name.text.trim().length < 2) return setState(() => _msg = s.t('err.invalid_input'));
    if (!isValidPhone(_phone.text)) return setState(() => _msg = s.t('err.invalid_phone'));
    setState(() { _busy = true; _msg = ''; });
    try {
      final (ticket, _) = await ref.read(repositoryProvider).joinQueue(widget.business, name: _name.text.trim(), phone: _phone.text);
      await ref.read(ticketProvider.notifier).set(ticket);
      if (mounted) context.push('/ticket');
    } catch (e) {
      if (mounted) setState(() => _msg = s.error(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = S.of(context);
    final ticket = ref.watch(ticketProvider);
    final closed = widget.business.live?.state == 'closed';
    return Card(child: Padding(padding: const EdgeInsets.all(12), child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      Text('👥 ${s.t('queue.title')}', style: Theme.of(context).textTheme.titleLarge),
      const SizedBox(height: 8),
      if (ticket != null && ticket.businessId == widget.business.id)
        FilledButton(onPressed: () => context.push('/ticket'), child: Text(s.t('queue.open')))
      else if (closed)
        Text(s.t('queue.closed'))
      else ...[
        Text(s.t('queue.intro')),
        const SizedBox(height: 8),
        TextField(controller: _name, decoration: InputDecoration(labelText: s.t('form.name'))),
        const SizedBox(height: 8),
        TextField(controller: _phone, keyboardType: TextInputType.phone, decoration: InputDecoration(labelText: s.t('form.phone'))),
        const SizedBox(height: 8),
        FilledButton(onPressed: _busy ? null : _join, child: Text(s.t('queue.title'))),
        if (_msg.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 8), child: Text(_msg, style: TextStyle(color: Theme.of(context).colorScheme.error))),
      ],
    ])));
  }
}
