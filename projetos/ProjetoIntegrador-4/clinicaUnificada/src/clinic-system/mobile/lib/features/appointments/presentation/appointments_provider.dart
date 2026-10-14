import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/presentation/session_provider.dart';
import '../data/appointment.dart';
import '../data/appointment_repository.dart';

final appointmentsProvider = FutureProvider<List<Appointment>>((ref) {
  ref.watch(sessionProvider.select((s) => s.generation));
  return ref.watch(appointmentRepositoryProvider).list();
});
final appointmentDetailProvider = FutureProvider.autoDispose
    .family<Appointment, String>((ref, id) {
      ref.watch(sessionProvider.select((s) => s.generation));
      return ref.watch(appointmentRepositoryProvider).detail(id);
    });
