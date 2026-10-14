import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/error_mapper.dart';
import '../../../l10n/strings.dart';
import '../../../shared/widgets/async_value_view.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/app_text_field.dart';
import '../../../shared/widgets/primary_button.dart';
import '../../../shared/widgets/form_helpers.dart';
import '../../../shared/widgets/offline_banner.dart';
import '../data/insurance.dart';
import '../data/insurance_request.dart';
import '../data/insurance_repository.dart';
import 'insurance_provider.dart';

class InsuranceFormPage extends ConsumerWidget {
  const InsuranceFormPage({super.key, this.id});
  final String? id;
  @override
  Widget build(BuildContext context, WidgetRef ref) => Scaffold(
    appBar: AppBar(title: Text(id == null ? S.newInsurance : S.editInsurance)),
    body: OnlineBody(
      child: id == null
          ? const InsuranceForm()
          : AsyncValueView<List<Insurance>>(
              value: ref.watch(insuranceProvider),
              onRetry: () => ref.invalidate(insuranceProvider),
              onData: (items) {
                final matching = items.where((item) => item.id == id);
                return matching.isEmpty
                    ? const EmptyState(message: S.notFound)
                    : InsuranceForm(
                        key: ValueKey(id),
                        insurance: matching.first,
                      );
              },
            ),
    ),
  );
}

class InsuranceForm extends ConsumerStatefulWidget {
  const InsuranceForm({super.key, this.insurance});
  final Insurance? insurance;
  @override
  ConsumerState<InsuranceForm> createState() => _InsuranceFormState();
}

class _InsuranceFormState extends ConsumerState<InsuranceForm> {
  final form = GlobalKey<FormState>();
  late final TextEditingController operator, number, plan, ans, holderName;
  DateTime? start, validity;
  bool holder = true, principal = false, busy = false;
  String? error;
  @override
  void initState() {
    super.initState();
    final i = widget.insurance;
    operator = TextEditingController(text: i?.operadora);
    number = TextEditingController(text: i?.numeroCarteirinha);
    plan = TextEditingController(text: i?.plano);
    ans = TextEditingController(text: i?.codigoAns);
    holderName = TextEditingController(text: i?.nomeTitular);
    start = i?.dataInicio;
    validity = i?.dataValidade;
    holder = i?.titular ?? true;
    principal = i?.principal ?? false;
  }

  @override
  void dispose() {
    for (final c in [operator, number, plan, ans, holderName]) {
      c.dispose();
    }
    super.dispose();
  }

  String? validate(String? value, int max, {bool required = false}) {
    if (required && (value?.trim().isEmpty ?? true)) return S.insuranceRequired;
    return (value?.length ?? 0) > max ? S.maxLength(max) : null;
  }

  Future<void> save() async {
    if (!form.currentState!.validate()) return;
    if (start != null && validity != null && !validity!.isAfter(start!)) {
      setState(() => error = S.validityOrder);
      return;
    }
    setState(() {
      busy = true;
      error = null;
    });
    try {
      final result = await ref
          .read(insuranceRepositoryProvider)
          .save(
            InsuranceRequest(
              operadora: operator.text,
              numeroCarteirinha: number.text,
              plano: plan.text,
              codigoAns: ans.text,
              dataInicio: start,
              dataValidade: validity,
              titular: holder,
              nomeTitular: holderName.text,
              principal: principal,
            ),
            id: widget.insurance?.id,
          );
      ref.invalidate(insuranceProvider);
      if (mounted) {
        if (result.failure != null) {
          showMessage(context, S.savedReloadFailed(result.failure!.mensagem));
        }
        context.pop();
      }
    } catch (e) {
      if (mounted) setState(() => error = mapearErro(e).mensagem);
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Form(
    key: form,
    child: ListView(
      padding: const EdgeInsets.all(24),
      children: [
        AbsorbPointer(
          absorbing: busy,
          child: Column(
            children: [
              AppTextField(
                controller: operator,
                label: S.operator,
                validator: (v) => validate(v, 100, required: true),
                maxLength: 100,
              ),
              AppTextField(
                controller: number,
                label: S.cardNumber,
                validator: (v) => validate(v, 60, required: true),
                maxLength: 60,
              ),
              AppTextField(
                controller: plan,
                label: S.plan,
                validator: (v) => validate(v, 100),
                maxLength: 100,
              ),
              AppTextField(
                controller: ans,
                label: S.ans,
                validator: (v) => validate(v, 10),
                maxLength: 10,
              ),
              DateField(
                label: S.coverageStart,
                value: start,
                onChanged: (v) => setState(() => start = v),
              ),
              DateField(
                label: S.validity,
                value: validity,
                onChanged: (v) => setState(() => validity = v),
              ),
              SwitchListTile(
                title: const Text(S.holder),
                value: holder,
                onChanged: (v) => setState(() => holder = v),
              ),
              if (!holder)
                AppTextField(controller: holderName, label: S.holderName),
              SwitchListTile(
                title: const Text(S.setPrincipal),
                value: principal,
                onChanged: (v) => setState(() => principal = v),
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
