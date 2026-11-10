import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'screens/home_screen.dart';
import 'screens/pro_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/ticket_screen.dart';
import 'state/providers.dart';
import 'theme/category_theme.dart';

final _router = GoRouter(routes: [
  GoRoute(path: '/', builder: (_, __) => const HomeScreen()),
  GoRoute(path: '/b/:id', builder: (_, st) => ProfileScreen(id: st.pathParameters['id']!)),
  GoRoute(path: '/ticket', builder: (_, __) => const TicketScreen()),
  GoRoute(path: '/pro', builder: (_, __) => const ProScreen()),
]);

class NewlookApp extends ConsumerWidget {
  const NewlookApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final catalog = ref.watch(catalogProvider).valueOrNull;
    return MaterialApp.router(
      title: 'NewLook',
      debugShowCheckedModeBanner: false,
      theme: themeFor(catalog?.fallback.theme ?? fallbackCategoryTheme),
      routerConfig: _router,
      supportedLocales: const [Locale('ar'), Locale('fr')],
      localizationsDelegates: const [GlobalMaterialLocalizations.delegate, GlobalWidgetsLocalizations.delegate, GlobalCupertinoLocalizations.delegate],
      // French phones get French, everybody else Arabic (RTL).
      localeResolutionCallback: (device, _) => device?.languageCode == 'fr' ? const Locale('fr') : const Locale('ar'),
    );
  }
}
