/// Price without a trailing ".0" (60.0 -> "60", 40.5 -> "40.5").
String formatPrice(num p) => p == p.roundToDouble() ? p.toInt().toString() : p.toString();
