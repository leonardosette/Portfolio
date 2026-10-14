import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/error_mapper.dart';
import '../core/failure.dart';
import '../features/auth/presentation/session_provider.dart';
import '../features/notifications/presentation/notifications_provider.dart';
import '../l10n/strings.dart';
import '../shared/theme/app_theme.dart';
import '../shared/widgets/error_state.dart';
import '../shared/widgets/loading_skeleton.dart';
import '../shared/widgets/offline_banner.dart';
import 'router.dart';

class ScuApp extends ConsumerStatefulWidget {
  const ScuApp({super.key, this.restoreSession = true});
  final bool restoreSession;
  @override
  ConsumerState<ScuApp> createState() => _ScuAppState();
}

class _ScuAppState extends ConsumerState<ScuApp> with WidgetsBindingObserver {
  bool loading = true;
  Object? error;
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    if (widget.restoreSession) {
      unawaited(restore());
    } else {
      loading = false;
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  Future<void> restore() async {
    setState(() {
      loading = true;
      error = null;
    });
    try {
      await ref.read(sessionProvider.notifier).restore();
    } catch (e) {
      if (mounted) setState(() => error = e is SessaoExpirada ? null : e);
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed &&
        ref.read(sessionProvider).authenticated) {
      ref.invalidate(unreadCountProvider);
      ref.invalidate(notificationsProvider);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = appTheme();
    const delegates = GlobalMaterialLocalizations.delegates;
    if (loading || error != null) {
      return MaterialApp(
        title: S.appName,
        theme: theme,
        locale: const Locale('pt', 'BR'),
        supportedLocales: const [Locale('pt', 'BR')],
        localizationsDelegates: delegates,
        home: Scaffold(
          appBar: AppBar(title: const Text(S.appName)),
          body: Column(
            children: [
              const OfflineBanner(),
              Expanded(
                child: loading
                    ? const LoadingSkeleton()
                    : ErrorState(
                        mensagem: mapearErro(error!).mensagem,
                        onRetry: restore,
                      ),
              ),
              if (!loading)
                TextButton(
                  onPressed: () async {
                    await ref.read(sessionProvider.notifier).logout();
                    if (mounted) setState(() => error = null);
                  },
                  child: const Text(S.logout),
                ),
            ],
          ),
        ),
      );
    }
    return MaterialApp.router(
      title: S.appName,
      debugShowCheckedModeBanner: false,
      theme: theme,
      locale: const Locale('pt', 'BR'),
      supportedLocales: const [Locale('pt', 'BR')],
      localizationsDelegates: delegates,
      routerConfig: ref.watch(routerProvider),
    );
  }
}
