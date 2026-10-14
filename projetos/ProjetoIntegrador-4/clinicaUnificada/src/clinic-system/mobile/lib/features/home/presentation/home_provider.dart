import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../appointments/data/appointment.dart';
import '../../appointments/domain/appointment_status.dart';
import '../../appointments/presentation/appointments_provider.dart';

class HomeSummary {
  HomeSummary(List<Appointment> all, {DateTime? now}) {
    final today = now ?? DateTime.now();
    upcoming =
        all
            .where(
              (a) =>
                  a.status == AppointmentStatus.scheduled ||
                  a.status == AppointmentStatus.inProgress,
            )
            .toList()
          ..sort(
            (a, b) => (a.scheduledAt ?? DateTime(9999)).compareTo(
              b.scheduledAt ?? DateTime(9999),
            ),
          );
    month = all
        .where(
          (a) =>
              a.scheduledAt?.year == today.year &&
              a.scheduledAt?.month == today.month,
        )
        .length;
    total = all.length;
  }
  late final List<Appointment> upcoming;
  late final int month, total;
}

final homeProvider = Provider<AsyncValue<HomeSummary>>(
  (ref) =>
      ref.watch(appointmentsProvider).whenData((items) => HomeSummary(items)),
);
