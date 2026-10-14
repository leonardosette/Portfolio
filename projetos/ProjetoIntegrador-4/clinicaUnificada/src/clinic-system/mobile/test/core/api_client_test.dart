import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:scu_paciente/core/api_client.dart';
import 'package:scu_paciente/core/failure.dart';
import 'package:scu_paciente/features/appointments/data/appointment_repository.dart';
import 'package:scu_paciente/features/appointments/data/booking_request.dart';

import '../support/fake_api.dart';
import '../support/fixture.dart';

void main() {
  test(
    'Dio preserva texto puro com Content-Type JSON e Bearer exato',
    () async {
      final store = MemoryStore();
      await store.stage('jwt');
      final dio = criarDio(baseUrl: 'https://example.test', sessao: store);
      final adapter = RecordingAdapter(
        (request) => ResponseBody.fromString(
          'A data deve ser futura.',
          400,
          headers: {
            'content-type': ['application/json'],
          },
        ),
      );
      dio.httpClientAdapter = adapter;
      await expectLater(
        ApiClient(dio).request('/api/patient/appointments'),
        throwsA(
          isA<FalhaDeRequisicao>().having(
            (f) => f.mensagem,
            'mensagem',
            'A data deve ser futura.',
          ),
        ),
      );
      expect(adapter.requests.single.headers['Authorization'], 'Bearer jwt');
    },
  );
  test('401 vazio encerra sessão e 404 vazio mantém sessão', () async {
    final store = MemoryStore();
    await store.stage('jwt');
    await store.activate(name: 'Teste', email: 'teste@example.test');
    final dio = criarDio(baseUrl: 'https://example.test', sessao: store);
    var status = 404;
    dio.httpClientAdapter = RecordingAdapter(
      (r) => ResponseBody.fromString('', status),
    );
    final api = ApiClient(dio);
    await expectLater(
      api.request('/api/patient/profile'),
      throwsA(isA<NaoEncontrado>()),
    );
    expect(store.token, 'jwt');
    status = 401;
    await expectLater(
      api.request('/api/patient/profile'),
      throwsA(isA<SessaoExpirada>()),
    );
    expect(store.token, isNull);
    expect(store.state.message, 'Sua sessão expirou. Entre novamente.');
  });
  test(
    'POST concluído seguido de GET com erro não permite duplicar criação',
    () async {
      final store = MemoryStore();
      final dio = criarDio(baseUrl: 'https://example.test', sessao: store);
      final adapter = RecordingAdapter(
        (r) => ResponseBody.fromString(
          r.method == 'POST' ? '{}' : '',
          r.method == 'POST' ? 201 : 404,
        ),
      );
      dio.httpClientAdapter = adapter;
      final result = await AppointmentRepository(ApiClient(dio)).book(
        BookingRequest(
          clinicId: 'clinic',
          doctorId: 'doctor',
          scheduledAt: DateTime(2030),
        ),
      );
      expect(result.failure, isA<NaoEncontrado>());
      expect(adapter.requests.map((r) => r.method), ['POST', 'GET']);
    },
  );
}
