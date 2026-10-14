import 'error_mapper.dart';
import 'failure.dart';

/// A escrita foi concluída. Uma falha na leitura seguinte não deve permitir
/// repetir um POST de criação e duplicar a solicitação.
class ReloadResult<T> {
  const ReloadResult({this.data, this.failure});
  final T? data;
  final Failure? failure;
}

Future<ReloadResult<T>> reloadAfterWrite<T>(Future<T> Function() read) async {
  try {
    return ReloadResult(data: await read());
  } catch (error) {
    return ReloadResult(failure: mapearErro(error));
  }
}
