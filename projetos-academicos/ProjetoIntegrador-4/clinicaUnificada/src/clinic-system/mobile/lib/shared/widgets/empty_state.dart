import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../../l10n/strings.dart';

class EmptyState extends StatelessWidget {
  const EmptyState({super.key, this.message = S.empty, this.hint, this.action});
  final String message;
  final String? hint;
  final Widget? action;
  @override
  Widget build(BuildContext context) => ListView(
    physics: const AlwaysScrollableScrollPhysics(),
    padding: const EdgeInsets.all(24),
    children: [
      const SizedBox(height: 48),
      SvgPicture.asset(
        'assets/empty.svg',
        height: 96,
        excludeFromSemantics: true,
      ),
      const SizedBox(height: 24),
      Text(
        message,
        textAlign: TextAlign.center,
        style: Theme.of(context).textTheme.titleMedium,
      ),
      if (hint != null)
        Padding(
          padding: const EdgeInsets.only(top: 12),
          child: Text(hint!, textAlign: TextAlign.center),
        ),
      if (action != null)
        Padding(padding: const EdgeInsets.only(top: 20), child: action!),
    ],
  );
}
