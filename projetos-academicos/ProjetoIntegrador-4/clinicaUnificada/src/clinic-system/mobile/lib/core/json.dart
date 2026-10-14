import 'dart:convert';

import 'failure.dart';

typedef Json = Map<String, Object?>;
String asString(Object? value, {String fallback = ''}) =>
    value?.toString() ?? fallback;
String? asStringOrNull(Object? value) => value?.toString();
bool asBool(Object? value, {bool fallback = false}) => value is bool
    ? value
    : (value?.toString().toLowerCase() == 'true' ? true : fallback);
DateTime? asDateTimeOrNull(Object? value) => DateTime.tryParse(asString(value));
DateTime? asDateOrNull(Object? value) {
  final raw = asString(value);
  if (!RegExp(r'^\d{4}-\d{2}-\d{2}$').hasMatch(raw)) return null;
  final parsed = DateTime.tryParse(raw);
  if (parsed == null ||
      parsed.year.toString().padLeft(4, '0') != raw.substring(0, 4) ||
      parsed.month != int.parse(raw.substring(5, 7)) ||
      parsed.day != int.parse(raw.substring(8, 10))) {
    return null;
  }
  return DateTime(parsed.year, parsed.month, parsed.day);
}

Json asObject(Object? value) =>
    value is Map<String, Object?> ? value : const {};
List<Json> asObjectList(Object? value) =>
    value is List<Object?> ? value.whereType<Json>().toList() : const [];
Object? decodeBody(Object? body) {
  if (body is! String) return body;
  if (body.trim().isEmpty) return null;
  try {
    return jsonDecode(body);
  } on FormatException {
    throw const FalhaDeContrato();
  }
}

Json requireObject(Object? body) {
  final value = decodeBody(body);
  if (value is! Json) throw const FalhaDeContrato();
  return value;
}

List<Json> requireList(Object? body) {
  final value = decodeBody(body);
  if (value is! List<Object?>) throw const FalhaDeContrato();
  return asObjectList(value);
}
