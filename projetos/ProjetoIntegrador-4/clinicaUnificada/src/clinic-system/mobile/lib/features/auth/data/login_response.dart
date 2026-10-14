import 'package:equatable/equatable.dart';

import '../../../core/json.dart';

class LoginResponse extends Equatable {
  const LoginResponse({
    required this.token,
    required this.name,
    required this.email,
    required this.role,
  });
  final String token;
  final String name;
  final String email;
  final String role;
  factory LoginResponse.fromJson(Json json) => LoginResponse(
    token: asString(json['token']),
    name: asString(json['name']),
    email: asString(json['email']),
    role: asString(json['role']),
  );
  @override
  List<Object?> get props => [token, name, email, role];
  @override
  bool get stringify => false;
}
