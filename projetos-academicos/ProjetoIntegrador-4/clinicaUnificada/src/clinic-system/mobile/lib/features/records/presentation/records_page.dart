import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/formatters.dart';
import '../../../l10n/strings.dart';
import '../../../shared/widgets/async_value_view.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../data/consultation_record.dart';
import 'records_provider.dart';

class RecordsPage extends ConsumerStatefulWidget {
  const RecordsPage({super.key});
  @override
  ConsumerState<RecordsPage> createState() => _RecordsPageState();
}

class _RecordsPageState extends ConsumerState<RecordsPage> {
  String? expanded;
  int visible = 20;
  @override
  Widget build(BuildContext context) => RefreshIndicator(
    onRefresh: () async {
      if (expanded != null) ref.invalidate(recordDetailProvider(expanded!));
      await ref.refresh(recordsProvider.future).then((_) {});
    },
    child: AsyncValueView<List<ConsultationRecord>>(
      value: ref.watch(recordsProvider),
      onRetry: () => ref.invalidate(recordsProvider),
      isEmpty: (items) => items.isEmpty,
      emptyBuilder: (context) => const EmptyState(message: S.noRecords),
      onData: (items) => ListView.builder(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        itemCount:
            items.take(visible).length + (items.length > visible ? 1 : 0),
        itemBuilder: (context, index) {
          if (index == visible) {
            return TextButton(
              onPressed: () => setState(() => visible += 20),
              child: const Text(S.more),
            );
          }
          final item = items[index],
              open = expanded == items[index].appointmentId;
          return Card(
            child: Column(
              children: [
                ListTile(
                  minVerticalPadding: 16,
                  title: Text(item.doctorName),
                  subtitle: Text(
                    '${item.specialtyName} · ${dateLabel(item.scheduledAt)} · ${item.clinicName}',
                  ),
                  trailing: Icon(open ? Icons.expand_less : Icons.expand_more),
                  onTap: () => setState(
                    () => expanded = open ? null : item.appointmentId,
                  ),
                ),
                if (open) RecordBody(appointmentId: item.appointmentId),
              ],
            ),
          );
        },
      ),
    ),
  );
}

class RecordBody extends ConsumerWidget {
  const RecordBody({super.key, required this.appointmentId});
  final String appointmentId;
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final value = ref.watch(recordDetailProvider(appointmentId));
    return value.when(
      loading: () => const SizedBox(height: 180, child: LoadingSkeleton()),
      error: (error, stack) => SizedBox(
        height: 240,
        child: AsyncValueView<ConsultationRecord>(
          value: value,
          onRetry: () => ref.invalidate(recordDetailProvider(appointmentId)),
          onData: (data) => const SizedBox.shrink(),
        ),
      ),
      data: (record) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            for (final field in [
              (S.complaint, record.chiefComplaint),
              (S.diagnosis, record.diagnosis),
              (S.cid, record.cid10),
              (S.treatment, record.treatment),
              (S.notes, record.notes),
            ])
              if (field.$2.trim().isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        field.$1,
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      Text(field.$2),
                    ],
                  ),
                ),
            if (record.prescriptionItems.isNotEmpty) ...[
              Text(
                S.prescription,
                style: Theme.of(context).textTheme.titleMedium,
              ),
              for (final item in record.prescriptionItems)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(item.medicationName),
                      if (item.dosage.isNotEmpty) Text(S.dose(item.dosage)),
                      if (item.duration.isNotEmpty)
                        Text(S.duration(item.duration)),
                      if (item.notes.isNotEmpty) Text(item.notes),
                    ],
                  ),
                ),
            ],
          ],
        ),
      ),
    );
  }
}
