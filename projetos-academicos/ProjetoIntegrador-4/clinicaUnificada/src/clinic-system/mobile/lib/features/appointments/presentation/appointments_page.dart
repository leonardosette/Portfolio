import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../l10n/strings.dart';
import '../../../shared/widgets/async_value_view.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/paged_list.dart';
import '../data/appointment.dart';
import '../domain/appointment_status.dart';
import 'appointments_provider.dart';
import 'appointment_detail_sheet.dart';

class AppointmentsPage extends ConsumerStatefulWidget {
  const AppointmentsPage({super.key});
  @override
  ConsumerState<AppointmentsPage> createState() => _AppointmentsPageState();
}

class _AppointmentsPageState extends ConsumerState<AppointmentsPage> {
  AppointmentStatus? filter;
  @override
  Widget build(BuildContext context) {
    final value = ref
        .watch(appointmentsProvider)
        .whenData(
          (items) =>
              items.where((a) => filter == null || a.status == filter).toList(),
        );
    return Column(
      children: [
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              for (final item in <(AppointmentStatus?, String)>[
                (null, S.all),
                (AppointmentStatus.pending, S.pending),
                (AppointmentStatus.scheduled, S.scheduledFilter),
                (AppointmentStatus.completed, S.completedFilter),
                (AppointmentStatus.cancelled, S.cancelledFilter),
              ])
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(item.$2),
                    selected: filter == item.$1,
                    onSelected: (_) => setState(() => filter = item.$1),
                    materialTapTargetSize: MaterialTapTargetSize.padded,
                  ),
                ),
            ],
          ),
        ),
        Expanded(
          child: RefreshIndicator(
            onRefresh: () async {
              await ref.refresh(appointmentsProvider.future).then((_) {});
            },
            child: AsyncValueView<List<Appointment>>(
              value: value,
              onRetry: () => ref.invalidate(appointmentsProvider),
              isEmpty: (items) => items.isEmpty,
              emptyBuilder: (context) => EmptyState(
                message: S.noAppointments,
                action: FilledButton(
                  onPressed: () => context.go('/agendar'),
                  child: const Text(S.booking),
                ),
              ),
              onData: (items) => PagedList(
                items: items,
                itemBuilder: (item) => AppointmentCard(appointment: item),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
