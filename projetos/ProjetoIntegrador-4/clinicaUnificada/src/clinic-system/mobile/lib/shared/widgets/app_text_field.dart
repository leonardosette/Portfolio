import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class AppTextField extends StatelessWidget {
  const AppTextField({
    super.key,
    required this.controller,
    required this.label,
    this.validator,
    this.keyboardType,
    this.formatters,
    this.obscure = false,
    this.suffix,
    this.lines = 1,
    this.onChanged,
    this.maxLength,
    this.autofillHints,
  });
  final TextEditingController controller;
  final String label;
  final String? Function(String?)? validator;
  final TextInputType? keyboardType;
  final List<TextInputFormatter>? formatters;
  final bool obscure;
  final Widget? suffix;
  final int lines;
  final int? maxLength;
  final ValueChanged<String>? onChanged;
  final Iterable<String>? autofillHints;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 16),
    child: TextFormField(
      controller: controller,
      decoration: InputDecoration(labelText: label, suffixIcon: suffix),
      validator: validator,
      keyboardType: keyboardType,
      inputFormatters: formatters,
      obscureText: obscure,
      enableSuggestions: !obscure,
      autocorrect: !obscure,
      maxLines: lines,
      maxLength: maxLength,
      onChanged: onChanged,
      autofillHints: autofillHints,
    ),
  );
}
