import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/error_mapper.dart';
import '../../l10n/strings.dart';
import 'empty_state.dart';
import 'error_state.dart';
import 'loading_skeleton.dart';

class AsyncValueView<T> extends StatelessWidget {
  const AsyncValueView({
    super.key,
    required this.value,
    required this.onData,
    required this.onRetry,
    this.isEmpty,
    this.emptyBuilder,
    this.skeleton,
  });
  final AsyncValue<T> value;
  final Widget Function(T) onData;
  final VoidCallback onRetry;
  final bool Function(T)? isEmpty;
  final WidgetBuilder? emptyBuilder;
  final Widget? skeleton;
  @override
  Widget build(BuildContext context) => value.when(
    skipLoadingOnRefresh: false,
    loading: () => skeleton ?? const LoadingSkeleton(),
    error: (error, stack) =>
        ErrorState(mensagem: mapearErro(error).mensagem, onRetry: onRetry),
    data: (data) => (isEmpty?.call(data) ?? false)
        ? Column(
            children: [
              Expanded(
                child: emptyBuilder?.call(context) ?? const EmptyState(),
              ),
              TextButton(onPressed: onRetry, child: const Text(S.retry)),
            ],
          )
        : onData(data),
  );
}
