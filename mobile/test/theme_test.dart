import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:newlook/api/models.dart';
import 'package:newlook/theme/category_theme.dart';

void main() {
  test('dark barber theme maps colours, radius and status extension', () {
    final t = CategoryTheme(
      mode: Brightness.dark, light: fallbackCategoryTheme.light, dark: fallbackCategoryTheme.dark,
      displayFont: 'Reem Kufi', bodyFont: 'IBM Plex Sans Arabic', radius: 4, priceBoard: 'chalkboard',
    );
    final th = themeFor(t, withFonts: false);
    expect(th.brightness, Brightness.dark);
    expect(th.colorScheme.primary, t.dark.primary);
    expect(th.colorScheme.onPrimary, t.dark.onPrimary);
    expect(th.scaffoldBackgroundColor, t.dark.background);
    expect(th.colorScheme.onSurfaceVariant, t.dark.muted);
    expect(th.extension<NewlookStatusColors>()!.success, t.dark.success);
    final shape = th.cardTheme.shape as RoundedRectangleBorder;
    expect(shape.borderRadius, BorderRadius.circular(4));
  });

  test('fallback theme is light', () {
    expect(themeFor(fallbackCategoryTheme, withFonts: false).brightness, Brightness.light);
  });
}
