import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api_client.dart';
import '../../../core/error_mapper.dart';
import '../../../core/failure.dart';
import '../../../l10n/strings.dart';
import '../../profile/data/profile_repository.dart';
import '../data/auth_repository.dart';
import '../data/register_request.dart';
import '../domain/session_state.dart';

final sessionProvider = NotifierProvider<SessionController, SessionState>(
  SessionController.new,
);

class SessionController extends Notifier<SessionState> {
  @override
  SessionState build() {
    final store = ref.watch(sessionStoreProvider);
    void listener() {
      state = store.state;
    }

    store.addListener(listener);
    ref.onDispose(() => store.removeListener(listener));
    return store.state;
  }

  Future<void> restore() async {
    final store = ref.read(sessionStoreProvider);
    await store.load();
    if (store.token == null) return;
    final profile = await ref.read(profileRepositoryProvider).get();
    await store.activate(name: profile.name, email: profile.email);
  }

  Future<void> login(String email, String password) async {
    final store = ref.read(sessionStoreProvider);
    final response = await ref
        .read(authRepositoryProvider)
        .login(email, password);
    if (response.role != 'ROLE_PATIENT') {
      await store.clear();
      throw const FalhaDeRequisicao(S.patientOnly);
    }
    if (response.token.isEmpty) throw const FalhaDeContrato();
    await store.stage(response.token);
    try {
      final profile = await ref.read(profileRepositoryProvider).get();
      await store.activate(name: profile.name, email: profile.email);
    } catch (error) {
      await store.clear();
      throw mapearErro(error);
    }
  }

  Future<bool> register(RegisterRequest request) async {
    await ref.read(authRepositoryProvider).register(request);
    try {
      await login(request.email, request.password);
      return true;
    } catch (_) {
      await ref.read(sessionStoreProvider).clear(message: S.accountCreated);
      return false;
    }
  }

  Future<void> logout() => ref.read(sessionStoreProvider).clear();
}
