import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/presentation/session_provider.dart';
import '../data/insurance.dart';
import '../data/insurance_repository.dart';

final insuranceProvider = FutureProvider<List<Insurance>>((ref) {
  ref.watch(sessionProvider.select((s) => s.generation));
  return ref.watch(insuranceRepositoryProvider).list();
});
