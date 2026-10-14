import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api_client.dart';
import '../../../core/endpoints.dart';
import 'patient.dart';
import 'update_profile_request.dart';

final profileRepositoryProvider = Provider<ProfileRepository>(
  (ref) => ProfileRepository(ref.watch(apiClientProvider)),
);

class ProfileRepository {
  ProfileRepository(this.api);
  final ApiClient api;
  Future<Patient> get() async =>
      Patient.fromJson(await api.object(Endpoints.profile));
  Future<Patient> update(UpdateProfileRequest request) async {
    await api.request(Endpoints.profile, method: 'PUT', data: request.toJson());
    return get();
  }
}
