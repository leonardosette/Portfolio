import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../l10n/strings.dart';

final connectivityProvider = StreamProvider<List<ConnectivityResult>>((
  ref,
) async* {
  final connectivity = Connectivity();
  yield await connectivity.checkConnectivity();
  yield* connectivity.onConnectivityChanged;
});

class OnlineBody extends StatelessWidget {
  const OnlineBody({super.key, required this.child});
  final Widget child;
  @override
  Widget build(BuildContext context) => Column(
    children: [
      const OfflineBanner(),
      Expanded(child: child),
    ],
  );
}

class OfflineBanner extends ConsumerWidget {
  const OfflineBanner({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final offline =
        ref
            .watch(connectivityProvider)
            .asData
            ?.value
            .contains(ConnectivityResult.none) ??
        false;
    return offline
        ? Semantics(
            liveRegion: true,
            child: Container(
              width: double.infinity,
              color: const Color(0xFFFFF3CD),
              padding: const EdgeInsets.all(12),
              child: const Text(
                S.offline,
                textAlign: TextAlign.center,
                style: TextStyle(color: Color(0xFF664D03)),
              ),
            ),
          )
        : const SizedBox.shrink();
  }
}
