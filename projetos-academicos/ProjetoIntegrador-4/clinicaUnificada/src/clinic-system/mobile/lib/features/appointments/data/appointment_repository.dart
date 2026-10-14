import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api_client.dart';
import '../../../core/endpoints.dart';
import '../../../core/reload_result.dart';
import 'appointment.dart';
import 'booking_request.dart';

final appointmentRepositoryProvider = Provider<AppointmentRepository>(
  (ref) => AppointmentRepository(ref.watch(apiClientProvider)),
);

class AppointmentRepository {
  AppointmentRepository(this.api);
  final ApiClient api;
  Future<List<Appointment>> list() async =>
      (await api.list(Endpoints.appointments))
          .map(Appointment.fromJson)
          .toList();
  Future<Appointment> detail(String id) async =>
      Appointment.fromJson(await api.object(Endpoints.appointment(id)));
  Future<List<Appointment>> cancel(String id) async {
    await api.request(Endpoints.appointment(id), method: 'DELETE');
    return list();
  }

  Future<ReloadResult<List<Appointment>>> book(BookingRequest request) async {
    await api.request(
      Endpoints.appointments,
      method: 'POST',
      data: request.toJson(),
    );
    return reloadAfterWrite(list);
  }
}
