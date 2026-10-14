import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:mocktail/mocktail.dart';

class MockAdapter extends Mock implements HttpClientAdapter {}

Dio fakeDio(ResponseBody Function(RequestOptions) respond) {
  registerFallbackValue(RequestOptions(path: '/'));
  final adapter = MockAdapter();
  when(() => adapter.fetch(any(), any(), any())).thenAnswer(
    (invocation) async =>
        respond(invocation.positionalArguments[0] as RequestOptions),
  );
  final dio = Dio(BaseOptions(responseType: ResponseType.plain));
  dio.httpClientAdapter = adapter;
  return dio;
}

class RecordingAdapter implements HttpClientAdapter {
  RecordingAdapter(this.respond);
  final ResponseBody Function(RequestOptions) respond;
  final requests = <RequestOptions>[];
  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    requests.add(options);
    return respond(options);
  }

  @override
  void close({bool force = false}) {}
}
