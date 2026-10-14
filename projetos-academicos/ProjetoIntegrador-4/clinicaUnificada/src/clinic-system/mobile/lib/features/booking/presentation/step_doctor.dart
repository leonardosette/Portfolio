import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/formatters.dart';
import '../../../l10n/strings.dart';
import '../../../shared/widgets/async_value_view.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/paged_list.dart';
import '../data/clinic.dart';
import '../data/specialty.dart';
import '../data/doctor_option.dart';
import 'booking_provider.dart';

class StepDoctor extends ConsumerWidget {
  const StepDoctor({
    super.key,
    required this.clinic,
    required this.specialtyId,
    required this.selected,
    required this.onSpecialty,
    required this.onDoctor,
    required this.onContinue,
  });
  final Clinic clinic;
  final String? specialtyId;
  final DoctorOption? selected;
  final ValueChanged<String?> onSpecialty;
  final ValueChanged<DoctorOption> onDoctor;
  final VoidCallback onContinue;
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final query = (
      clinicId: clinic.id,
      specialtyId: specialtyId == '' ? null : specialtyId,
    );
    return AsyncValueView<List<Specialty>>(
      value: ref.watch(specialtiesProvider(clinic.id)),
      onRetry: () => ref.invalidate(specialtiesProvider(clinic.id)),
      isEmpty: (items) => items.isEmpty,
      emptyBuilder: (context) => const EmptyState(message: S.noSpecialties),
      onData: (items) => Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: DropdownButtonFormField<String>(
              key: ValueKey((clinic.id, specialtyId)),
              initialValue: specialtyId,
              decoration: const InputDecoration(labelText: S.specialty),
              isExpanded: true,
              items: [
                const DropdownMenuItem(
                  value: '',
                  child: Text(S.allSpecialties),
                ),
                for (final item in items)
                  DropdownMenuItem(value: item.id, child: Text(item.name)),
              ],
              onChanged: onSpecialty,
            ),
          ),
          Expanded(
            child: specialtyId == null
                ? const EmptyState(message: S.chooseSpecialty)
                : RefreshIndicator(
                    onRefresh: () async {
                      await ref
                          .refresh(doctorsProvider(query).future)
                          .then((_) {});
                    },
                    child: AsyncValueView<List<DoctorOption>>(
                      value: ref.watch(doctorsProvider(query)),
                      onRetry: () => ref.invalidate(doctorsProvider(query)),
                      isEmpty: (items) => items.isEmpty,
                      emptyBuilder: (context) =>
                          const EmptyState(message: S.noDoctors),
                      onData: (items) => PagedList(
                        items: items,
                        itemBuilder: (doctor) => Card(
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                            side: BorderSide(
                              color: selected?.id == doctor.id
                                  ? Theme.of(context).colorScheme.primary
                                  : Colors.transparent,
                              width: 2,
                            ),
                          ),
                          child: ListTile(
                            minVerticalPadding: 16,
                            leading: CircleAvatar(
                              child: Text(initials(doctor.name)),
                            ),
                            title: Text(doctor.name),
                            subtitle: Text(doctor.specialtyName),
                            selected: selected?.id == doctor.id,
                            trailing: selected?.id == doctor.id
                                ? const Icon(Icons.check_circle)
                                : null,
                            onTap: () => onDoctor(doctor),
                          ),
                        ),
                      ),
                    ),
                  ),
          ),
          if (selected != null)
            Padding(
              padding: const EdgeInsets.all(16),
              child: SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: onContinue,
                  child: const Text(S.continueLabel),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
