import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../api/models.dart';

class NewlookStatusColors extends ThemeExtension<NewlookStatusColors> {
  const NewlookStatusColors({required this.success, required this.warning});
  final Color success, warning;
  @override
  NewlookStatusColors copyWith({Color? success, Color? warning}) => NewlookStatusColors(success: success ?? this.success, warning: warning ?? this.warning);
  @override
  NewlookStatusColors lerp(ThemeExtension<NewlookStatusColors>? other, double t) {
    if (other is! NewlookStatusColors) return this;
    return NewlookStatusColors(success: Color.lerp(success, other.success, t)!, warning: Color.lerp(warning, other.warning, t)!);
  }
}

/// Used before the catalog is loaded (same colours as the website).
const fallbackCategoryTheme = CategoryTheme(
  mode: Brightness.light,
  light: ThemeColors(background: Color(0xFFF5FAF7), surface: Color(0xFFFFFFFF), text: Color(0xFF182720), muted: Color(0xFF5A5F70), primary: Color(0xFF267A54), onPrimary: Color(0xFFFFFFFF), accent: Color(0xFF7A5A1F), border: Color(0xFFDCE8E1), success: Color(0xFF2E7D4F), warning: Color(0xFF9A6416), danger: Color(0xFFB42318)),
  dark: ThemeColors(background: Color(0xFF0F1813), surface: Color(0xFF16221B), text: Color(0xFFE6F1EB), muted: Color(0xFFA6B5AD), primary: Color(0xFF5CC596), onPrimary: Color(0xFF0F1813), accent: Color(0xFFD8B061), border: Color(0xFF26362D), success: Color(0xFF4CAF7A), warning: Color(0xFFE0A548), danger: Color(0xFFF07167)),
  displayFont: 'Reem Kufi', bodyFont: 'IBM Plex Sans Arabic', radius: 12, priceBoard: 'menu',
);

/// Google font, or the plain style when the family is unknown / offline.
TextStyle? safeFont(String? family, TextStyle? style) {
  if (family == null) return style;
  try {
    return GoogleFonts.getFont(family, textStyle: style);
  } catch (_) {
    return style;
  }
}

ThemeData themeFor(CategoryTheme t, {bool withFonts = true}) {
  final c = t.colors;
  final radius = BorderRadius.circular(t.radius);
  final scheme = ColorScheme(
    brightness: t.mode,
    primary: c.primary, onPrimary: c.onPrimary,
    secondary: c.primary, onSecondary: c.onPrimary,
    tertiary: c.accent, onTertiary: c.onPrimary,
    error: c.danger, onError: Colors.white,
    background: c.background, onBackground: c.text,
    surface: c.surface, onSurface: c.text,
    surfaceVariant: c.surface, onSurfaceVariant: c.muted,
    outline: c.border, outlineVariant: c.border,
  );
  final base = (t.mode == Brightness.dark ? ThemeData.dark() : ThemeData.light()).textTheme.apply(bodyColor: c.text, displayColor: c.text);
  TextStyle? display(TextStyle? s) => withFonts ? safeFont(t.displayFont, s) : s;
  TextStyle? body(TextStyle? s) => withFonts ? safeFont(t.bodyFont, s) : s;
  final text = base.copyWith(
    displayLarge: display(base.displayLarge), displayMedium: display(base.displayMedium), displaySmall: display(base.displaySmall),
    headlineLarge: display(base.headlineLarge), headlineMedium: display(base.headlineMedium), headlineSmall: display(base.headlineSmall),
    titleLarge: display(base.titleLarge),
    titleMedium: body(base.titleMedium), titleSmall: body(base.titleSmall),
    bodyLarge: body(base.bodyLarge), bodyMedium: body(base.bodyMedium), bodySmall: body(base.bodySmall),
    labelLarge: body(base.labelLarge), labelMedium: body(base.labelMedium), labelSmall: body(base.labelSmall),
  );
  final shape = RoundedRectangleBorder(borderRadius: radius);
  return ThemeData(
    useMaterial3: true,
    brightness: t.mode,
    colorScheme: scheme,
    scaffoldBackgroundColor: c.background,
    textTheme: text,
    dividerColor: c.border,
    appBarTheme: AppBarTheme(backgroundColor: c.surface, foregroundColor: c.text, elevation: 0, scrolledUnderElevation: 0, titleTextStyle: text.titleLarge),
    cardTheme: CardTheme(color: c.surface, elevation: 0, margin: EdgeInsets.zero, shape: RoundedRectangleBorder(borderRadius: radius, side: BorderSide(color: c.border))),
    inputDecorationTheme: InputDecorationTheme(
      filled: true, fillColor: c.background,
      border: OutlineInputBorder(borderRadius: radius, borderSide: BorderSide(color: c.border)),
      enabledBorder: OutlineInputBorder(borderRadius: radius, borderSide: BorderSide(color: c.border)),
      focusedBorder: OutlineInputBorder(borderRadius: radius, borderSide: BorderSide(color: c.primary, width: 2)),
    ),
    filledButtonTheme: FilledButtonThemeData(style: FilledButton.styleFrom(backgroundColor: c.primary, foregroundColor: c.onPrimary, shape: shape, minimumSize: const Size(0, 48))),
    outlinedButtonTheme: OutlinedButtonThemeData(style: OutlinedButton.styleFrom(foregroundColor: c.text, side: BorderSide(color: c.border), shape: shape, minimumSize: const Size(0, 48))),
    chipTheme: ChipThemeData(backgroundColor: c.surface, selectedColor: c.primary, side: BorderSide(color: c.border), labelStyle: TextStyle(color: c.text), secondaryLabelStyle: TextStyle(color: c.onPrimary)),
    bottomSheetTheme: BottomSheetThemeData(backgroundColor: c.background),
    extensions: [NewlookStatusColors(success: c.success, warning: c.warning)],
  );
}
