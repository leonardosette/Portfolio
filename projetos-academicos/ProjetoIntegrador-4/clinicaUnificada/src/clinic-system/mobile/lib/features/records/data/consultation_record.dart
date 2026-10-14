import 'package:equatable/equatable.dart';

import '../../../core/json.dart';
import 'prescription_item.dart';

class ConsultationRecord extends Equatable {
  const ConsultationRecord({
    required this.id,
    required this.appointmentId,
    required this.scheduledAt,
    required this.doctorName,
    required this.specialtyName,
    required this.clinicName,
    required this.chiefComplaint,
    required this.diagnosis,
    required this.cid10,
    required this.treatment,
    required this.notes,
    required this.prescriptionItems,
  });
  final String id,
      appointmentId,
      doctorName,
      specialtyName,
      clinicName,
      chiefComplaint,
      diagnosis,
      cid10,
      treatment,
      notes;
  final DateTime? scheduledAt;
  final List<PrescriptionItem> prescriptionItems;
  factory ConsultationRecord.fromJson(Json j) => ConsultationRecord(
    id: asString(j['id']),
    appointmentId: asString(j['appointmentId']),
    doctorName: asString(j['doctorName']),
    specialtyName: asString(j['specialtyName']),
    clinicName: asString(j['clinicName']),
    chiefComplaint: asString(j['chiefComplaint']),
    diagnosis: asString(j['diagnosis']),
    cid10: asString(j['cid10']),
    treatment: asString(j['treatment']),
    notes: asString(j['notes']),
    scheduledAt: asDateTimeOrNull(j['scheduledAt']),
    prescriptionItems: asObjectList(j['prescriptionItems'])
        .map(PrescriptionItem.fromJson)
        .toList(),
  );
  @override
  List<Object?> get props => [
    id,
    appointmentId,
    scheduledAt,
    doctorName,
    specialtyName,
    clinicName,
    chiefComplaint,
    diagnosis,
    cid10,
    treatment,
    notes,
    prescriptionItems,
  ];
  @override
  bool get stringify => false;
}
