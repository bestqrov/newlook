import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:newlook/api/models.dart';
import 'package:newlook/widgets/live_badge.dart';
import 'package:newlook/widgets/price_board.dart';

Widget wrap(Widget child, {Locale locale = const Locale('ar')}) => MaterialApp(
      locale: locale,
      supportedLocales: const [Locale('ar'), Locale('fr')],
      localizationsDelegates: const [GlobalMaterialLocalizations.delegate, GlobalWidgetsLocalizations.delegate, GlobalCupertinoLocalizations.delegate],
      home: Scaffold(body: child),
    );

void main() {
  testWidgets('LiveBadge texts per state; unknown renders nothing', (t) async {
    await t.pumpWidget(wrap(const LiveBadge(live: Live(state: 'free', waiting: 0, stale: false))));
    expect(find.text('فاضي دابا'), findsOneWidget);
    await t.pumpWidget(wrap(const LiveBadge(live: Live(state: 'busy', waiting: 3, estimatedWaitMinutes: 45, stale: false))));
    expect(find.text('3 فالانتظار ≈ 45 دقيقة'), findsOneWidget);
    await t.pumpWidget(wrap(const LiveBadge(live: Live(state: 'crowded', waiting: 0, stale: false)), locale: const Locale('fr')));
    expect(find.text('Très fréquenté'), findsOneWidget);
    await t.pumpWidget(wrap(const LiveBadge(live: Live(state: 'unknown', waiting: 0, stale: true))));
    expect(find.byType(Text), findsNothing);
  });

  const services = [Service(id: 'a', name: 'قصة فيد', price: 60, durationMinutes: 30), Service(id: 'b', name: 'لحية', price: 40, durationMinutes: 20)];

  for (final variant in ['chalkboard', 'menu', 'tiles']) {
    testWidgets('PriceBoard $variant shows every service and price', (t) async {
      await t.pumpWidget(wrap(SingleChildScrollView(child: PriceBoard(services: services, variant: variant))));
      expect(find.textContaining('قصة فيد'), findsOneWidget);
      expect(find.textContaining('60'), findsWidgets);
      expect(find.textContaining('لحية'), findsOneWidget);
    });
  }

  testWidgets('PriceBoard empty message', (t) async {
    await t.pumpWidget(wrap(const PriceBoard(services: [], variant: 'menu')));
    expect(find.text('الخدمات غادي تزاد قريباً.'), findsOneWidget);
  });
}
