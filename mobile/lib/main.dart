import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'api/client.dart';
import 'api/repository.dart';
import 'app.dart';
import 'state/providers.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final prefs = await SharedPreferences.getInstance();
  final api = await ApiClient.create();
  runApp(ProviderScope(
    overrides: [
      repositoryProvider.overrideWithValue(Repository(api)),
      prefsProvider.overrideWithValue(prefs),
    ],
    child: const NewlookApp(),
  ));
}
