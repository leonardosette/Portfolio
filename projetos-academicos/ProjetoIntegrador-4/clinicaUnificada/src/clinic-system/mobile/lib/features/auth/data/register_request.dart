import '../../../core/json.dart';
import '../../../core/formatters.dart';

class RegisterRequest {
  const RegisterRequest({
    required this.name,
    required this.email,
    required this.cpf,
    required this.birthDate,
    required this.password,
  });
  final String name, email, cpf, password;
  final DateTime birthDate;
  Json toJson() => {
    'name': name.trim(),
    'email': email.trim(),
    'cpf': digits(cpf),
    'birthDate': dateWire(birthDate),
    'password': password,
  };
}
