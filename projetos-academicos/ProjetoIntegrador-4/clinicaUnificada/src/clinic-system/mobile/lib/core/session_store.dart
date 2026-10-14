import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../features/auth/domain/session_state.dart';
import '../l10n/strings.dart';

class SessionStore extends ChangeNotifier {
  SessionStore({
    FlutterSecureStorage? secure,
    SharedPreferencesAsync? preferences,
  }) : _secure = secure ?? const FlutterSecureStorage(),
       _preferences = preferences ?? SharedPreferencesAsync();
  final FlutterSecureStorage _secure;
  final SharedPreferencesAsync _preferences;
  String? _token;
  String? get token => _token;
  SessionState state = const SessionState();
  Future<void> load() async {
    final raw = await _secure.read(key: 'scu.session');
    if (raw == null) {
      await clear();
      return;
    }
    try {
      final Object? value = jsonDecode(raw);
      if (value is! Map<String, Object?> ||
          value['role'] != 'ROLE_PATIENT' ||
          value['token'] is! String) {
        await clear();
        return;
      }
      _token = value['token']! as String;
      if (_token!.isEmpty) await clear();
    } on FormatException {
      await clear();
    }
  }

  Future<void> stage(String token) async {
    _token = token;
  }

  Future<void> activate({required String name, required String email}) async {
    await _secure.write(
      key: 'scu.session',
      value: jsonEncode({'token': _token, 'role': 'ROLE_PATIENT'}),
    );
    await _preferences.setString('scu.name', name);
    await _preferences.setString('scu.email', email);
    state = SessionState(
      ready: true,
      authenticated: true,
      generation: state.generation + 1,
      name: name,
      email: email,
    );
    notifyListeners();
  }

  Future<void> clear({String? message}) async {
    _token = null;
    state = SessionState(
      ready: true,
      generation: state.generation + 1,
      message: message,
    );
    notifyListeners();
    await _secure.delete(key: 'scu.session');
    await _preferences.remove('scu.name');
    await _preferences.remove('scu.email');
  }

  Future<void> expire({bool invalid = false}) =>
      clear(message: invalid ? S.invalidSession : S.expired);
}
