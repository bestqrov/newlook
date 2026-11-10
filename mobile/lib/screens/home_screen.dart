import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../api/models.dart';
import '../l10n/strings.dart';
import '../state/providers.dart';
import '../util/format.dart';
import '../values.dart';
import '../widgets/async_view.dart';
import '../widgets/live_badge.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});
  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final _keyword = TextEditingController();
  String? _city;
  String? _category;
  bool _availableNow = false;
  late Future<List<Business>> _results = _load();

  Future<List<Business>> _load() => ref.read(repositoryProvider).search(city: _city, category: _category, keyword: _keyword.text, availableNow: _availableNow);
  Future<void> _reload() async {
    if (ref.read(catalogProvider).hasError) ref.invalidate(catalogProvider);
    final f = _load();
    setState(() => _results = f);
    await f.catchError((_) => <Business>[]);
  }

  @override
  void dispose() {
    _keyword.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final s = S.of(context);
    final catalog = ref.watch(catalogProvider).valueOrNull;
    final ticket = ref.watch(ticketProvider);
    return Scaffold(
      appBar: AppBar(title: Text(s.t('app.name')), actions: [
        TextButton.icon(onPressed: () => context.push('/pro'), icon: const Icon(Icons.storefront), label: Text(s.t('home.pro'))),
      ]),
      body: RefreshIndicator(
        onRefresh: _reload,
        child: ListView(physics: const AlwaysScrollableScrollPhysics(), padding: const EdgeInsets.all(16), children: [
          if (ticket != null) ...[
            Card(child: ListTile(leading: const Icon(Icons.confirmation_number), title: Text(s.t('home.ticket', {'name': ticket.businessName})), trailing: const Icon(Icons.chevron_left), onTap: () => context.push('/ticket'))),
            const SizedBox(height: 12),
          ],
          TextField(controller: _keyword, textInputAction: TextInputAction.search, onSubmitted: (_) => _reload(), decoration: InputDecoration(hintText: s.t('home.search'), prefixIcon: const Icon(Icons.search))),
          const SizedBox(height: 12),
          SingleChildScrollView(scrollDirection: Axis.horizontal, child: Row(children: [
            Padding(padding: const EdgeInsetsDirectional.only(end: 6), child: ChoiceChip(label: Text(s.t('home.all')), selected: _category == null, onSelected: (_) { _category = null; _reload(); })),
            for (final c in catalog?.categories ?? const <CategoryDef>[])
              Padding(padding: const EdgeInsetsDirectional.only(end: 6), child: ChoiceChip(label: Text(c.label(s.lang)), selected: _category == c.value, onSelected: (_) { _category = c.value; _reload(); })),
          ])),
          const SizedBox(height: 8),
          Row(children: [
            Expanded(child: DropdownButtonFormField<String?>(
              value: _city,
              decoration: const InputDecoration(contentPadding: EdgeInsets.symmetric(horizontal: 12)),
              items: [DropdownMenuItem(value: null, child: Text(s.t('home.allCities'))), for (final c in cities) DropdownMenuItem(value: c, child: Text(cityLabel(c, s.lang)))],
              onChanged: (v) { _city = v; _reload(); },
            )),
            const SizedBox(width: 8),
            ChoiceChip(label: Text(s.t('home.availableNow')), selected: _availableNow, onSelected: (v) { _availableNow = v; _reload(); }),
          ]),
          const SizedBox(height: 16),
          FutureBuilder<List<Business>>(
            future: _results,
            builder: (context, snap) {
              if (snap.connectionState != ConnectionState.done) return const Padding(padding: EdgeInsets.all(32), child: Center(child: CircularProgressIndicator()));
              if (snap.hasError) return ErrorRetry(error: snap.error!, onRetry: _reload);
              final list = snap.data!;
              if (list.isEmpty) return Padding(padding: const EdgeInsets.all(32), child: Text(s.t('home.empty'), textAlign: TextAlign.center));
              return Column(children: [for (final b in list) Padding(padding: const EdgeInsets.only(bottom: 10), child: _BusinessCard(b: b, catalog: catalog))]);
            },
          ),
        ]),
      ),
    );
  }
}

class _BusinessCard extends StatelessWidget {
  const _BusinessCard({required this.b, required this.catalog});
  final Business b;
  final Catalog? catalog;
  @override
  Widget build(BuildContext context) {
    final s = S.of(context);
    final cat = catalog?.categoryOf(b.category);
    final color = cat?.theme.colors.primary ?? Theme.of(context).colorScheme.primary;
    return Card(clipBehavior: Clip.antiAlias, child: InkWell(
      onTap: () => context.push('/b/${b.id}'),
      child: Row(children: [
        Container(width: 8, height: 110, color: color),
        Expanded(child: Padding(padding: const EdgeInsets.all(12), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(cat?.label(s.lang) ?? b.category, style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600)),
          Text(b.name, style: Theme.of(context).textTheme.titleLarge, maxLines: 1, overflow: TextOverflow.ellipsis),
          const SizedBox(height: 4),
          Wrap(spacing: 8, crossAxisAlignment: WrapCrossAlignment.center, children: [
            Text('📍 ${cityLabel(b.city, s.lang)}'),
            LiveBadge(live: b.live),
          ]),
          if (b.price != null) Padding(padding: const EdgeInsets.only(top: 4), child: Text('${b.service ?? ''} · ${s.t('home.from', {'p': formatPrice(b.price!)})}', style: const TextStyle(fontWeight: FontWeight.w600))),
        ]))),
      ]),
    ));
  }
}
