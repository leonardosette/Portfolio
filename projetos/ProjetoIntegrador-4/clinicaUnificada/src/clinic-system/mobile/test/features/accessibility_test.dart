import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:scu_paciente/l10n/strings.dart';

import '../support/fixture.dart';

Future<void> capture(
  WidgetTester tester,
  GlobalKey boundary,
  String name,
) async {
  if (!const bool.fromEnvironment('SCU_CAPTURE_EVIDENCE')) return;
  final render =
      boundary.currentContext!.findRenderObject()! as RenderRepaintBoundary;
  await tester.runAsync(() async {
    final image = await render.toImage(pixelRatio: 1);
    final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
    final directory = Directory('build/evidence');
    await directory.create(recursive: true);
    await File('${directory.path}/$name.png')
        .writeAsBytes(bytes!.buffer.asUint8List());
    image.dispose();
  });
}

void main() {
  testWidgets('login e início: alvos Android, rótulos e contraste', (
    tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(480, 1000));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    final semantics = tester.ensureSemantics();
    try {
      final boundary = GlobalKey(), f = Fixture();
      await tester.pumpWidget(
        RepaintBoundary(key: boundary, child: await f.app()),
      );
      await tester.pumpAndSettle();
      await tester.runAsync(() async {
        final icons = FontLoader('MaterialIcons')
          ..addFont(rootBundle.load('fonts/MaterialIcons-Regular.otf'));
        await icons.load();
        await GoogleFonts.pendingFonts();
      });
      await tester.pumpAndSettle();
      await expectLater(tester, meetsGuideline(androidTapTargetGuideline));
      await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
      await expectLater(tester, meetsGuideline(textContrastGuideline));
      await capture(tester, boundary, 'login');
      await tester.enterText(find.byType(TextFormField).at(0), 'ana@teste.com');
      await tester.enterText(find.byType(TextFormField).at(1), 'Senha#123');
      await tester.tap(find.text(S.login));
      await tester.pumpAndSettle();
      await expectLater(tester, meetsGuideline(androidTapTargetGuideline));
      await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
      await expectLater(tester, meetsGuideline(textContrastGuideline));
      await capture(tester, boundary, 'inicio');
    } finally {
      semantics.dispose();
    }
  });
  testWidgets('fonte ampliada preserva formulário rolável', (tester) async {
    tester.platformDispatcher.textScaleFactorTestValue = 2;
    addTearDown(tester.platformDispatcher.clearTextScaleFactorTestValue);
    final f = Fixture();
    await tester.pumpWidget(await f.app());
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text(S.login));
    expect(tester.takeException(), isNull);
  });
}
