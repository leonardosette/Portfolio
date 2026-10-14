import 'dart:convert';

import 'package:mocktail/mocktail.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:dio/dio.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:scu_paciente/app/app.dart';
import 'package:scu_paciente/core/api_client.dart';
import 'package:scu_paciente/core/json.dart';
import 'package:scu_paciente/core/session_store.dart';
import 'package:scu_paciente/features/auth/domain/session_state.dart';
import 'package:scu_paciente/shared/widgets/offline_banner.dart';

import 'fake_api.dart';

class FixturePreferences extends Mock implements SharedPreferencesAsync {}

class MemoryStore extends SessionStore {
  MemoryStore() : super(preferences: FixturePreferences()) {
    state = const SessionState(ready: true);
  }
  String? memoryToken;
  @override
  String? get token => memoryToken;
  @override
  Future<void> load() async {}
  @override
  Future<void> stage(String token) async {
    memoryToken = token;
  }

  @override
  Future<void> activate({required String name, required String email}) async {
    state = SessionState(
      ready: true,
      authenticated: true,
      generation: state.generation + 1,
      name: name,
      email: email,
    );
    notifyListeners();
  }

  @override
  Future<void> clear({String? message}) async {
    memoryToken = null;
    state = SessionState(
      ready: true,
      generation: state.generation + 1,
      message: message,
    );
    notifyListeners();
  }
}

class Fixture {
  final store = MemoryStore();
  String role = 'ROLE_PATIENT';
  int loginStatus = 200;
  final profile = <String, Object?>{
    'id': 'user-id',
    'patientProfileId': 'patient-id',
    'name': 'Ana Teste',
    'email': 'ana@teste.com',
    'cpf': '12345678901',
    'birthDate': '1990-05-20',
    'active': true,
    'phone': '',
    'address': '',
    'bloodType': null,
    'allergies': '',
    'emergencyContactName': '',
    'emergencyContactPhone': '',
  };
  final appointments = <Json>[];
  final insurances = <Json>[];
  final notices = <Json>[
    {
      'id': 'welcome',
      'title': 'Bem-vinda',
      'body': 'Conta criada',
      'read': false,
      'createdAt': '2026-09-13T16:13:22.123456',
    },
  ];
  final requests = <RequestOptions>[];
  late final ApiClient api;
  Fixture() {
    final dio = criarDio(baseUrl: 'https://api.example.test', sessao: store);
    dio.httpClientAdapter = RecordingAdapter(respond);
    api = ApiClient(dio);
  }
  ResponseBody respond(RequestOptions r) {
    requests.add(r);
    final path = r.path, method = r.method;
    final body = asObject(r.data);
    Object? result;
    int status = 200;
    if (path == '/api/auth/login') {
      status = loginStatus;
      result = status == 200
          ? {
              'token': 'patient-token',
              'role': role,
              'name': 'Ana Teste',
              'email': 'ana@teste.com',
            }
          : 'Credenciais inválidas';
    } else if (path == '/api/pacients/register') {
      result = profile;
      status = 201;
    } else if (path.endsWith('/profile')) {
      if (method == 'PUT') profile.addAll(body);
      result = profile;
    } else if (path.endsWith('/booking/clinics')) {
      result = [
        {'id': 'clinic', 'name': 'Clínica Central', 'address': 'Rua de Teste'},
      ];
    } else if (path.endsWith('/specialties')) {
      result = [
        {'id': 'specialty', 'name': 'Cardiologia'},
      ];
    } else if (path.endsWith('/doctors')) {
      result = [
        {
          'id': 'doctor-entity',
          'name': 'Dra. Teste',
          'specialtyId': 'specialty',
          'specialtyName': 'Cardiologia',
        },
      ];
    } else if (path.endsWith('/appointments')) {
      if (method == 'POST') {
        appointments.add({
          'id': 'appointment',
          'scheduledAt': body['scheduledAt'],
          'status': 'PENDING',
          'type': body['type'],
          'clinicName': 'Clínica Central',
          'doctor': {
            'id': 'doctor-entity',
            'name': 'Dra. Teste',
            'specialtyName': 'Cardiologia',
          },
        });
        result = appointments.last;
        status = 201;
      } else {
        result = appointments;
      }
    } else if (path.contains('/appointments/')) {
      final item = appointments.firstWhere(
        (a) => a['id'] == path.split('/').last,
      );
      if (method == 'DELETE') {
        item['status'] = 'CANCELLED';
        result = null;
      } else {
        result = item;
      }
    } else if (path.endsWith('/unread-count')) {
      result = notices.where((n) => n['read'] == false).length;
    } else if (path.endsWith('/mark-all-read')) {
      for (final n in notices) {
        n['read'] = true;
      }
      result = null;
    } else if (path.endsWith('/read')) {
      for (final n in notices) {
        if (path.contains('/${n['id']}/')) n['read'] = true;
      }
      result = null;
    } else if (path.endsWith('/notifications')) {
      result = notices;
    } else if (path.endsWith('/records')) {
      result = [];
    } else if (path == '/api/patient/insurance') {
      if (method == 'POST') {
        insurances.add({
          ...body,
          'id': 'insurance',
          'ativo': true,
          'vencido': false,
        });
        result = insurances.last;
        status = 201;
      } else {
        result = insurances;
      }
    } else if (path.contains('/insurance/')) {
      final id = path.split('/')[4];
      if (method == 'DELETE') {
        insurances.removeWhere((i) => i['id'] == id);
      } else if (path.endsWith('/set-principal')) {
        for (final i in insurances) {
          i['principal'] = i['id'] == id;
        }
      } else {
        insurances.firstWhere((i) => i['id'] == id).addAll(body);
      }
      result = null;
    } else {
      status = 404;
      result = null;
    }
    return ResponseBody.fromString(
      result == null
          ? ''
          : result is String
          ? result
          : jsonEncode(result),
      status,
      headers: {
        Headers.contentTypeHeader: [Headers.jsonContentType],
      },
    );
  }

  Future<void> signedIn() async {
    await store.stage('patient-token');
    await store.activate(name: 'Ana Teste', email: 'ana@teste.com');
  }

  Future<Widget> app({
    bool offline = false,
    bool restoreSession = false,
  }) async {
    GoogleFonts.config.allowRuntimeFetching = false;
    await initializeDateFormatting('pt_BR');
    return ProviderScope(
      retry: (count, error) => null,
      overrides: [
        sessionStoreProvider.overrideWithValue(store),
        apiClientProvider.overrideWithValue(api),
        connectivityProvider.overrideWith(
          (ref) => Stream.value([
            offline ? ConnectivityResult.none : ConnectivityResult.wifi,
          ]),
        ),
      ],
      child: ScuApp(restoreSession: restoreSession),
    );
  }
}
