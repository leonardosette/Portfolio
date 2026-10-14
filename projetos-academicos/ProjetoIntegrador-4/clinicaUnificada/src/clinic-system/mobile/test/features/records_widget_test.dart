import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:scu_paciente/features/records/data/record_repository.dart';
import 'package:scu_paciente/l10n/strings.dart';

import '../support/fake_api.dart';
import '../support/fixture.dart';

void main() {
  testWidgets('prontuário ordena, usa ID da consulta e omite campos vazios', (
    tester,
  ) async {
    final f = Fixture();
    await f.signedIn();
    final records = [
      {
        'id': 'record-old',
        'appointmentId': 'visit-old',
        'scheduledAt': '2026-08-01T10:00',
        'doctorName': 'Médica anterior',
        'prescriptionItems': [],
      },
      {
        'id': 'record-new',
        'appointmentId': 'visit-new',
        'scheduledAt': '2026-09-01T10:00',
        'doctorName': 'Médica recente',
        'diagnosis': 'Diagnóstico fictício',
        'chiefComplaint': '',
        'prescriptionItems': [
          {
            'id': 'rx',
            'medicationName': 'Medicamento fictício',
            'dosage': 'Dose de teste',
            'duration': '',
            'notes': '',
          },
        ],
      },
    ];
    f.api.dio.httpClientAdapter = RecordingAdapter((request) {
      if (request.path.endsWith('/records')) {
        return ResponseBody.fromString(jsonEncode(records), 200);
      }
      if (request.path.endsWith('/records/visit-new')) {
        return ResponseBody.fromString(jsonEncode(records.last), 200);
      }
      return f.respond(request);
    });
    final ordered = await tester.runAsync(() => RecordRepository(f.api).list());
    expect(ordered!.first.appointmentId, 'visit-new');
    await tester.pumpWidget(await f.app());
    await tester.pumpAndSettle();
    await tester.tap(find.byIcon(Icons.assignment_outlined));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Médica recente'));
    await tester.pumpAndSettle();
    expect(find.text('Diagnóstico fictício'), findsOneWidget);
    expect(find.text(S.complaint), findsNothing);
    expect(find.text('Medicamento fictício'), findsOneWidget);
    expect(find.text('Dose: Dose de teste'), findsOneWidget);
    expect(find.textContaining('Duração:'), findsNothing);
    final adapter = f.api.dio.httpClientAdapter as RecordingAdapter;
    expect(
      adapter.requests.any((r) => r.path == '/api/patient/records/visit-new'),
      true,
    );
    expect(
      adapter.requests.any((r) => r.path == '/api/patient/records/record-new'),
      false,
    );
  });
}
