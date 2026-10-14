import 'package:flutter/material.dart';

import '../../l10n/strings.dart';

class ErrorState extends StatelessWidget {
  const ErrorState({super.key, required this.mensagem, required this.onRetry});
  final String mensagem;
  final VoidCallback onRetry;
  @override
  Widget build(BuildContext context) => ListView(
    physics: const AlwaysScrollableScrollPhysics(),
    padding: const EdgeInsets.all(24),
    children: [
      const Icon(Icons.error_outline, size: 48),
      const SizedBox(height: 16),
      Semantics(
        liveRegion: true,
        child: Text(mensagem, textAlign: TextAlign.center),
      ),
      const SizedBox(height: 16),
      FilledButton(onPressed: onRetry, child: const Text(S.retry)),
    ],
  );
}
