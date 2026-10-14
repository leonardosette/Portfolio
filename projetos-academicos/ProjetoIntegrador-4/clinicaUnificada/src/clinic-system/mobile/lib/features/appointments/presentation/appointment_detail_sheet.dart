import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/formatters.dart';
import '../../../l10n/strings.dart';
import '../../../shared/widgets/status_badge.dart';
import '../../../shared/widgets/form_helpers.dart';
import '../../../shared/widgets/async_value_view.dart';
import '../../notifications/presentation/notifications_provider.dart';
import '../data/appointment.dart';
import '../data/appointment_repository.dart';
import 'appointments_provider.dart';

class AppointmentCard extends StatelessWidget {
  const AppointmentCard({super.key, required this.appointment});
  final Appointment appointment;
  @override
  Widget build(BuildContext context) {
    final date = appointment.scheduledAt;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 52,
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFD1F5EA),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    children: [
                      Text(
                        date == null ? '—' : DateFormat('dd').format(date),
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      Text(
                        date == null
                            ? '—'
                            : DateFormat(
                                'MMM',
                                'pt_BR',
                              ).format(date).replaceAll('.', '').toUpperCase(),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        appointment.doctor.name,
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      Text(
                        '${appointment.doctor.specialtyName} · ${appointment.clinicName} · ${dateTimeLabel(date)}',
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            StatusBadge(appointment: appointment),
            Wrap(
              spacing: 8,
              children: [
                TextButton(
                  onPressed: () =>
                      showAppointmentDetail(context, appointment.id),
                  child: const Text(S.details),
                ),
                if (appointment.status.cancelavel)
                  CancelAppointmentButton(appointment: appointment),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

Future<void> showAppointmentDetail(BuildContext context, String id) async {
  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    builder: (context) => SizedBox(
      height: MediaQuery.sizeOf(context).height * .8,
      child: AppointmentDetailSheet(id: id),
    ),
  );
}

class AppointmentDetailSheet extends ConsumerWidget {
  const AppointmentDetailSheet({super.key, required this.id});
  final String id;
  @override
  Widget build(
    BuildContext context,
    WidgetRef ref,
  ) => AsyncValueView<Appointment>(
    value: ref.watch(appointmentDetailProvider(id)),
    onRetry: () => ref.invalidate(appointmentDetailProvider(id)),
    onData: (item) => ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Text(S.myAppointments, style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 16),
        Text('${S.doctor}: ${item.doctor.name} — ${item.doctor.specialtyName}'),
        Text('${S.dateTime}: ${dateTimeLabel(item.scheduledAt)}'),
        Text('${S.clinic}: ${item.clinicName}'),
        Text('${S.type}: ${item.typeLabel}'),
        const SizedBox(height: 12),
        StatusBadge(appointment: item),
        if (item.status.cancelavel) CancelAppointmentButton(appointment: item),
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text(S.back),
        ),
      ],
    ),
  );
}

class CancelAppointmentButton extends ConsumerStatefulWidget {
  const CancelAppointmentButton({super.key, required this.appointment});
  final Appointment appointment;
  @override
  ConsumerState<CancelAppointmentButton> createState() =>
      _CancelAppointmentButtonState();
}

class _CancelAppointmentButtonState
    extends ConsumerState<CancelAppointmentButton> {
  bool busy = false;
  Future<void> cancel() async {
    if (!await confirmAction(context, S.cancelQuestion, S.confirmCancel) ||
        !mounted) {
      return;
    }
    setState(() => busy = true);
    try {
      await ref
          .read(appointmentRepositoryProvider)
          .cancel(widget.appointment.id);
      ref.invalidate(appointmentsProvider);
      ref.invalidate(appointmentDetailProvider(widget.appointment.id));
      ref.invalidate(notificationsProvider);
      ref.invalidate(unreadCountProvider);
      if (mounted) showMessage(context, S.cancelledSuccess);
    } catch (e) {
      if (mounted) showFailure(context, e);
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Semantics(
    label: S.cancel,
    button: true,
    excludeSemantics: true,
    child: TextButton(
      onPressed: busy ? null : cancel,
      child: Text(busy ? S.sending : S.cancel),
    ),
  );
}
