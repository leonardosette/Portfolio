import 'package:flutter/material.dart';

import '../../core/error_mapper.dart';
import '../../core/formatters.dart';
import '../../l10n/strings.dart';

String? emailValidator(String? value) =>
    RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(value?.trim() ?? '')
    ? null
    : S.validEmail;
void showFailure(BuildContext context, Object error) =>
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(mapearErro(error).mensagem)));
void showMessage(BuildContext context, String message) =>
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(message)));
Future<bool> confirmAction(
  BuildContext context,
  String message,
  String action,
) async =>
    await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text(S.back),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text(action),
          ),
        ],
      ),
    ) ??
    false;

class DateField extends StatelessWidget {
  const DateField({
    super.key,
    required this.label,
    required this.value,
    required this.onChanged,
    this.firstDate,
    this.lastDate,
    this.required = false,
  });
  final String label;
  final DateTime? value, firstDate, lastDate;
  final ValueChanged<DateTime?> onChanged;
  final bool required;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 16),
    child: Row(
      children: [
        Expanded(
          child: OutlinedButton.icon(
            icon: const Icon(Icons.calendar_today_outlined),
            label: Text('$label: ${dateLabel(value)}'),
            onPressed: () async {
              final min = firstDate ?? DateTime(1900),
                  max = lastDate ?? DateTime(2100);
              final initial = value ?? DateTime.now();
              final selected = await showDatePicker(
                context: context,
                initialDate: initial.isBefore(min)
                    ? min
                    : initial.isAfter(max)
                    ? max
                    : initial,
                firstDate: min,
                lastDate: max,
                locale: const Locale('pt', 'BR'),
              );
              if (selected != null) onChanged(selected);
            },
          ),
        ),
        if (!required && value != null)
          IconButton(
            tooltip: S.clear,
            onPressed: () => onChanged(null),
            icon: const Icon(Icons.clear),
          ),
      ],
    ),
  );
}

class InlineError extends StatelessWidget {
  const InlineError({super.key, required this.message});
  final String? message;
  @override
  Widget build(BuildContext context) => message == null
      ? const SizedBox.shrink()
      : Semantics(
          liveRegion: true,
          child: Container(
            margin: const EdgeInsets.symmetric(vertical: 12),
            padding: const EdgeInsets.all(12),
            color: const Color(0xFFF8D7DA),
            child: Text(
              message!,
              style: const TextStyle(color: Color(0xFF842029)),
            ),
          ),
        );
}
