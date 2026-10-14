import 'dart:convert';

import 'package:dio/dio.dart';

import '../l10n/strings.dart';
import 'failure.dart';

Failure mapearErro(Object error) {
  if (error is Failure) return error;
  if (error is! DioException) return const FalhaDeContrato();
  final status = error.response?.statusCode;
  if (status != null) {
    return switch (status) {
      400 => FalhaDeRequisicao(extractMessage(error.response?.data)),
      401 =>
        error.requestOptions.path == '/api/auth/login'
            ? FalhaDeRequisicao(
                extractMessage(
                  error.response?.data,
                  fallback: S.invalidCredentials,
                ),
              )
            : const SessaoExpirada(),
      403 => const AcessoNegado(),
      404 => const NaoEncontrado(),
      >= 500 =>
        error.requestOptions.path.startsWith('/api/patient/')
            ? const SessaoExpirada(S.invalidSession)
            : const FalhaDoServidor(),
      _ => const FalhaDeContrato(),
    };
  }
  return switch (error.type) {
    DioExceptionType.connectionTimeout ||
    DioExceptionType.sendTimeout ||
    DioExceptionType.receiveTimeout => const FalhaDeTimeout(),
    DioExceptionType.connectionError ||
    DioExceptionType.unknown => const FalhaDeRede(),
    _ => const FalhaDeContrato(),
  };
}

String extractMessage(Object? body, {String fallback = S.requestError}) {
  if (body == null) return fallback;
  if (body is Map<String, Object?>) {
    final message = body['message'];
    return message is String && message.trim().isNotEmpty ? message : fallback;
  }
  final raw = body.toString().trim();
  if (raw.isEmpty) return fallback;
  try {
    final Object? decoded = jsonDecode(raw);
    if (decoded is Map<String, Object?>) {
      return extractMessage(decoded, fallback: fallback);
    }
  } on FormatException {
    return raw;
  }
  return raw;
}
