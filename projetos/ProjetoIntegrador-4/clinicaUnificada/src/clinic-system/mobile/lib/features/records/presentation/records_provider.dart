import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/presentation/session_provider.dart';
import '../data/consultation_record.dart';
import '../data/record_repository.dart';

final recordsProvider = FutureProvider<List<ConsultationRecord>>((ref) {
  ref.watch(sessionProvider.select((s) => s.generation));
  return ref.watch(recordRepositoryProvider).list();
});

final recordDetailProvider = FutureProvider.autoDispose
    .family<ConsultationRecord, String>((ref, id) {
      ref.watch(sessionProvider.select((s) => s.generation));
      return ref.watch(recordRepositoryProvider).detail(id);
    });
