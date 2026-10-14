import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../l10n/strings.dart';
import '../../../shared/widgets/async_value_view.dart';
import '../../../shared/widgets/section_card.dart';
import '../../appointments/presentation/appointment_detail_sheet.dart';
import '../../appointments/presentation/appointments_provider.dart';
import '../../notifications/presentation/notifications_provider.dart';
import '../../auth/presentation/session_provider.dart';
import 'home_provider.dart';

class HomePage extends ConsumerWidget {
  const HomePage({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) => RefreshIndicator(
    onRefresh: () async {
      await Future.wait([
        ref.refresh(appointmentsProvider.future),
        ref.refresh(unreadCountProvider.future),
      ]);
    },
    child: AsyncValueView<HomeSummary>(
      value: ref.watch(homeProvider),
      onRetry: () {
        ref.invalidate(appointmentsProvider);
        ref.invalidate(unreadCountProvider);
      },
      onData: (summary) => ListView(
        padding: const EdgeInsets.all(16),
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          Text(
            S.greeting(ref.watch(sessionProvider).name),
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 16),
          HomeStatistics(summary: summary),
          const SizedBox(height: 16),
          if (summary.upcoming.isEmpty)
            SectionCard(
              title: S.nextAppointment,
              children: [
                const Text(S.noScheduled),
                TextButton(
                  onPressed: () => context.go('/agendar'),
                  child: const Text(S.booking),
                ),
              ],
            )
          else ...[
            Text(
              S.nextAppointment,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            AppointmentCard(appointment: summary.upcoming.first),
          ],
          if (summary.upcoming.length > 1) ...[
            Text(
              S.nextAppointments,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            for (final item in summary.upcoming.skip(1).take(3))
              AppointmentCard(appointment: item),
          ],
        ],
      ),
    ),
  );
}

class HomeStatistics extends StatelessWidget {
  const HomeStatistics({super.key, required this.summary});
  final HomeSummary summary;
  @override
  Widget build(BuildContext context) {
    final cards = [
      for (final stat in [
        (summary.upcoming.length, S.scheduledCount),
        (summary.month, S.monthCount),
        (summary.total, S.totalCount),
      ])
        Card(
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${stat.$1}',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                const SizedBox(height: 8),
                Text(stat.$2),
              ],
            ),
          ),
        ),
    ];
    if (MediaQuery.textScalerOf(context).scale(14) > 20) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: cards,
      );
    }
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [for (final card in cards) Expanded(child: card)],
      ),
    );
  }
}
