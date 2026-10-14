import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api_client.dart';
import '../../../core/endpoints.dart';
import 'app_notification.dart';
import '../../../core/failure.dart';

final notificationRepositoryProvider = Provider<NotificationRepository>(
  (ref) => NotificationRepository(ref.watch(apiClientProvider)),
);

class NotificationRepository {
  NotificationRepository(this.api);
  final ApiClient api;
  Future<List<AppNotification>> list() async =>
      (await api.list(Endpoints.notifications))
          .map(AppNotification.fromJson)
          .toList();
  Future<int> unreadCount() async {
    final value = int.tryParse(
      (await api.request(Endpoints.unreadCount)).toString().trim(),
    );
    if (value == null) throw const FalhaDeContrato();
    return value;
  }

  Future<List<AppNotification>> markRead(String id) async {
    await api.request(Endpoints.markRead(id), method: 'POST');
    return list();
  }

  Future<List<AppNotification>> markAllRead() async {
    await api.request(Endpoints.markAllRead, method: 'POST');
    return list();
  }
}
