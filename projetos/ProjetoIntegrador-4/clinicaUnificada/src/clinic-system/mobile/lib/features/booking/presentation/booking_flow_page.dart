import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/error_mapper.dart';
import '../../../l10n/strings.dart';
import '../../../shared/widgets/form_helpers.dart';
import '../../appointments/data/appointment_repository.dart';
import '../../appointments/data/booking_request.dart';
import '../../appointments/domain/appointment_type.dart';
import '../../appointments/presentation/appointments_provider.dart';
import '../../notifications/presentation/notifications_provider.dart';
import '../data/clinic.dart';
import '../data/doctor_option.dart';
import 'step_clinic.dart';
import 'step_doctor.dart';
import 'step_datetime.dart';

class BookingFlowPage extends ConsumerStatefulWidget {
  const BookingFlowPage({super.key});
  @override
  ConsumerState<BookingFlowPage> createState() => _BookingFlowPageState();
}

class _BookingFlowPageState extends ConsumerState<BookingFlowPage> {
  int step = 0;
  Clinic? clinic;
  String? specialtyId, error;
  DoctorOption? doctor;
  DateTime? date;
  TimeOfDay? time;
  AppointmentType type = AppointmentType.firstVisit;
  bool busy = false, success = false;
  void reset() => setState(() {
    step = 0;
    clinic = null;
    specialtyId = null;
    doctor = null;
    date = null;
    time = null;
    type = AppointmentType.firstVisit;
    success = false;
    error = null;
  });
  Future<void> submit() async {
    if (date == null || time == null || doctor == null || clinic == null) {
      setState(() => error = S.chooseDateTime);
      return;
    }
    final scheduledAt = DateTime(
      date!.year,
      date!.month,
      date!.day,
      time!.hour,
      time!.minute,
    );
    if (!scheduledAt.isAfter(DateTime.now())) {
      setState(() => error = S.futureDate);
      return;
    }
    setState(() {
      busy = true;
      error = null;
    });
    try {
      final result = await ref
          .read(appointmentRepositoryProvider)
          .book(
            BookingRequest(
              clinicId: clinic!.id,
              doctorId: doctor!.id,
              scheduledAt: scheduledAt,
              type: type,
            ),
          );
      ref.invalidate(appointmentsProvider);
      ref.invalidate(notificationsProvider);
      ref.invalidate(unreadCountProvider);
      if (mounted) {
        setState(() => success = true);
        if (result.failure != null) {
          showMessage(context, S.savedReloadFailed(result.failure!.mensagem));
        }
      }
    } catch (e) {
      if (mounted) setState(() => error = mapearErro(e).mensagem);
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (success) {
      return ListView(
        padding: const EdgeInsets.all(24),
        children: [
          const Icon(
            Icons.check_circle_outline,
            size: 72,
            color: Color(0xFF0F6848),
          ),
          const SizedBox(height: 24),
          Text(S.requestSent, style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 16),
          Text(S.bookingSuccess(doctor!.name)),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: () => context.go('/consultas'),
            child: const Text(S.viewAppointments),
          ),
          TextButton(onPressed: reset, child: const Text(S.bookAnother)),
        ],
      );
    }
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: Wrap(
            spacing: 12,
            runSpacing: 8,
            children: [
              for (final (index, label) in [
                (0, S.clinic),
                (1, S.doctor),
                (2, S.dateTime),
              ])
                Semantics(
                  selected: step == index,
                  child: Chip(
                    label: Text('${index + 1}. $label'),
                    backgroundColor: step == index
                        ? const Color(0xFFD1F5EA)
                        : null,
                  ),
                ),
            ],
          ),
        ),
        if (step > 0)
          Align(
            alignment: Alignment.centerLeft,
            child: TextButton.icon(
              onPressed: busy
                  ? null
                  : () => setState(() {
                      step--;
                      error = null;
                    }),
              icon: const Icon(Icons.arrow_back),
              label: const Text(S.back),
            ),
          ),
        Expanded(
          child: switch (step) {
            0 => StepClinic(
              onSelected: (selected) => setState(() {
                clinic = selected;
                specialtyId = null;
                doctor = null;
                date = null;
                time = null;
                step = 1;
              }),
            ),
            1 => StepDoctor(
              clinic: clinic!,
              specialtyId: specialtyId,
              selected: doctor,
              onSpecialty: (id) => setState(() {
                specialtyId = id;
                doctor = null;
              }),
              onDoctor: (selected) => setState(() => doctor = selected),
              onContinue: () => setState(() => step = 2),
            ),
            _ => StepDatetime(
              clinicName: clinic!.name,
              doctorName: doctor!.name,
              date: date,
              time: time,
              type: type,
              onDate: (value) => setState(() => date = value),
              onTime: (value) => setState(() => time = value),
              onType: (value) => setState(() => type = value),
              onSubmit: submit,
              busy: busy,
              error: error,
            ),
          },
        ),
      ],
    );
  }
}
