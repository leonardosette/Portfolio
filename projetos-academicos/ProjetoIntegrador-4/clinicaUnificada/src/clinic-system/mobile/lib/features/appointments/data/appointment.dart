import 'package:equatable/equatable.dart';

import '../../../core/json.dart';
import '../../booking/data/doctor_option.dart';
import '../domain/appointment_status.dart';
import '../domain/appointment_type.dart';

class Appointment extends Equatable {
  const Appointment({
    required this.id,
    required this.scheduledAt,
    required this.rawStatus,
    required this.rawType,
    required this.clinicName,
    required this.doctor,
  });
  final String id, rawStatus, rawType, clinicName;
  final DateTime? scheduledAt;
  final DoctorOption doctor;
  AppointmentStatus get status => AppointmentStatus.fromWire(rawStatus);
  AppointmentType get type => AppointmentType.fromWire(rawType);
  String get statusLabel =>
      status == AppointmentStatus.unknown ? rawStatus : status.label;
  String get typeLabel =>
      type == AppointmentType.unknown ? rawType : type.label;
  factory Appointment.fromJson(Json j) => Appointment(
    id: asString(j['id']),
    scheduledAt: asDateTimeOrNull(j['scheduledAt']),
    rawStatus: asString(j['status']),
    rawType: asString(j['type']),
    clinicName: asString(j['clinicName']),
    doctor: DoctorOption.fromJson(asObject(j['doctor'])),
  );
  @override
  List<Object?> get props => [
    id,
    scheduledAt,
    rawStatus,
    rawType,
    clinicName,
    doctor,
  ];
  @override
  bool get stringify => false;
}
