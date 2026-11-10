import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../api/models.dart';
import '../config.dart';
import '../l10n/strings.dart';
import '../state/providers.dart';
import '../theme/category_theme.dart';
import '../util/links.dart';
import '../values.dart';
import '../widgets/async_view.dart';
import '../widgets/live_badge.dart';
import '../widgets/price_board.dart';
import '../widgets/profile_parts.dart';
import '../widgets/walkin_queue_card.dart';
import 'booking_sheet.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key, required this.id});
  final String id;
  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  Profile? _data;
  Object? _error;
  Timer? _timer;
  String? _tag;

  @override
  void initState() {
    super.initState();
    _load();
    // Live status changes during the day: refresh every minute.
    _timer = Timer.periodic(const Duration(seconds: 60), (_) => _load(silent: true));
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _load({bool silent = false}) async {
    try {
      final p = await ref.read(repositoryProvider).profile(widget.id);
      if (mounted) setState(() { _data = p; _error = null; });
    } catch (e) {
      if (mounted && !silent) setState(() => _error = e);
    }
  }

  void _book(BuildContext context, Profile p, CategoryDef? cat, [List<String>? preset]) {
    final theme = Theme.of(context);
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => Theme(data: theme, child: BookingSheet(
        business: p.business, services: p.services, preset: preset,
        needsAudience: (cat?.has('gender_schedule') ?? false) && p.business.genderSchedule.isNotEmpty,
      )),
    );
  }

  @override
  Widget build(BuildContext context) {
    final catalog = ref.watch(catalogProvider).valueOrNull;
    final p = _data;
    if (p == null) {
      return Scaffold(appBar: AppBar(), body: Center(child: _error != null ? ErrorRetry(error: _error!, onRetry: _load) : const CircularProgressIndicator()));
    }
    final cat = catalog?.categoryOf(p.business.category);
    return Theme(
      data: cat != null ? themeFor(cat.theme) : Theme.of(context),
      child: Builder(builder: (context) => _body(context, p, cat, catalog)),
    );
  }

  Widget _body(BuildContext context, Profile p, CategoryDef? cat, Catalog? catalog) {
    final s = S.of(context);
    final theme = Theme.of(context);
    final b = p.business;
    final ts = b.todayStatus;
    final today = ts.openNow
        ? s.t('profile.openUntil', {'t': ts.closesAt})
        : ts.nextOpenWeekday != null
            ? s.t('profile.closedOpens', {'d': s.day(ts.nextOpenWeekday!), 't': ts.nextOpenTime})
            : s.t('profile.noHours');
    final wa = whatsappUri(b.phone, s.t('profile.waText', {'name': b.name}));
    final has = cat?.has ?? (String _) => false;
    final usedTags = (cat?.styleTags ?? const <StyleTag>[]).where((t) => p.works.any((w) => w.tags.contains(t.key))).toList();
    final works = _tag == null ? p.works : p.works.where((w) => w.tags.contains(_tag)).toList();
    const gap = SizedBox(height: 16);

    return Scaffold(
      appBar: AppBar(title: Text(b.name, overflow: TextOverflow.ellipsis)),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(physics: const AlwaysScrollableScrollPhysics(), children: [
          if (cat?.theme.headerPattern != null) HeaderPattern(path: cat!.theme.headerPattern!),
          Padding(padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(cat?.label(s.lang) ?? b.category, style: TextStyle(color: theme.colorScheme.primary, fontWeight: FontWeight.w600)),
            Text(b.name, style: theme.textTheme.headlineMedium),
            const SizedBox(height: 8),
            Wrap(spacing: 8, runSpacing: 6, crossAxisAlignment: WrapCrossAlignment.center, children: [
              LiveBadge(live: b.live),
              Text('🕒 $today'),
              Text('📍 ${[b.address.district, cityLabel(b.city, s.lang)].where((x) => x.isNotEmpty).join(' · ')}'),
            ]),
            if (b.address.line.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 4), child: Text(b.address.line, style: TextStyle(color: theme.colorScheme.onSurfaceVariant))),
            if (b.bio.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 12), child: Text(b.bio)),
            const SizedBox(height: 12),
            AmenityChips(keys: b.amenities, catalog: catalog),
            const SizedBox(height: 12),
            Wrap(spacing: 8, runSpacing: 8, children: [
              FilledButton.icon(onPressed: () => launchUrl(directionsUri(b), mode: LaunchMode.externalApplication), icon: const Icon(Icons.navigation), label: Text(s.t('profile.directions'))),
              if (b.phone.isNotEmpty) OutlinedButton.icon(onPressed: () => launchUrl(Uri(scheme: 'tel', path: b.phone)), icon: const Icon(Icons.call), label: Text(s.t('profile.call'))),
              if (wa != null) OutlinedButton.icon(onPressed: () => launchUrl(wa, mode: LaunchMode.externalApplication), icon: const Icon(Icons.chat), label: Text(s.t('profile.whatsapp'))),
            ]),
          ])),
          Padding(padding: const EdgeInsets.symmetric(horizontal: 16), child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            if (has('gender_schedule')) ...[GenderScheduleBar(business: b), gap],
            Text(s.t('profile.services'), style: theme.textTheme.titleLarge),
            const SizedBox(height: 8),
            PriceBoard(services: p.services, variant: cat?.theme.priceBoard ?? 'menu', accentFont: cat?.theme.accentFont),
            gap,
            if (has('walkin_queue')) ...[WalkinQueueCard(business: b), gap],
            if (has('ritual_builder')) ...[RitualBuilder(services: p.services, ritualSteps: b.ritualSteps, onChoose: (ids) => _book(context, p, cat, ids)), gap],
            if (has('bring_list')) ...[BringList(items: b.bringList), gap],
            Text(s.t('profile.works'), style: theme.textTheme.titleLarge),
            if (usedTags.isNotEmpty)
              SingleChildScrollView(scrollDirection: Axis.horizontal, child: Row(children: [
                Padding(padding: const EdgeInsetsDirectional.only(end: 6), child: ChoiceChip(label: Text(s.t('home.all')), selected: _tag == null, onSelected: (_) => setState(() => _tag = null))),
                for (final t in usedTags) Padding(padding: const EdgeInsetsDirectional.only(end: 6), child: ChoiceChip(label: Text(t.label(s.lang)), selected: _tag == t.key, onSelected: (_) => setState(() => _tag = t.key))),
              ])),
            const SizedBox(height: 8),
            if (works.isEmpty)
              Text(s.t('profile.noWorks'))
            else
              GridView.count(crossAxisCount: 2, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(), mainAxisSpacing: 8, crossAxisSpacing: 8, children: [
                for (final w in works)
                  ClipRRect(borderRadius: BorderRadius.circular(8), child: CachedNetworkImage(imageUrl: resolveUrl(w.imageUrl), fit: BoxFit.cover, errorWidget: (_, __, ___) => const Icon(Icons.image_not_supported))),
              ]),
            const SizedBox(height: 96),
          ])),
        ]),
      ),
      bottomNavigationBar: p.services.isEmpty ? null : SafeArea(child: Padding(padding: const EdgeInsets.all(12), child: FilledButton(onPressed: () => _book(context, p, cat), child: Text(s.t('book.cta'))))),
    );
  }
}
