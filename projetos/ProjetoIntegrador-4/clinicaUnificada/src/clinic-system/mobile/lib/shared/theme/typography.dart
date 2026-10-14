import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

abstract final class AppTypography {
  static TextTheme get textTheme {
    final body = GoogleFonts.inter(fontWeight: FontWeight.w400);
    final title = GoogleFonts.poppins(fontWeight: FontWeight.w600);
    return ThemeData.light().textTheme
        .apply(fontFamily: body.fontFamily)
        .copyWith(
          headlineSmall: title.copyWith(fontSize: 24),
          titleLarge: title.copyWith(fontSize: 20),
          titleMedium: title.copyWith(fontSize: 16),
        );
  }
}
