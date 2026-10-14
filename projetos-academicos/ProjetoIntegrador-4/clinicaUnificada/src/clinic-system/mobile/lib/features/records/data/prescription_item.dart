import 'package:equatable/equatable.dart';

import '../../../core/json.dart';

class PrescriptionItem extends Equatable {
  const PrescriptionItem({
    required this.id,
    required this.medicationName,
    required this.dosage,
    required this.duration,
    required this.notes,
  });
  final String id;
  final String medicationName;
  final String dosage;
  final String duration;
  final String notes;
  factory PrescriptionItem.fromJson(Json json) => PrescriptionItem(
    id: asString(json['id']),
    medicationName: asString(json['medicationName']),
    dosage: asString(json['dosage']),
    duration: asString(json['duration']),
    notes: asString(json['notes']),
  );
  @override
  List<Object?> get props => [id, medicationName, dosage, duration, notes];
  @override
  bool get stringify => false;
}
