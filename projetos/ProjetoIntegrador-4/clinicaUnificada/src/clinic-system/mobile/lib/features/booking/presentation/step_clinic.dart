import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../l10n/strings.dart';
import '../../../shared/widgets/async_value_view.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/paged_list.dart';
import '../data/clinic.dart';
import 'booking_provider.dart';

class StepClinic extends ConsumerWidget {
  const StepClinic({super.key, required this.onSelected});
  final ValueChanged<Clinic> onSelected;
  @override
  Widget build(BuildContext context, WidgetRef ref) => RefreshIndicator(
    onRefresh: () async {
      await ref.refresh(clinicsProvider.future).then((_) {});
    },
    child: AsyncValueView<List<Clinic>>(
      value: ref.watch(clinicsProvider),
      onRetry: () => ref.invalidate(clinicsProvider),
      isEmpty: (items) => items.isEmpty,
      emptyBuilder: (context) => const EmptyState(message: S.noClinics),
      onData: (items) => PagedList(
        items: items,
        itemBuilder: (clinic) => Card(
          child: ListTile(
            minVerticalPadding: 16,
            leading: const Icon(Icons.local_hospital_outlined),
            title: Text(clinic.name),
            subtitle: clinic.address.isEmpty ? null : Text(clinic.address),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => onSelected(clinic),
          ),
        ),
      ),
    ),
  );
}
