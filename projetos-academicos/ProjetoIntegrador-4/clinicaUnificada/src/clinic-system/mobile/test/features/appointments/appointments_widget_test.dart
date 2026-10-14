import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:scu_paciente/core/failure.dart';
import 'package:scu_paciente/features/appointments/data/appointment.dart';
import 'package:scu_paciente/features/appointments/presentation/appointments_page.dart';
import 'package:scu_paciente/features/appointments/presentation/appointments_provider.dart';
import 'package:scu_paciente/shared/widgets/loading_skeleton.dart';
import 'package:scu_paciente/l10n/strings.dart';

import '../../support/fixture.dart';

void main() {
  testWidgets('consultas carregando', (tester) async {
    final pending = Completer<List<Appointment>>();
    await tester.pumpWidget(
      ProviderScope(
        retry: (count, error) => null,
        overrides: [appointmentsProvider.overrideWith((ref) => pending.future)],
        child: const MaterialApp(home: Scaffold(body: AppointmentsPage())),
      ),
    );
    await tester.pump();
    expect(find.byType(LoadingSkeleton), findsOneWidget);
  });
  testWidgets('consultas vazio e filtro local', (tester) async {
    await initializeDateFormatting('pt_BR');
    final item = Appointment.fromJson({
      'id': 'a',
      'scheduledAt': '2026-09-20T14:30',
      'status': 'PENDING',
      'type': 'FIRST_VISIT',
      'doctor': {'name': 'Dra. Teste'},
    });
    await tester.pumpWidget(
      ProviderScope(
        retry: (count, error) => null,
        overrides: [
          appointmentsProvider.overrideWith((ref) async => [item]),
        ],
        child: const MaterialApp(
          localizationsDelegates: GlobalMaterialLocalizations.delegates,
          supportedLocales: [Locale('pt', 'BR')],
          home: Scaffold(body: AppointmentsPage()),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Dra. Teste'), findsOneWidget);
    await tester.tap(find.text(S.completedFilter));
    await tester.pumpAndSettle();
    expect(find.text(S.noAppointments), findsOneWidget);
  });
  testWidgets('erro permite tentar de novo', (tester) async {
    var calls = 0;
    await tester.pumpWidget(
      ProviderScope(
        retry: (count, error) => null,
        overrides: [
          appointmentsProvider.overrideWith((ref) async {
            calls++;
            throw const FalhaDeRede();
          }),
        ],
        child: const MaterialApp(home: Scaffold(body: AppointmentsPage())),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text(S.networkError), findsOneWidget);
    final before = calls;
    await tester.tap(find.text(S.retry));
    await tester.pumpAndSettle();
    expect(calls, greaterThan(before));
  });
  testWidgets('faixa sem conexão acompanha abas', (tester) async {
    final fixture = Fixture();
    await fixture.signedIn();
    await tester.pumpWidget(await fixture.app(offline: true));
    await tester.pumpAndSettle();
    expect(find.text(S.offline), findsOneWidget);
  });
}
