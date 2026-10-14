import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mocktail/mocktail.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:scu_paciente/core/api_client.dart';
import 'package:scu_paciente/core/session_store.dart';
import 'package:scu_paciente/core/failure.dart';
import 'package:scu_paciente/features/auth/presentation/session_provider.dart';

import '../../support/fake_api.dart';

class MockSecure extends Mock implements FlutterSecureStorage {}

class MockPreferences extends Mock implements SharedPreferencesAsync {}

void main() {
  test(
    'paciente obtém perfil, restaura token e logout apaga armazenamento',
    () async {
      final secure = MockSecure(), prefs = MockPreferences();
      String? persisted;
      when(
        () => secure.write(
          key: any(named: 'key'),
          value: any(named: 'value'),
        ),
      ).thenAnswer((i) async {
        persisted = i.namedArguments[#value] as String?;
      });
      when(() => secure.read(key: any(named: 'key')))
          .thenAnswer((_) async => persisted);
      when(() => secure.delete(key: any(named: 'key'))).thenAnswer((_) async {
        persisted = null;
      });
      when(() => prefs.setString(any(), any())).thenAnswer((_) async {});
      when(() => prefs.remove(any())).thenAnswer((_) async {});
      final store = SessionStore(secure: secure, preferences: prefs);
      final paths = <String>[];
      final dio = fakeDio((request) {
        paths.add(request.path);
        return ResponseBody.fromString(
          jsonEncode(
            request.path.endsWith('login')
                ? {'token': 'abc', 'role': 'ROLE_PATIENT'}
                : {
                    'id': 'user',
                    'patientProfileId': 'patient',
                    'name': 'Ana',
                    'email': 'ana@test.com',
                  },
          ),
          200,
        );
      });
      final container = ProviderContainer(
        overrides: [
          sessionStoreProvider.overrideWithValue(store),
          apiClientProvider.overrideWithValue(ApiClient(dio)),
        ],
      );
      addTearDown(container.dispose);
      await container
          .read(sessionProvider.notifier)
          .login('ana@test.com', 'secret');
      expect(container.read(sessionProvider).authenticated, true);
      expect(paths, ['/api/auth/login', '/api/patient/profile']);
      expect(persisted, contains('abc'));
      final restored = SessionStore(secure: secure, preferences: prefs);
      await restored.load();
      expect(restored.token, 'abc');
      restored.dispose();
      await container.read(sessionProvider.notifier).logout();
      expect(store.token, isNull);
      expect(persisted, isNull);
      expect(container.read(sessionProvider).authenticated, false);
    },
  );
  test('superadmin é recusado sem persistir token nem buscar perfil', () async {
    final secure = MockSecure(), prefs = MockPreferences();
    when(() => secure.delete(key: any(named: 'key'))).thenAnswer((_) async {});
    when(() => prefs.remove(any())).thenAnswer((_) async {});
    final store = SessionStore(secure: secure, preferences: prefs);
    final dio = fakeDio(
      (request) => ResponseBody.fromString(
        '{"token":"admin","role":"ROLE_SUPERADMIN"}',
        200,
      ),
    );
    final container = ProviderContainer(
      overrides: [
        sessionStoreProvider.overrideWithValue(store),
        apiClientProvider.overrideWithValue(ApiClient(dio)),
      ],
    );
    addTearDown(container.dispose);
    await expectLater(
      container
          .read(sessionProvider.notifier)
          .login('admin@test.com', 'secret'),
      throwsA(
        isA<FalhaDeRequisicao>().having(
          (f) => f.mensagem,
          'mensagem',
          contains('exclusivo para pacientes'),
        ),
      ),
    );
    expect(store.token, isNull);
    verifyNever(
      () => secure.write(
        key: any(named: 'key'),
        value: any(named: 'value'),
      ),
    );
  });
}
