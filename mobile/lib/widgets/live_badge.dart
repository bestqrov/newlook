import 'package:flutter/material.dart';

import '../api/models.dart';
import '../l10n/strings.dart';

/// Live status pill. Nothing is shown when the status is unknown / stale.
class LiveBadge extends StatelessWidget {
  const LiveBadge({super.key, required this.live});
  final Live? live;

  @override
  Widget build(BuildContext context) {
    final l = live;
    if (l == null || l.state == 'unknown') return const SizedBox.shrink();
    final s = S.of(context);
    final (bg, fg) = switch (l.state) {
      'free' || 'quiet' => (const Color(0xFF15803D), Colors.white),
      'busy' || 'moderate' => (const Color(0xFFF59E0B), Colors.black),
      'crowded' => (const Color(0xFFDC2626), Colors.white),
      _ => (const Color(0xFF404040), Colors.white),
    };
    final text = switch (l.state) {
      'free' => s.t('live.free'),
      'busy' => l.waiting > 0 ? s.t('live.waiting', {'n': l.waiting, 'm': l.estimatedWaitMinutes ?? 0}) : s.t('live.busy'),
      'quiet' => s.t('live.quiet'),
      'moderate' => s.t('live.moderate'),
      'crowded' => s.t('live.crowded'),
      _ => s.t('live.closed'),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(99)),
      child: Text(text, style: TextStyle(color: fg, fontSize: 12, fontWeight: FontWeight.w600)),
    );
  }
}
