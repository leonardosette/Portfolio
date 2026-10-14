import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api_client.dart';
import '../../../core/endpoints.dart';
import 'clinic.dart';
import 'specialty.dart';
import 'doctor_option.dart';

final bookingRepositoryProvider = Provider<BookingRepository>(
  (ref) => BookingRepository(ref.watch(apiClientProvider)),
);

class BookingRepository {
  BookingRepository(this.api);
  final ApiClient api;
  Future<List<Clinic>> clinics() async =>
      (await api.list(Endpoints.clinics)).map(Clinic.fromJson).toList();
  Future<List<Specialty>> specialties(String clinicId) async =>
      (await api.list(Endpoints.specialties(clinicId)))
          .map(Specialty.fromJson)
          .toList();
  Future<List<DoctorOption>> doctors(
    String clinicId,
    String? specialtyId,
  ) async => (await api.list(
    Endpoints.doctors(clinicId),
    query: specialtyId == null ? null : {'specialtyId': specialtyId},
  )).map(DoctorOption.fromJson).toList();
}
