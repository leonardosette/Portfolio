import 'package:equatable/equatable.dart';

import '../../../core/json.dart';

class Specialty extends Equatable {
  const Specialty({required this.id, required this.name});
  final String id;
  final String name;
  factory Specialty.fromJson(Json json) =>
      Specialty(id: asString(json['id']), name: asString(json['name']));
  @override
  List<Object?> get props => [id, name];
  @override
  bool get stringify => false;
}
