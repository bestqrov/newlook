import 'package:flutter/material.dart';

import '../l10n/strings.dart';

/// Error box with a retry button (network or API error).
class ErrorRetry extends StatelessWidget {
  const ErrorRetry({super.key, required this.error, required this.onRetry});
  final Object error;
  final VoidCallback onRetry;
  @override
  Widget build(BuildContext context) {
    final s = S.of(context);
    return Padding(padding: const EdgeInsets.all(24), child: Column(mainAxisSize: MainAxisSize.min, children: [
      Text(s.error(error), textAlign: TextAlign.center),
      const SizedBox(height: 12),
      OutlinedButton(onPressed: onRetry, child: Text(s.t('common.retry'))),
    ]));
  }
}
