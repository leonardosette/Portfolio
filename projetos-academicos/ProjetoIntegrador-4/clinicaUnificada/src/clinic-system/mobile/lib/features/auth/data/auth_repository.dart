import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api_client.dart';
import '../../../core/endpoints.dart';
import 'login_response.dart';
import 'register_request.dart';

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepository(ref.watch(apiClientProvider)),
);

class AuthRepository {
  AuthRepository(this.api);
  final ApiClient api;
  Future<LoginResponse> login(String email, String password) async =>
      LoginResponse.fromJson(
        await api.object(
          Endpoints.login,
          method: 'POST',
          data: {'email': email.trim(), 'password': password},
        ),
      );
  Future<void> register(RegisterRequest request) async {
    await api.request(
      Endpoints.register,
      method: 'POST',
      data: request.toJson(),
    );
  }
}
