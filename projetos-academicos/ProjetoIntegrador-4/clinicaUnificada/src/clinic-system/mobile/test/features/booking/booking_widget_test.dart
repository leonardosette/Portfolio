import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:scu_paciente/features/appointments/domain/appointment_type.dart';
import 'package:scu_paciente/features/booking/presentation/step_datetime.dart';
import 'package:scu_paciente/l10n/strings.dart';

void main() {
  testWidgets('passo 3 explica recepção e desabilita envio sem data/hora', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        localizationsDelegates: GlobalMaterialLocalizations.delegates,
        supportedLocales: const [Locale('pt', 'BR')],
        home: Scaffold(
          body: StepDatetime(
            clinicName: 'Clínica',
            doctorName: 'Dra.',
            date: null,
            time: null,
            type: AppointmentType.firstVisit,
            onDate: (_) {},
            onTime: (_) {},
            onType: (_) {},
            onSubmit: () {},
          ),
        ),
      ),
    );
    expect(find.text(S.receptionNotice), findsOneWidget);
    final button = tester.widget<FilledButton>(
      find.widgetWithText(FilledButton, S.requestBooking),
    );
    expect(button.onPressed, isNull);
  });
}
