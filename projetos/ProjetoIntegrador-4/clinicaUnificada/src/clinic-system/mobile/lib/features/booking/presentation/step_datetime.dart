import 'package:flutter/material.dart';

import '../../../core/formatters.dart';
import '../../../l10n/strings.dart';
import '../../../shared/widgets/form_helpers.dart';
import '../../../shared/widgets/primary_button.dart';
import '../../appointments/domain/appointment_type.dart';

class StepDatetime extends StatelessWidget {
  const StepDatetime({
    super.key,
    required this.clinicName,
    required this.doctorName,
    required this.date,
    required this.time,
    required this.type,
    required this.onDate,
    required this.onTime,
    required this.onType,
    required this.onSubmit,
    this.busy = false,
    this.error,
  });
  final String clinicName, doctorName;
  final DateTime? date;
  final TimeOfDay? time;
  final AppointmentType type;
  final ValueChanged<DateTime?> onDate;
  final ValueChanged<TimeOfDay> onTime;
  final ValueChanged<AppointmentType> onType;
  final VoidCallback onSubmit;
  final bool busy;
  final String? error;
  @override
  Widget build(BuildContext context) => ListView(
    padding: const EdgeInsets.all(24),
    children: [
      Text(doctorName, style: Theme.of(context).textTheme.titleLarge),
      Text(clinicName),
      const SizedBox(height: 24),
      AbsorbPointer(
        absorbing: busy,
        child: Column(
          children: [
            DateField(
              label: S.date,
              value: date,
              onChanged: onDate,
              firstDate: DateUtils.dateOnly(DateTime.now()),
              required: true,
            ),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                icon: const Icon(Icons.schedule),
                label: Text(
                  '${S.time}: ${time == null ? '—' : time!.format(context)}',
                ),
                onPressed: () async {
                  final selected = await showTimePicker(
                    context: context,
                    initialTime: time ?? TimeOfDay.now(),
                    builder: (context, child) => MediaQuery(
                      data: MediaQuery.of(context)
                          .copyWith(alwaysUse24HourFormat: true),
                      child: child!,
                    ),
                  );
                  if (selected != null) onTime(selected);
                },
              ),
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<AppointmentType>(
              initialValue: type,
              decoration: const InputDecoration(labelText: S.type),
              items: [
                for (final item in [
                  AppointmentType.firstVisit,
                  AppointmentType.returnVisit,
                ])
                  DropdownMenuItem(value: item, child: Text(item.label)),
              ],
              onChanged: (value) {
                if (value != null) onType(value);
              },
            ),
          ],
        ),
      ),
      const SizedBox(height: 20),
      const Text(S.receptionNotice),
      if (date != null && time != null)
        Container(
          margin: const EdgeInsets.symmetric(vertical: 16),
          padding: const EdgeInsets.all(16),
          color: const Color(0xFFD1F5EA),
          child: Text(
            S.receptionFor(clinicName),
            style: const TextStyle(color: Color(0xFF0F6848)),
          ),
        ),
      if (date != null) Text(dateLabel(date)),
      InlineError(message: error),
      PrimaryButton(
        label: S.requestBooking,
        busy: busy,
        busyLabel: S.sending,
        onPressed: date == null || time == null ? null : onSubmit,
      ),
    ],
  );
}
