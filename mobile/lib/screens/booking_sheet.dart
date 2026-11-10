import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../api/models.dart';
import '../l10n/strings.dart';
import '../state/providers.dart';
import '../util/format.dart';
import '../util/links.dart';

class BookingSheet extends ConsumerStatefulWidget {
  const BookingSheet({super.key, required this.business, required this.services, this.preset, required this.needsAudience});
  final Business business;
  final List<Service> services;
  final List<String>? preset;
  final bool needsAudience;
  @override
  ConsumerState<BookingSheet> createState() => _BookingSheetState();
}

class _BookingSheetState extends ConsumerState<BookingSheet> {
  late String? _single = widget.services.isEmpty ? null : widget.services.first.id;
  late List<String>? _preset = widget.preset;
  String? _audience;
  int _day = 0;
  String? _slot;
  Future<List<String>>? _slots;
  final _name = TextEditingController();
  final _phone = TextEditingController();
  bool _busy = false;
  String _msg = '';
  bool _done = false;
  final _days = List.generate(14, (i) => DateTime.now().add(Duration(days: i)));

  List<String> get _ids => (_preset?.isNotEmpty ?? false) ? _preset! : [if (_single != null) _single!];
  bool get _ready => _ids.isNotEmpty && (!widget.needsAudience || _audience != null);

  @override
  void initState() {
    super.initState();
    _loadSlots();
  }

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    super.dispose();
  }

  void _loadSlots() {
    _slot = null;
    // 'en' keeps Latin digits (the API rejects Arabic-Indic digits).
    _slots = _ready ? ref.read(repositoryProvider).slots(widget.business.id, _ids, DateFormat('yyyy-MM-dd', 'en').format(_days[_day]), audience: widget.needsAudience ? _audience : null) : null;
  }

  Future<void> _submit() async {
    final s = S.of(context);
    if (_slot == null) return setState(() => _msg = s.t('book.pickSlot'));
    if (!isValidPhone(_phone.text)) return setState(() => _msg = s.t('err.invalid_phone'));
    setState(() { _busy = true; _msg = ''; });
    try {
      await ref.read(repositoryProvider).book(widget.business.id, serviceIds: _ids, startsAt: _slot!, name: _name.text.trim(), phone: _phone.text, audience: widget.needsAudience ? _audience : null);
      setState(() => _done = true);
    } catch (e) {
      setState(() { _msg = s.error(e); _loadSlots(); });
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = S.of(context);
    final theme = Theme.of(context);
    final chosen = [for (final id in _ids) ...widget.services.where((x) => x.id == id)];
    final dayFmt = DateFormat.E(s.lang);
    if (_done) {
      return Padding(padding: const EdgeInsets.all(24), child: Column(mainAxisSize: MainAxisSize.min, children: [
        Icon(Icons.check_circle, size: 56, color: theme.colorScheme.primary),
        const SizedBox(height: 12),
        Text(s.t('book.done'), textAlign: TextAlign.center),
        const SizedBox(height: 16),
        FilledButton(onPressed: () => Navigator.of(context).pop(), child: const Text('OK')),
      ]));
    }
    return Padding(
      padding: EdgeInsets.only(left: 16, right: 16, top: 16, bottom: MediaQuery.of(context).viewInsets.bottom + 16),
      child: SingleChildScrollView(child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Text(s.t('book.cta'), style: theme.textTheme.headlineSmall),
        const SizedBox(height: 12),
        if (_preset?.isNotEmpty ?? false)
          Card(child: ListTile(
            title: Text(chosen.map((x) => x.name).join(' + ')),
            subtitle: Text('${chosen.fold<int>(0, (n, x) => n + x.durationMinutes)} ${s.t('common.min')} · ${formatPrice(chosen.fold<num>(0, (n, x) => n + x.price))} ${s.t('common.mad')}'),
            trailing: TextButton(onPressed: () => setState(() { _preset = null; _loadSlots(); }), child: Text(s.t('book.change'))),
          ))
        else
          DropdownButtonFormField<String>(
            value: _single,
            isExpanded: true,
            items: [for (final x in widget.services) DropdownMenuItem(value: x.id, child: Text('${x.name} — ${formatPrice(x.price)} ${s.t('common.mad')} · ${x.durationMinutes} ${s.t('common.min')}', overflow: TextOverflow.ellipsis))],
            onChanged: (v) => setState(() { _single = v; _loadSlots(); }),
          ),
        if (widget.needsAudience) ...[
          const SizedBox(height: 12),
          SegmentedButton<String>(
            segments: [ButtonSegment(value: 'women', label: Text(s.t('aud.women'))), ButtonSegment(value: 'men', label: Text(s.t('aud.men')))],
            selected: {if (_audience != null) _audience!},
            emptySelectionAllowed: true,
            onSelectionChanged: (v) => setState(() { _audience = v.isEmpty ? null : v.first; _loadSlots(); }),
          ),
        ],
        const SizedBox(height: 12),
        SizedBox(height: 64, child: ListView.separated(
          scrollDirection: Axis.horizontal,
          itemCount: _days.length,
          separatorBuilder: (_, __) => const SizedBox(width: 6),
          itemBuilder: (_, i) => ChoiceChip(
            label: Column(mainAxisSize: MainAxisSize.min, children: [Text(dayFmt.format(_days[i]), style: const TextStyle(fontSize: 11)), Text('${_days[i].day}', style: const TextStyle(fontWeight: FontWeight.bold))]),
            selected: i == _day,
            onSelected: (_) => setState(() { _day = i; _loadSlots(); }),
          ),
        )),
        const SizedBox(height: 8),
        if (!_ready)
          Text(s.t('book.chooseAudience'))
        else
          FutureBuilder<List<String>>(
            future: _slots,
            builder: (context, snap) {
              if (snap.connectionState != ConnectionState.done) return const Padding(padding: EdgeInsets.all(16), child: Center(child: CircularProgressIndicator()));
              if (snap.hasError) return Text(s.error(snap.error!));
              final slots = snap.data ?? const [];
              if (slots.isEmpty) return Text(s.t('book.noSlots'));
              return Wrap(spacing: 6, runSpacing: 6, children: [
                for (final iso in slots)
                  ChoiceChip(label: Text(DateFormat.Hm('en').format(DateTime.parse(iso).toLocal())), selected: _slot == iso, onSelected: (_) => setState(() => _slot = iso)),
              ]);
            },
          ),
        const SizedBox(height: 12),
        TextField(controller: _name, textInputAction: TextInputAction.next, decoration: InputDecoration(labelText: s.t('form.name'))),
        const SizedBox(height: 8),
        TextField(controller: _phone, keyboardType: TextInputType.phone, decoration: InputDecoration(labelText: s.t('form.phone'))),
        const SizedBox(height: 8),
        Text(s.t('book.cash'), style: theme.textTheme.bodySmall),
        const SizedBox(height: 12),
        FilledButton(onPressed: _busy ? null : _submit, child: Text(s.t('book.confirm'))),
        if (_msg.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 8), child: Text(_msg, style: TextStyle(color: theme.colorScheme.error))),
      ])),
    );
  }
}
