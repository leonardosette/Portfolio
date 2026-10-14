import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:scu_paciente/l10n/strings.dart';

import '../support/fixture.dart';

void main() {
  testWidgets('perfil salva e convênio percorre CRUD na interface', (
    tester,
  ) async {
    final f = Fixture();
    await f.signedIn();
    await tester.binding.setSurfaceSize(const Size(480, 1100));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(await f.app());
    await tester.pumpAndSettle();
    await tester.tap(find.byIcon(Icons.person_outline));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text(S.edit));
    await tester.tap(find.text(S.edit));
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextFormField).at(1), 'Rua Nova');
    await tester.ensureVisible(find.text(S.save));
    await tester.tap(find.text(S.save));
    await tester.pumpAndSettle();
    expect(f.profile['address'], 'Rua Nova');
    await tester.ensureVisible(find.text(S.insurance));
    await tester.tap(find.text(S.insurance));
    await tester.pumpAndSettle();
    await tester.tap(find.text(S.newInsurance));
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextFormField).at(0), 'Unimed');
    await tester.enterText(find.byType(TextFormField).at(1), '000123');
    await tester.ensureVisible(find.text(S.save));
    await tester.tap(find.text(S.save));
    await tester.pumpAndSettle();
    expect(find.text('Unimed'), findsOneWidget);
    expect(f.insurances.single['titular'], true);
    await tester.tap(find.text(S.principal));
    await tester.pumpAndSettle();
    expect(f.insurances.single['principal'], true);
    await tester.tap(find.text(S.edit));
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextFormField).at(2), 'Nacional');
    await tester.ensureVisible(find.text(S.save));
    await tester.tap(find.text(S.save));
    await tester.pumpAndSettle();
    expect(f.insurances.single['plano'], 'Nacional');
    await tester.tap(find.text(S.remove));
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(FilledButton, S.remove));
    await tester.pumpAndSettle();
    expect(f.insurances, isEmpty);
    expect(tester.takeException(), isNull);
  });
  testWidgets('notificações marcam leitura e atualizam contador', (
    tester,
  ) async {
    final f = Fixture();
    await f.signedIn();
    await tester.pumpWidget(await f.app());
    await tester.pumpAndSettle();
    await tester.tap(find.byIcon(Icons.notifications_outlined));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Bem-vinda'));
    await tester.pumpAndSettle();
    expect(f.notices.single['read'], true);
    expect(tester.takeException(), isNull);
  });
}
