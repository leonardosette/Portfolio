import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mask_text_input_formatter/mask_text_input_formatter.dart';

import '../../../core/error_mapper.dart';
import '../../../core/formatters.dart';
import '../../../l10n/strings.dart';
import '../../../shared/widgets/async_value_view.dart';
import '../../../shared/widgets/section_card.dart';
import '../../../shared/widgets/app_text_field.dart';
import '../../../shared/widgets/primary_button.dart';
import '../../../shared/widgets/form_helpers.dart';
import '../../../shared/widgets/offline_banner.dart';
import '../../auth/presentation/session_provider.dart';
import '../data/patient.dart';
import '../data/profile_repository.dart';
import '../data/update_profile_request.dart';
import '../domain/blood_type.dart';
import 'profile_provider.dart';

class ProfilePage extends ConsumerWidget {
  const ProfilePage({super.key, this.edit = false});
  final bool edit;
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final view = AsyncValueView<Patient>(
      value: ref.watch(profileProvider),
      onRetry: () => ref.invalidate(profileProvider),
      onData: (patient) => edit
          ? ProfileForm(patient: patient)
          : ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16),
              children: [
                SectionCard(
                  title: S.accountData,
                  children: [
                    for (final field in [
                      (S.name, patient.name),
                      (S.email, patient.email),
                      (S.cpf, cpfLabel(patient.cpf)),
                      (S.birthDate, dateLabel(patient.birthDate)),
                    ])
                      Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Text(
                          '${field.$1}: ${field.$2}',
                          style: const TextStyle(color: Color(0xFF595F64)),
                        ),
                      ),
                    const Text(S.contactReception),
                  ],
                ),
                SectionCard(
                  title: S.clinicalData,
                  children: [
                    for (final field in [
                      (S.phone, phoneLabel(patient.phone)),
                      (
                        S.bloodType,
                        patient.bloodType.isEmpty
                            ? S.unspecified
                            : BloodType.fromWire(patient.bloodType) ==
                                  BloodType.unknown
                            ? patient.bloodType
                            : BloodType.fromWire(patient.bloodType).label,
                      ),
                      (S.address, patient.address),
                      (S.allergies, patient.allergies),
                      (S.emergencyName, patient.emergencyContactName),
                      (
                        S.emergencyPhone,
                        phoneLabel(patient.emergencyContactPhone),
                      ),
                    ])
                      Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Text(
                          '${field.$1}: ${field.$2.isEmpty ? '—' : field.$2}',
                        ),
                      ),
                    TextButton(
                      onPressed: () => context.push('/perfil/editar'),
                      child: const Text(S.edit),
                    ),
                  ],
                ),
                ListTile(
                  minVerticalPadding: 16,
                  leading: const Icon(Icons.health_and_safety_outlined),
                  title: const Text(S.insurance),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => context.push('/perfil/convenios'),
                ),
                const Padding(
                  padding: EdgeInsets.all(16),
                  child: Text(S.version),
                ),
                Semantics(
                  label: S.logout,
                  button: true,
                  excludeSemantics: true,
                  child: TextButton(
                    onPressed: () async {
                      if (await confirmAction(
                        context,
                        S.logoutQuestion,
                        S.logout,
                      )) {
                        await ref.read(sessionProvider.notifier).logout();
                      }
                    },
                    child: const Text(S.logout),
                  ),
                ),
              ],
            ),
    );
    return edit
        ? Scaffold(
            appBar: AppBar(title: const Text(S.clinicalData)),
            body: OnlineBody(child: view),
          )
        : RefreshIndicator(
            onRefresh: () async {
              await ref.refresh(profileProvider.future).then((_) {});
            },
            child: view,
          );
  }
}

class ProfileForm extends ConsumerStatefulWidget {
  const ProfileForm({super.key, required this.patient});
  final Patient patient;
  @override
  ConsumerState<ProfileForm> createState() => _ProfileFormState();
}

