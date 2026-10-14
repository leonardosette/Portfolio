import 'package:flutter/material.dart';

import '../../features/appointments/data/appointment.dart';
import '../../features/appointments/domain/appointment_status.dart';

class StatusBadge extends StatelessWidget {
  const StatusBadge({super.key, required this.appointment});
  final Appointment appointment;
  @override
  Widget build(BuildContext context) {
    final (background, foreground) = switch (appointment.status) {
      AppointmentStatus.pending => (0xFFF3E8FF, 0xFF6F42C1),
      AppointmentStatus.scheduled => (0xFFE8F4FD, 0xFF0B5ED7),
      AppointmentStatus.inProgress => (0xFFFFF3CD, 0xFF856404),
      AppointmentStatus.completed => (0xFFD1F5EA, 0xFF0F6848),
      AppointmentStatus.cancelled => (0xFFF8D7DA, 0xFF842029),
      _ => (0xFFEEEEEE, 0xFF212529),
    };
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: Color(background),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          appointment.statusLabel,
          style: TextStyle(color: Color(foreground)),
        ),
      ),
    );
  }
}
