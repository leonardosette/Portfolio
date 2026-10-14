import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../app/env.dart';
import 'session_store.dart';
import 'error_mapper.dart';
import 'json.dart';

final sessionStoreProvider = Provider<SessionStore>((ref) {
  final store = SessionStore();
  ref.onDispose(store.dispose);
  return store;
});
final apiClientProvider = Provider<ApiClient>((ref) {
  final dio = criarDio(
    baseUrl: Env.validate(Env.baseUrl),
    sessao: ref.watch(sessionStoreProvider),
  );
  ref.onDispose(() => dio.close(force: true));
  return ApiClient(dio);
});
Dio criarDio({required String baseUrl, required SessionStore sessao}) {
  final dio = Dio(
    BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 15),
      sendTimeout: const Duration(seconds: 20),
      receiveTimeout: const Duration(seconds: 20),
      contentType: Headers.jsonContentType,
      responseType: ResponseType.plain,
      followRedirects: false,
      validateStatus: (status) => status != null && status < 300,
    ),
  );
  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) {
        if (options.path.startsWith('/api/patient/') && sessao.token != null) {
          options.headers['Authorization'] = 'Bearer ${sessao.token}';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        final status = error.response?.statusCode ?? 0;
        final requestToken = error.requestOptions.headers['Authorization'];
        // A resposta atrasada de uma sessão anterior não encerra a sessão nova.
        if (error.requestOptions.path.startsWith('/api/patient/') &&
            requestToken == 'Bearer ${sessao.token}' &&
            (status == 401 || status >= 500)) {
          await sessao.expire(invalid: status >= 500);
        }
        handler.next(error);
      },
    ),
  );
  return dio;
}

class ApiClient {
  ApiClient(this.dio);
  final Dio dio;
  Future<Object?> request(
    String path, {
    String method = 'GET',
    Json? data,
    Json? query,
  }) async {
    try {
      // Dio redefine responseType pelo tipo genérico: String preserva até
      // texto puro servido incorretamente como application/json.
      final response = await dio.request<String>(
        path,
        data: data,
        queryParameters: query,
        options: Options(method: method),
      );
      return response.data;
    } catch (error) {
      throw mapearErro(error);
    }
  }

  Future<Json> object(String path, {String method = 'GET', Json? data}) async =>
      requireObject(await request(path, method: method, data: data));
  Future<List<Json>> list(String path, {Json? query}) async =>
      requireList(await request(path, query: query));
}
