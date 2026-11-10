import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../api/client.dart';
import '../api/models.dart';
import '../config.dart';
import '../l10n/strings.dart';
import '../state/providers.dart';
import '../util/format.dart';
import '../widgets/live_badge.dart';

/// Login form, or the pro dashboard when a session exists.
class ProScreen extends ConsumerStatefulWidget {
  const ProScreen({super.key});
  @override
  ConsumerState<ProScreen> createState() => _ProScreenState();
}

class _ProScreenState extends ConsumerState<ProScreen> {
  bool _loading = true;
  ProBusiness? _business;
  bool _signedIn = false;
  final _email = TextEditingController();
  final _password = TextEditingController();
  String _msg = '';
  bool _busy = false;
  bool _loggingOut = false;

  @override
  void initState() {
    super.initState();
    _check();
  }

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _check() async {
    final repo = ref.read(repositoryProvider);
    try {
      _signedIn = await repo.signedIn();
      _business = _signedIn ? await repo.myBusiness() : null;
    } catch (_) {
      _signedIn = false;
    }
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _login() async {
    final s = S.of(context);
    setState(() { _busy = true; _msg = ''; });
    try {
      final r = await ref.read(repositoryProvider).login(_email.text, _password.text);
      if (r == 'mfa') {
        if (mounted) setState(() => _msg = s.t('pro.mfa'));
      } else {
        await _check();
      }
    } catch (e) {
      if (mounted) setState(() => _msg = s.error(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _logout() async {
    if (_loggingOut) return;
    _loggingOut = true;
    try {
      await ref.read(repositoryProvider).logout().catchError((_) {});
      if (mounted) setState(() { _signedIn = false; _business = null; });
    } finally {
      _loggingOut = false;
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = S.of(context);
    if (_loading) return Scaffold(appBar: AppBar(title: Text(s.t('pro.title'))), body: const Center(child: CircularProgressIndicator()));
    if (_signedIn && _business != null) return _ProDashboard(business: _business!, onLogout: _logout);
    return Scaffold(
      appBar: AppBar(title: Text(s.t('pro.title'))),
      body: ListView(padding: const EdgeInsets.all(24), children: [
        if (_signedIn) ...[
          Text(s.t('pro.noBusiness')),
          const SizedBox(height: 12),
          FilledButton(onPressed: () => launchUrl(Uri.parse('$apiBase/pro'), mode: LaunchMode.externalApplication), child: Text(s.t('pro.openSite'))),
          TextButton(onPressed: _logout, child: Text(s.t('pro.logout'))),
        ] else ...[
          TextField(controller: _email, keyboardType: TextInputType.emailAddress, autofillHints: const [AutofillHints.email], decoration: InputDecoration(labelText: s.t('pro.email'))),
          const SizedBox(height: 12),
          TextField(controller: _password, obscureText: true, autofillHints: const [AutofillHints.password], decoration: InputDecoration(labelText: s.t('pro.password'))),
          const SizedBox(height: 16),
          FilledButton(onPressed: _busy ? null : _login, child: Text(s.t('pro.login'))),
          if (_msg.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 12), child: Text(_msg, style: TextStyle(color: Theme.of(context).colorScheme.error))),
        ],
      ]),
    );
  }
}

class _ProDashboard extends ConsumerStatefulWidget {
  const _ProDashboard({required this.business, required this.onLogout});
  final ProBusiness business;
  final Future<void> Function() onLogout;
  @override
  ConsumerState<_ProDashboard> createState() => _ProDashboardState();
}

class _ProDashboardState extends ConsumerState<_ProDashboard> {
  late Live? _live = widget.business.live;
  List<QueueEntry> _queue = const [];
  List<ProBooking> _bookings = const [];
  String _msg = '';
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _refresh();
    _timer = Timer.periodic(const Duration(seconds: 20), (_) => _refresh());
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  bool get _hasQueue => ref.read(catalogProvider).valueOrNull?.categoryOf(widget.business.category).has('walkin_queue') ?? false;

  Future<void> _logout() async {
    _timer?.cancel();
    await widget.onLogout();
  }

  Future<void> _refresh() async {
    final repo = ref.read(repositoryProvider);
    try {
      await ref.read(catalogProvider.future);
    } catch (_) {/* catalog failure tolerated */}
    if (!mounted) return;
    try {
      final bookings = await repo.myBookings();
      if (!mounted) return;
      setState(() {
        final cutoff = DateTime.now().subtract(const Duration(hours: 12));
        _bookings = bookings.where((b) => b.startsAt.isAfter(cutoff) && (b.status == 'pending' || b.status == 'confirmed')).toList();
      });
    } on ApiException catch (e) {
      if (e.status == 401) {
        _logout();
        return;
      }
    } catch (_) {/* keep last data; retry next tick */}
    if (!mounted || !_hasQueue) return;
    try {
      final queue = await repo.myQueue();
      if (!mounted) return;
      setState(() => _queue = queue);
    } on ApiException catch (e) {
      if (e.status == 401) _logout();
    } catch (_) {/* keep last data; retry next tick */}
  }

  Future<void> _run(Future<void> Function() action) async {
    try {
      await action();
      if (mounted) setState(() => _msg = '');
    } on ApiException catch (e) {
      if (e.status == 401) {
        _logout();
        return;
      }
      if (mounted) setState(() => _msg = S.of(context).error(e));
    } catch (e) {
      if (mounted) setState(() => _msg = S.of(context).error(e));
    }
    if (!mounted) return;
    await _refresh();
  }

  Future<void> _setLive(String state) => _run(() async {
        final l = await ref.read(repositoryProvider).setLive(state);
        if (mounted) setState(() => _live = l);
      });

  @override
  Widget build(BuildContext context) {
    final s = S.of(context);
    final theme = Theme.of(context);
    final repo = ref.read(repositoryProvider);
    final cat = ref.watch(catalogProvider).valueOrNull?.categoryOf(widget.business.category);
    final states = cat?.liveStates ?? const <String>[];
    final time = DateFormat('dd/MM HH:mm', 'en');
    return Scaffold(
      appBar: AppBar(title: Text(widget.business.name), actions: [IconButton(onPressed: _logout, icon: const Icon(Icons.logout), tooltip: s.t('pro.logout'))]),
      body: RefreshIndicator(onRefresh: _refresh, child: ListView(physics: const AlwaysScrollableScrollPhysics(), padding: const EdgeInsets.all(16), children: [
        if (_msg.isNotEmpty) Padding(padding: const EdgeInsets.only(bottom: 8), child: Text(_msg, style: TextStyle(color: theme.colorScheme.error))),
        if (states.isNotEmpty) ...[
          Row(children: [Expanded(child: Text(s.t('pro.status'), style: theme.textTheme.titleLarge)), LiveBadge(live: _live)]),
          const SizedBox(height: 8),
          GridView.count(crossAxisCount: 2, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(), childAspectRatio: 2.6, mainAxisSpacing: 8, crossAxisSpacing: 8, children: [
            for (final st in states)
              _live?.state == st
                  ? FilledButton(onPressed: () => _setLive(st), child: Text(s.t('state.$st'), style: const TextStyle(fontSize: 18)))
                  : OutlinedButton(onPressed: () => _setLive(st), child: Text(s.t('state.$st'), style: const TextStyle(fontSize: 18))),
          ]),
          const SizedBox(height: 24),
        ],
        if (_hasQueue) ...[
          Text(s.t('pro.queue', {'n': _queue.length}), style: theme.textTheme.titleLarge),
          if (_queue.isEmpty) Text(s.t('pro.queueEmpty')),
          for (final (i, e) in _queue.indexed)
            Card(child: ListTile(
              leading: CircleAvatar(child: Text('${i + 1}')),
              title: Text(e.name),
              subtitle: Text('${e.phone} · ${DateFormat.Hm('en').format(e.createdAt)}'),
              trailing: Wrap(spacing: 4, children: [
                FilledButton(onPressed: () => _run(() => repo.serve(e.id)), child: Text(s.t('pro.served'))),
                OutlinedButton(onPressed: () => _run(() => repo.noShow(e.id)), child: Text(s.t('pro.noShow'))),
              ]),
            )),
          const SizedBox(height: 24),
        ],
        Text(s.t('pro.bookings'), style: theme.textTheme.titleLarge),
        if (_bookings.isEmpty) Text(s.t('pro.noBookings')),
        for (final b in _bookings)
          Card(child: Padding(padding: const EdgeInsets.all(12), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [Expanded(child: Text(b.clientName, style: const TextStyle(fontWeight: FontWeight.bold))), Text(s.t('bstatus.${b.status}'))]),
            Text('${b.serviceName} · ${formatPrice(b.price)} ${s.t('common.mad')} · ${time.format(b.startsAt)}'),
            InkWell(onTap: () => launchUrl(Uri(scheme: 'tel', path: b.clientPhone)), child: Text(b.clientPhone, style: TextStyle(color: theme.colorScheme.primary))),
            Wrap(spacing: 8, children: [
              if (b.status == 'pending') FilledButton(onPressed: () => _run(() => repo.setBookingStatus(b.id, 'confirmed')), child: Text(s.t('pro.confirm'))),
              if (b.status == 'confirmed') OutlinedButton(onPressed: () => _run(() => repo.setBookingStatus(b.id, 'done')), child: Text(s.t('pro.done'))),
              TextButton(onPressed: () => _run(() => repo.setBookingStatus(b.id, 'cancelled')), child: Text(s.t('pro.cancel'))),
            ]),
          ]))),
        const SizedBox(height: 24),
        OutlinedButton.icon(onPressed: () => launchUrl(Uri.parse('$apiBase/pro'), mode: LaunchMode.externalApplication), icon: const Icon(Icons.open_in_new), label: Text(s.t('pro.editOnSite'))),
      ])),
    );
  }
}
