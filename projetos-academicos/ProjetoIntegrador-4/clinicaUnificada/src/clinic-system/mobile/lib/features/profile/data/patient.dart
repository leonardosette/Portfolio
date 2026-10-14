import 'package:equatable/equatable.dart';

import '../../../core/json.dart';

class Patient extends Equatable {
  const Patient({
    required this.id,
    required this.patientProfileId,
    required this.name,
    required this.email,
    required this.cpf,
    required this.birthDate,
    required this.active,
    required this.phone,
    required this.address,
    required this.bloodType,
    required this.allergies,
    required this.emergencyContactName,
    required this.emergencyContactPhone,
  });
  final String id;
  final String patientProfileId;
  final String name;
  final String email;
  final String cpf;
  final DateTime? birthDate;
  final bool active;
  final String phone;
  final String address;
  final String bloodType;
  final String allergies;
  final String emergencyContactName;
  final String emergencyContactPhone;
  factory Patient.fromJson(Json json) => Patient(
    id: asString(json['id']),
    patientProfileId: asString(json['patientProfileId']),
    name: asString(json['name']),
    email: asString(json['email']),
    cpf: asString(json['cpf']),
    birthDate: asDateOrNull(json['birthDate']),
    active: asBool(json['active']),
    phone: asString(json['phone']),
    address: asString(json['address']),
    bloodType: asString(json['bloodType']),
    allergies: asString(json['allergies']),
    emergencyContactName: asString(json['emergencyContactName']),
    emergencyContactPhone: asString(json['emergencyContactPhone']),
  );
  @override
  List<Object?> get props => [
    id,
    patientProfileId,
    name,
    email,
    cpf,
    birthDate,
    active,
    phone,
    address,
    bloodType,
    allergies,
    emergencyContactName,
    emergencyContactPhone,
  ];
  @override
  bool get stringify => false;
}
