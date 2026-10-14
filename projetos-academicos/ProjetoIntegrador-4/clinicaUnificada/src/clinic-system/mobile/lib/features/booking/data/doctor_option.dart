import 'package:equatable/equatable.dart';

import '../../../core/json.dart';

class DoctorOption extends Equatable {
  const DoctorOption({
    required this.id,
    required this.name,
    required this.specialtyName,
    required this.specialtyId,
  });
  final String id;
  final String name;
  final String specialtyName;
  final String specialtyId;
  factory DoctorOption.fromJson(Json json) => DoctorOption(
    id: asString(json['id']),
    name: asString(json['name']),
    specialtyName: asString(json['specialtyName']),
    specialtyId: asString(json['specialtyId']),
  );
  @override
  List<Object?> get props => [id, name, specialtyName, specialtyId];
  @override
  bool get stringify => false;
}
