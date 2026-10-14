import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:scu_paciente/core/error_mapper.dart';
import 'package:scu_paciente/core/failure.dart';
import 'package:scu_paciente/core/json.dart';
import 'package:scu_paciente/core/formatters.dart';

DioException error(
  int status,
  Object? body, {
  String path = '/api/patient/appointments',
}) {
  final request = RequestOptions(path: path);
  return DioException(
    requestOptions: request,
    response: Response<Object?>(
      requestOptions: request,
      statusCode: status,
      data: body,
    ),
    type: DioExceptionType.badResponse,
  );
}

void main() {
  test('400 com texto puro vira FalhaDeRequisicao com mensagem do backend', () {
    final failure = mapearErro(error(400, 'A data deve ser futura.'));
    expect(failure, isA<FalhaDeRequisicao>());
    expect(failure.mensagem, 'A data deve ser futura.');
  });
  test('JSON Spring com mensagem vazia usa fallback', () {
    expect(
      mapearErro(error(400, '{"message":""}')).mensagem,
      'Não foi possível concluir a operação.',
    );
    expect(
      mapearErro(error(400, {'message': 'CPF já cadastrado.'})).mensagem,
      'CPF já cadastrado.',
    );
  });
  test('401 e 404 vazios não tentam decodificar JSON', () {
    expect(mapearErro(error(401, '')), isA<SessaoExpirada>());
    expect(mapearErro(error(404, '')), isA<NaoEncontrado>());
  });
  test('403 e 500 em rotas do paciente', () {
    expect(mapearErro(error(403, '{}')), isA<AcessoNegado>());
    expect(mapearErro(error(500, '{}')), isA<SessaoExpirada>());
    expect(
      mapearErro(error(500, '{}', path: '/api/auth/login')),
      isA<FalhaDoServidor>(),
    );
  });
  test('401 do login mantém mensagem de credenciais', () {
    expect(
      mapearErro(error(401, 'Credenciais inválidas', path: '/api/auth/login'))
          .mensagem,
      'Credenciais inválidas',
    );
  });
  test('data pura não desloca fuso nem aceita dia inexistente', () {
    final date = asDateOrNull('1990-05-20')!;
    expect(date.isUtc, false);
    expect(date.day, 20);
    expect(asDateOrNull('2026-02-31'), isNull);
    expect(asDateTimeOrNull('2026-09-13T16:13:22.123456')?.microsecond, 456);
  });
  test('agendamento sem segundos nem Z', () {
    expect(scheduledAtWire(DateTime(2026, 9, 20, 14, 30)), '2026-09-20T14:30');
  });
  test('CPF segue contrato de 11 dígitos, aceita máscara', () {
    expect(validCpf('123.456.789-01'), true);
    expect(validCpf('123'), false);
  });
}
