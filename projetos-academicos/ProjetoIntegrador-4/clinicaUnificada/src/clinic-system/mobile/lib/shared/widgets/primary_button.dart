import 'package:flutter/material.dart';

class PrimaryButton extends StatelessWidget {
  const PrimaryButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.busy = false,
    this.busyLabel,
  });
  final String label;
  final String? busyLabel;
  final VoidCallback? onPressed;
  final bool busy;
  @override
  Widget build(BuildContext context) => Semantics(
    button: true,
    label: busy ? (busyLabel ?? label) : label,
    excludeSemantics: true,
    child: SizedBox(
      width: double.infinity,
      child: FilledButton(
        onPressed: busy ? null : onPressed,
        child: Text(busy ? (busyLabel ?? label) : label),
      ),
    ),
  );
}
