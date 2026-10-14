import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api_client.dart';
import '../../../core/endpoints.dart';
import 'consultation_record.dart';

final recordRepositoryProvider = Provider<RecordRepository>(
  (ref) => RecordRepository(ref.watch(apiClientProvider)),
);

class RecordRepository {
  RecordRepository(this.api);
  final ApiClient api;
  Future<List<ConsultationRecord>> list() async {
    final items = (await api.list(Endpoints.records))
        .map(ConsultationRecord.fromJson)
        .toList();
    items.sort(
      (a, b) => (b.scheduledAt ?? DateTime(1)).compareTo(
        a.scheduledAt ?? DateTime(1),
      ),
    );
    return items;
  }

  Future<ConsultationRecord> detail(String appointmentId) async =>
      ConsultationRecord.fromJson(
        await api.object(Endpoints.record(appointmentId)),
      );
}
