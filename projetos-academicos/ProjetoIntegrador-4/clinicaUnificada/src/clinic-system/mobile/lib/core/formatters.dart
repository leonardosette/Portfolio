import 'package:intl/intl.dart';

String dateLabel(DateTime? value) =>
    value == null ? '—' : DateFormat('dd/MM/yyyy', 'pt_BR').format(value);
String dateTimeLabel(DateTime? value) => value == null
    ? '—'
    : DateFormat('dd/MM/yyyy, HH:mm', 'pt_BR').format(value);
String dateWire(DateTime value) => DateFormat('yyyy-MM-dd').format(value);
String scheduledAtWire(DateTime value) =>
    DateFormat("yyyy-MM-dd'T'HH:mm").format(value);
String digits(String value) => value.replaceAll(RegExp(r'\D'), '');
bool validCpf(String value) => digits(value).length == 11;
String cpfLabel(String value) {
  final d = digits(value);
  return d.length == 11
      ? '${d.substring(0, 3)}.${d.substring(3, 6)}.${d.substring(6, 9)}-${d.substring(9)}'
      : value;
}

String phoneLabel(String value) {
  final d = digits(value);
  return d.length == 10 || d.length == 11
      ? '(${d.substring(0, 2)}) ${d.substring(2, d.length - 4)}-${d.substring(d.length - 4)}'
      : value;
}

String initials(String name) {
  final words = name
      .trim()
      .split(RegExp(r'\s+'))
      .where((v) => v.isNotEmpty)
      .take(2);
  return words.isEmpty ? '?' : words.map((v) => v[0]).join().toUpperCase();
}

String relativeTime(DateTime? value, {DateTime? now}) {
  if (value == null) return '—';
  final delta = (now ?? DateTime.now()).difference(value);
  if (delta.inMinutes < 1) return 'agora';
  if (delta.inMinutes < 60) return 'há ${delta.inMinutes}min';
  if (delta.inHours < 24) return 'há ${delta.inHours}h';
  return 'há ${delta.inDays}d';
}
