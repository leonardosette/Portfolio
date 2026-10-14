import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/presentation/session_provider.dart';
import '../data/booking_repository.dart';
import '../data/clinic.dart';
import '../data/specialty.dart';
import '../data/doctor_option.dart';

final clinicsProvider = FutureProvider<List<Clinic>>((ref) {
  ref.watch(sessionProvider.select((s) => s.generation));
  return ref.watch(bookingRepositoryProvider).clinics();
});
final specialtiesProvider = FutureProvider.autoDispose
    .family<List<Specialty>, String>((ref, id) {
      ref.watch(sessionProvider.select((s) => s.generation));
      return ref.watch(bookingRepositoryProvider).specialties(id);
    });
typedef DoctorQuery = ({String clinicId, String? specialtyId});
final doctorsProvider = FutureProvider.autoDispose
    .family<List<DoctorOption>, DoctorQuery>((ref, q) {
      ref.watch(sessionProvider.select((s) => s.generation));
      return ref
          .watch(bookingRepositoryProvider)
          .doctors(q.clinicId, q.specialtyId);
    });