class _ProfileFormState extends ConsumerState<ProfileForm> {
  late final TextEditingController phone,
      address,
      allergies,
      emergencyName,
      emergencyPhone;
  final phoneMask = MaskTextInputFormatter(
    mask: '(##) #####-####',
    filter: {'#': RegExp(r'[0-9]')},
  );
  final emergencyMask = MaskTextInputFormatter(
    mask: '(##) #####-####',
    filter: {'#': RegExp(r'[0-9]')},
  );
  late String? blood;
  bool dirty = false, busy = false, allowPop = false;
  String? error;
  @override
  void initState() {
    super.initState();
    final p = widget.patient;
    phone = TextEditingController(text: phoneLabel(p.phone));
    address = TextEditingController(text: p.address);
    allergies = TextEditingController(text: p.allergies);
    emergencyName = TextEditingController(text: p.emergencyContactName);
    emergencyPhone = TextEditingController(
      text: phoneLabel(p.emergencyContactPhone),
    );
    blood = p.bloodType.isEmpty ? null : p.bloodType;
  }

  @override
  void dispose() {
    for (final c in [
      phone,
      address,
      allergies,
      emergencyName,
      emergencyPhone,
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> save() async {
    setState(() {
      busy = true;
      error = null;
    });
    try {
      await ref
          .read(profileRepositoryProvider)
          .update(
            UpdateProfileRequest(
              phone: phone.text,
              address: address.text,
              bloodType: blood,
              allergies: allergies.text,
              emergencyContactName: emergencyName.text,
              emergencyContactPhone: emergencyPhone.text,
            ),
          );
      ref.invalidate(profileProvider);
      if (mounted) {
        setState(() {
          dirty = false;
          allowPop = true;
        });
        showMessage(context, S.profileSaved);
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) context.pop();
        });
      }
    } catch (e) {
      if (mounted) setState(() => error = mapearErro(e).mensagem);
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => PopScope(
    canPop: (!dirty && !busy) || allowPop,
    onPopInvokedWithResult: (didPop, result) async {
      if (didPop || busy) return;
      if (await confirmAction(context, S.unsaved, S.discard) && mounted) {
        setState(() => allowPop = true);
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) context.pop();
        });
      }
    },
    child: ListView(
      padding: const EdgeInsets.all(24),
      children: [
        AbsorbPointer(
          absorbing: busy,
          child: Column(
            children: [
              AppTextField(
                controller: phone,
                label: S.phone,
                keyboardType: TextInputType.phone,
                formatters: [phoneMask],
                onChanged: (_) => setState(() => dirty = true),
              ),
              DropdownButtonFormField<String>(
                initialValue: blood,
                decoration: const InputDecoration(labelText: S.bloodType),
                items: [
                  if (widget.patient.bloodType.isEmpty)
                    const DropdownMenuItem<String>(
                      value: null,
                      child: Text(S.unspecified),
                    ),
                  if (blood != null &&
                      BloodType.fromWire(blood) == BloodType.unknown)
                    DropdownMenuItem(value: blood, child: Text(blood!)),
                  for (final item in BloodType.values.where(
                    (b) => b != BloodType.unknown,
                  ))
                    DropdownMenuItem(value: item.wire, child: Text(item.label)),
                ],
                onChanged: (value) => setState(() {
                  blood = value;
                  dirty = true;
                }),
              ),
              if (widget.patient.bloodType.isNotEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 12),
                  child: Text(S.bloodTypeLimitation),
                ),
              const SizedBox(height: 16),
              AppTextField(
                controller: address,
                label: S.address,
                onChanged: (_) => setState(() => dirty = true),
              ),
              AppTextField(
                controller: allergies,
                label: S.allergies,
                lines: 3,
                onChanged: (_) => setState(() => dirty = true),
              ),
              AppTextField(
                controller: emergencyName,
                label: S.emergencyName,
                onChanged: (_) => setState(() => dirty = true),
              ),
              AppTextField(
                controller: emergencyPhone,
                label: S.emergencyPhone,
                keyboardType: TextInputType.phone,
                formatters: [emergencyMask],
                onChanged: (_) => setState(() => dirty = true),
              ),
            ],
          ),
        ),
        InlineError(message: error),
        PrimaryButton(
          label: S.save,
          busy: busy,
          busyLabel: S.saving,
          onPressed: save,
        ),
      ],
    ),
  );
}
