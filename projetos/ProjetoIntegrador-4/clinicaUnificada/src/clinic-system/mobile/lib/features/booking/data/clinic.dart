import 'package:equatable/equatable.dart';

import '../../../core/json.dart';

class Clinic extends Equatable {
  const Clinic({
    required this.id,
    required this.name,
    required this.address,
    required this.phone,
  });
  final String id;
  final String name;
  final String address;
  final String phone;
  factory Clinic.fromJson(Json json) => Clinic(
    id: asString(json['id']),
    name: asString(json['name']),
    address: asString(json['address']),
    phone: asString(json['phone']),
  );
  @override
  List<Object?> get props => [id, name, address, phone];
  @override
  bool get stringify => false;
}
