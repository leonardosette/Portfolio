import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:scu_paciente/l10n/strings.dart';

import '../../support/fixture.dart';
import '../../support/fake_api.dart';

void main() {
  testWidgets('sessão expirada na inicialização abre login com mensagem', (
    tester,
  ) async {
    final fixture = Fixture();
    await fixture.signedIn();
    fixture.api.dio.httpClientAdapter = RecordingAdapter(
      (request) => ResponseBody.fromString('', 401),
    );
    await tester.binding.setSurfaceSize(const Size(480, 1000));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(await fixture.app(restoreSession: true));
    await tester.pumpAndSettle();
    expect(find.text(S.login), findsOneWidget);
    expect(find.text(S.expired), findsOneWidget);
    expect(fixture.store.token, isNull);
  });
  for (final scenario in ['success', 'invalid', 'admin']) {
    testWidgets('login $scenario', (tester) async {
      final fixture = Fixture();
      await tester.binding.setSurfaceSize(const Size(480, 1000));
      addTearDown(() => tester.binding.setSurfaceSize(null));
      if (scenario == 'invalid') fixture.loginStatus = 401;
      if (scenario == 'admin') fixture.role = 'ROLE_SUPERADMIN';
      await tester.pumpWidget(await fixture.app());
      await tester.pumpAndSettle();
      await tester.enterText(find.byType(TextFormField).at(0), 'ana@teste.com');
      await tester.enterText(find.byType(TextFormField).at(1), 'Senha#123');
      await tester.ensureVisible(find.text(S.login));
      await tester.tap(find.text(S.login));
      await tester.pumpAndSettle();
      if (scenario == 'success') {
        expect(fixture.store.state.authenticated, true);
        expect(find.text('Olá, Ana'), findsOneWidget);
      } else {
        expect(
          find.text(scenario == 'admin' ? S.patientOnly : S.invalidCredentials),
          findsOneWidget,
          reason: tester
              .widgetList<Text>(find.byType(Text))
              .map((w) => w.data)
              .join(' | '),
        );
        expect(fixture.store.state.authenticated, false);
      }
      expect(tester.takeException(), isNull);
    });
  }
}
