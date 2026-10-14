import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/presentation/session_provider.dart';
import '../data/patient.dart';
import '../data/profile_repository.dart';

final profileProvider = FutureProvider<Patient>((ref) {
  ref.watch(sessionProvider.select((s) => s.generation));
  return ref.watch(profileRepositoryProvider).get();
});
