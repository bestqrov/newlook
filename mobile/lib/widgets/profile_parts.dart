import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../api/models.dart';
import '../config.dart';
import '../l10n/strings.dart';

/// Category pattern (e.g. barber pole) repeated across the width, 12 px high.
class HeaderPattern extends StatelessWidget {
  const HeaderPattern({super.key, required this.path});
  final String path;
  @override
  Widget build(BuildContext context) => SizedBox(
        height: 12,
        child: LayoutBuilder(builder: (context, c) {
          final n = (c.maxWidth / 48).ceil() + 1;
          return ClipRect(child: OverflowBox(alignment: AlignmentDirectional.centerStart, maxWidth: n * 48.0, child: Row(children: [
            for (var i = 0; i < n; i++) SvgPicture.network(resolveUrl(path), width: 48, height: 12, fit: BoxFit.fill),
          ])));
        }),
      );
}

class AmenityChips extends StatelessWidget {
  const AmenityChips({super.key, required this.keys, required this.catalog});
  final List<String> keys;
  final Catalog? catalog;
  static const _icons = {
    'ac': Icons.ac_unit, 'wifi': Icons.wifi, 'kids': Icons.child_care, 'card': Icons.credit_card, 'parking': Icons.local_parking,
    'accessible': Icons.accessible, 'towels': Icons.dry_cleaning, 'private_room': Icons.lock, 'female_staff': Icons.face_3,
  };
  @override
  Widget build(BuildContext context) {
    final c = catalog;
    if (keys.isEmpty || c == null) return const SizedBox.shrink();
    final lang = S.of(context).lang;
    return Wrap(spacing: 6, runSpacing: 6, children: [
      for (final k in keys) Chip(avatar: Icon(_icons[k] ?? Icons.check, size: 16), label: Text(c.amenityLabel(k, lang)), visualDensity: VisualDensity.compact),
    ]);
  }
}

class GenderScheduleBar extends StatelessWidget {
  const GenderScheduleBar({super.key, required this.business});
  final Business business;
  @override
  Widget build(BuildContext context) {
    final s = S.of(context);
    final sched = business.genderSchedule;
    if (sched.isEmpty) return const SizedBox.shrink();
    final cur = business.currentAudience;
    final days = [1, 2, 3, 4, 5, 6, 0].where((d) => sched.any((r) => r.weekday == d));
    return Card(child: ExpansionTile(
      title: Text(cur == null ? s.t('sched.none') : s.t('sched.now', {'a': s.t('aud.${cur.now}'), 't': cur.until}), style: const TextStyle(fontWeight: FontWeight.bold)),
      subtitle: cur?.next == null ? Text(s.t('sched.week')) : Text(s.t('sched.next', {'a': s.t('aud.${cur!.next}')})),
      children: [
        for (final d in days)
          ListTile(dense: true, title: Text(s.day(d)), subtitle: Text(
            (sched.where((r) => r.weekday == d).toList()..sort((a, b) => a.start.compareTo(b.start))).map((r) => '${r.start}–${r.end} ${s.t('aud.${r.audience}')}').join('   '),
          )),
      ],
    ));
  }
}

class RitualBuilder extends StatefulWidget {
  const RitualBuilder({super.key, required this.services, required this.ritualSteps, required this.onChoose});
  final List<Service> services;
  final List<String> ritualSteps;
  final ValueChanged<List<String>> onChoose;
  @override
  State<RitualBuilder> createState() => _RitualBuilderState();
}

class _RitualBuilderState extends State<RitualBuilder> {
  late final List<Service> steps = [for (final id in widget.ritualSteps) ...widget.services.where((s) => s.id == id)];
  late final Set<String> picked = {if (steps.isNotEmpty) steps.first.id};

  @override
  Widget build(BuildContext context) {
    if (steps.length < 2) return const SizedBox.shrink();
    final s = S.of(context);
    final chosen = steps.where((x) => picked.contains(x.id)).toList();
    final minutes = chosen.fold<int>(0, (n, x) => n + x.durationMinutes);
    final price = chosen.fold<num>(0, (n, x) => n + x.price);
    return Card(child: Padding(padding: const EdgeInsets.all(12), child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      Text('✨ ${s.t('ritual.title')}', style: Theme.of(context).textTheme.titleLarge),
      for (final (i, x) in steps.indexed)
        CheckboxListTile(
          value: picked.contains(x.id),
          onChanged: (v) => setState(() => v == true ? picked.add(x.id) : picked.remove(x.id)),
          title: Text('${i + 1}. ${x.name}'),
          subtitle: Text('${x.durationMinutes} ${s.t('common.min')} · ${x.price} ${s.t('common.mad')}'),
          controlAffinity: ListTileControlAffinity.leading,
        ),
      Text(s.t('ritual.total', {'n': chosen.length, 'm': minutes, 'p': price})),
      const SizedBox(height: 8),
      FilledButton(onPressed: chosen.isEmpty ? null : () => widget.onChoose(chosen.map((x) => x.id).toList()), child: Text(s.t('ritual.pick'))),
    ])));
  }
}

class BringList extends StatelessWidget {
  const BringList({super.key, required this.items});
  final List<BringItem> items;
  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) return const SizedBox.shrink();
    final s = S.of(context);
    return Card(child: Padding(padding: const EdgeInsets.all(12), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(s.t('bring.title'), style: Theme.of(context).textTheme.titleLarge),
      for (final it in items)
        ListTile(dense: true, leading: const Icon(Icons.check), title: Text(it.label), trailing: it.available ? Chip(label: Text(s.t('bring.available')), visualDensity: VisualDensity.compact) : null),
    ])));
  }
}
