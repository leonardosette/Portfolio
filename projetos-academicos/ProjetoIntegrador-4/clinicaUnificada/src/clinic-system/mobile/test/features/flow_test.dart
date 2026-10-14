import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:scu_paciente/l10n/strings.dart';

import '../support/fixture.dart';

void patientFlowTests() {
  testWidgets('cadastrar → login automático → agendar → listar → cancelar', (
    tester,
  ) async {
    final fixture = Fixture();
    await tester.binding.setSurfaceSize(const Size(480, 1000));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(await fixture.app());
    await tester.pumpAndSettle();
    await tester.tap(find.text(S.register));
    await tester.pumpAndSettle();
    final fields = find.byType(TextFormField);
    for (final (index, value) in [
      (0, 'Ana Teste'),
      (1, 'ana@teste.com'),
      (2, '12345678901'),
      (3, 'Senha#123'),
      (4, 'Senha#123'),
    ]) {
      await tester.ensureVisible(fields.at(index));
      await tester.enterText(fields.at(index), value);
    }
    await tester.ensureVisible(find.textContaining(S.birthDate).first);
    await tester.tap(find.widgetWithText(OutlinedButton, '${S.birthDate}: —'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('OK'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.widgetWithText(FilledButton, S.register));
    await tester.tap(find.widgetWithText(FilledButton, S.register));
    await tester.pumpAndSettle();
    expect(
      find.text('Olá, Ana'),
      findsOneWidget,
      reason: tester
          .widgetList<Text>(find.byType(Text))
          .map((w) => w.data)
          .join(' | '),
    );
    await tester.tap(find.byIcon(Icons.add_circle_outline));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Clínica Central'));
    await tester.pumpAndSettle();
    await tester.tap(find.byType(DropdownButtonFormField<String>));
    await tester.pumpAndSettle();
    await tester.tap(find.text(S.allSpecialties).last);
    await tester.pumpAndSettle();
    await tester.tap(find.text('Dra. Teste'));
    await tester.pumpAndSettle();
    await tester.tap(find.text(S.continueLabel));
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(OutlinedButton, '${S.date}: —'));
    await tester.pumpAndSettle();
    final localizations = MaterialLocalizations.of(
      tester.element(find.byType(DatePickerDialog)),
    );
    await tester.tap(find.byTooltip(localizations.nextMonthTooltip));
    await tester.pumpAndSettle();
    await tester.tap(find.text('15'));
    await tester.tap(find.text('OK'));
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(OutlinedButton, '${S.time}: —'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('OK'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text(S.requestBooking));
    await tester.tap(find.text(S.requestBooking));
    await tester.pumpAndSettle();
    expect(find.text(S.requestSent), findsOneWidget);
    expect(fixture.appointments.single['status'], 'PENDING');
    final post = fixture.requests.singleWhere(
      (r) => r.method == 'POST' && r.path.endsWith('/appointments'),
    );
    final body = post.data as Map<String, Object?>;
    expect(body['doctorId'], 'doctor-entity');
    expect(body['scheduledAt'], matches(r'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$'));
    await tester.tap(find.text(S.viewAppointments));
    await tester.pumpAndSettle();
    await tester.tap(find.text(S.cancel));
    await tester.pumpAndSettle();
    await tester.tap(find.text(S.confirmCancel));
    await tester.pumpAndSettle();
    expect(fixture.appointments.single['status'], 'CANCELLED');
    expect(find.text(S.cancelled), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}

void main() => patientFlowTests();
