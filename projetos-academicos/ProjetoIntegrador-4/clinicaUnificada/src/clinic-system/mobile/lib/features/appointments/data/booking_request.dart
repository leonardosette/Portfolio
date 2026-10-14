import '../../../core/json.dart';
import '../../../core/formatters.dart';
import '../domain/appointment_type.dart';

class BookingRequest {
  const BookingRequest({
    required this.clinicId,
    required this.doctorId,
    required this.scheduledAt,
    this.type = AppointmentType.firstVisit,
  });
  final String clinicId, doctorId;
  final DateTime scheduledAt;
  final AppointmentType type;
  Json toJson() => {
    'clinicId': clinicId,
    'doctorId': doctorId,
    'scheduledAt': scheduledAtWire(scheduledAt),
    'type': type.wire,
  };
}
