import 'package:flutter/material.dart';

import '../api/models.dart';
import '../l10n/strings.dart';
import '../theme/category_theme.dart';

/// Price list: chalkboard (barber), menu (most), tiles (nails).
class PriceBoard extends StatelessWidget {
  const PriceBoard({super.key, required this.services, required this.variant, this.accentFont});
  final List<Service> services;
  final String variant;
  final String? accentFont;

  String _price(num p) => p == p.roundToDouble() ? p.toInt().toString() : p.toString();

  @override
  Widget build(BuildContext context) {
    final s = S.of(context);
    final theme = Theme.of(context);
    if (services.isEmpty) return Text(s.t('profile.noServices'), style: TextStyle(color: theme.colorScheme.onSurfaceVariant));
    if (variant == 'chalkboard') {
      const chalk = Color(0xFFF1EFE6);
      final accent = safeFont(accentFont, const TextStyle(color: chalk, fontSize: 16));
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: const Color(0xFF1F2A24), border: Border.all(color: const Color(0xFF5A3E2B), width: 8), borderRadius: BorderRadius.circular(6)),
        child: Column(children: [
          Text('— ${s.t('profile.prices')} —', style: accent),
          const SizedBox(height: 12),
          for (final sv in services)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Text(sv.name, style: const TextStyle(color: chalk)),
                  const SizedBox(width: 6),
                  const Expanded(child: Text('· · · · · · · · · · · · · · · · · · · · · ·', maxLines: 1, overflow: TextOverflow.clip, style: TextStyle(color: Color(0x88F1EFE6)))),
                  const SizedBox(width: 6),
                  Text('${_price(sv.price)} ${s.t('common.mad')}', style: accent?.copyWith(fontWeight: FontWeight.bold)),
                ]),
                Text('${sv.durationMinutes} ${s.t('common.min')}', style: const TextStyle(color: Color(0xAAF1EFE6), fontSize: 12)),
              ]),
            ),
        ]),
      );
    }
    if (variant == 'tiles') {
      return GridView.count(
        crossAxisCount: 2, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
        mainAxisSpacing: 10, crossAxisSpacing: 10, childAspectRatio: 1.4,
        children: [
          for (final sv in services)
            Card(child: Padding(padding: const EdgeInsets.all(10), child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
              Text(sv.name, textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.w600)),
              Text(_price(sv.price), style: theme.textTheme.headlineSmall?.copyWith(color: theme.colorScheme.primary)),
              Text('${s.t('common.mad')} · ${sv.durationMinutes} ${s.t('common.min')}', style: theme.textTheme.bodySmall),
            ]))),
        ],
      );
    }
    return Card(child: Column(children: [
      for (final (i, sv) in services.indexed) ...[
        if (i > 0) const Divider(height: 1),
        ListTile(
          title: Text(sv.name, style: const TextStyle(fontWeight: FontWeight.w600)),
          subtitle: Text('${sv.durationMinutes} ${s.t('common.min')}'),
          trailing: Text('${_price(sv.price)} ${s.t('common.mad')}', style: const TextStyle(fontWeight: FontWeight.bold)),
        ),
      ],
    ]));
  }
}
