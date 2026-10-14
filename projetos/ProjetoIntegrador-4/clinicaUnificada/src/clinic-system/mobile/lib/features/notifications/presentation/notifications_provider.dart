import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/presentation/session_provider.dart';
import '../data/app_notification.dart';
import '../data/notification_repository.dart';

final notificationsProvider = FutureProvider<List<AppNotification>>((ref) {
  ref.watch(sessionProvider.select((s) => s.generation));
  return ref.watch(notificationRepositoryProvider).list();
});

final unreadCountProvider = FutureProvider<int>((ref) {
  ref.watch(sessionProvider.select((s) => s.generation));
  return ref.watch(notificationRepositoryProvider).unreadCount();
});
