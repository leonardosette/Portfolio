import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/formatters.dart';
import '../../../l10n/strings.dart';
import '../../../shared/widgets/async_value_view.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/paged_list.dart';
import '../../../shared/widgets/form_helpers.dart';
import '../../../shared/widgets/offline_banner.dart';
import '../data/app_notification.dart';
import '../data/notification_repository.dart';
import 'notifications_provider.dart';

class NotificationsPage extends ConsumerStatefulWidget {
  const NotificationsPage({super.key});
  @override
  ConsumerState<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends ConsumerState<NotificationsPage> {
  final locallyRead = <String>{};
  bool busy = false;
  @override
  void initState() {
    super.initState();
    Future<void>.microtask(() {
      if (mounted) {
        ref.invalidate(notificationsProvider);
        ref.invalidate(unreadCountProvider);
      }
    });
  }

  Future<void> refresh() async {
    await Future.wait([
      ref.refresh(notificationsProvider.future),
      ref.refresh(unreadCountProvider.future),
    ]);
  }

  Future<void> mark({AppNotification? item}) async {
    if (busy) return;
    setState(() {
      busy = true;
      if (item != null) locallyRead.add(item.id);
    });
    try {
      final repo = ref.read(notificationRepositoryProvider);
      if (item == null) {
        await repo.markAllRead();
      } else {
        await repo.markRead(item.id);
      }
      await refresh();
    } catch (e) {
      if (mounted) showFailure(context, e);
    } finally {
      if (mounted) {
        setState(() {
          busy = false;
          locallyRead.clear();
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text(S.notifications)),
    body: Column(
      children: [
        const OfflineBanner(),
        Align(
          alignment: Alignment.centerRight,
          child: TextButton(
            onPressed: busy ? null : () => mark(),
            child: const Text(S.markAllRead),
          ),
        ),
        Expanded(
          child: RefreshIndicator(
            onRefresh: refresh,
            child: AsyncValueView<List<AppNotification>>(
              value: ref.watch(notificationsProvider),
              onRetry: () => ref.invalidate(notificationsProvider),
              isEmpty: (items) => items.isEmpty,
              emptyBuilder: (context) =>
                  const EmptyState(message: S.noNotifications),
              onData: (items) => PagedList(
                items: items,
                itemBuilder: (item) {
                  final read = item.read || locallyRead.contains(item.id);
                  return Card(
                    color: read ? Colors.white : const Color(0xFFD1F5EA),
                    child: Semantics(
                      label: read ? item.title : '${item.title}. ${S.markRead}',
                      child: ListTile(
                        minVerticalPadding: 16,
                        leading: Icon(
                          read
                              ? Icons.notifications_none
                              : Icons.notifications_active,
                        ),
                        title: Text(item.title),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(item.body),
                            const SizedBox(height: 8),
                            Text(relativeTime(item.createdAt)),
                          ],
                        ),
                        onTap: read || busy ? null : () => mark(item: item),
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
        ),
      ],
    ),
  );
}
