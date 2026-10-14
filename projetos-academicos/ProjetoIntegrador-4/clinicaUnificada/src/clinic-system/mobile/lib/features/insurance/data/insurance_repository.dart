import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api_client.dart';
import '../../../core/endpoints.dart';
import '../../../core/reload_result.dart';
import 'insurance.dart';
import 'insurance_request.dart';

final insuranceRepositoryProvider = Provider<InsuranceRepository>(
  (ref) => InsuranceRepository(ref.watch(apiClientProvider)),
);

class InsuranceRepository {
  InsuranceRepository(this.api);
  final ApiClient api;
  Future<List<Insurance>> list() async =>
      (await api.list(Endpoints.insurance)).map(Insurance.fromJson).toList();
  Future<ReloadResult<List<Insurance>>> save(
    InsuranceRequest request, {
    String? id,
  }) async {
    await api.request(
      id == null ? Endpoints.insurance : Endpoints.insuranceItem(id),
      method: id == null ? 'POST' : 'PUT',
      data: request.toJson(),
    );
    return reloadAfterWrite(list);
  }

  Future<List<Insurance>> remove(String id) async {
    await api.request(Endpoints.insuranceItem(id), method: 'DELETE');
    return list();
  }

  Future<List<Insurance>> principal(String id) async {
    await api.request(Endpoints.principal(id), method: 'POST');
    return list();
  }
}
