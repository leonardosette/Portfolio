import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mask_text_input_formatter/mask_text_input_formatter.dart';

import '../../../core/error_mapper.dart';
import '../../../core/formatters.dart';
import '../../../l10n/strings.dart';
import '../../../shared/widgets/app_text_field.dart';
import '../../../shared/widgets/form_helpers.dart';
import '../../../shared/widgets/primary_button.dart';
import '../../../shared/widgets/offline_banner.dart';
import '../data/register_request.dart';
import 'session_provider.dart';

class RegisterPage extends ConsumerStatefulWidget {
  const RegisterPage({super.key});
  @override
  ConsumerState<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends ConsumerState<RegisterPage> {
  final form = GlobalKey<FormState>();
  final name = TextEditingController(),
      email = TextEditingController(),
      cpf = TextEditingController(),
      password = TextEditingController(),
      confirmation = TextEditingController();
  final cpfMask = MaskTextInputFormatter(
    mask: '###.###.###-##',
    filter: {'#': RegExp(r'[0-9]')},
  );
  DateTime? birthDate;
  String? error;
  bool busy = false, obscure = true;
  @override
  void dispose() {
    for (final c in [name, email, cpf, password, confirmation]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> submit() async {
    if (!form.currentState!.validate()) return;
    if (birthDate == null ||
        !birthDate!.isBefore(DateUtils.dateOnly(DateTime.now()))) {
      setState(() => error = S.validBirthDate);
      return;
    }
    setState(() {
      busy = true;
      error = null;
    });
    try {
      final success = await ref
          .read(sessionProvider.notifier)
          .register(
            RegisterRequest(
              name: name.text,
              email: email.text,
              cpf: cpf.text,
              birthDate: birthDate!,
              password: password.text,
            ),
          );
      if (!success && mounted) context.go('/auth/login');
    } catch (e) {
      if (mounted) setState(() => error = mapearErro(e).mensagem);
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text(S.register)),
    body: Column(
      children: [
        const OfflineBanner(),
        Expanded(
          child: ListView(
            padding: const EdgeInsets.all(24),
            children: [
              Form(
                key: form,
                child: Column(
                  children: [
                    AppTextField(
                      controller: name,
                      label: S.name,
                      validator: (v) =>
                          (v?.trim().isEmpty ?? true) ? S.requiredName : null,
                    ),
                    AppTextField(
                      controller: email,
                      label: S.email,
                      keyboardType: TextInputType.emailAddress,
                      validator: emailValidator,
                    ),
                    AppTextField(
                      controller: cpf,
                      label: S.cpf,
                      keyboardType: TextInputType.number,
                      formatters: [cpfMask],
                      validator: (v) => validCpf(v ?? '') ? null : S.validCpf,
                    ),
                    DateField(
                      label: S.birthDate,
                      value: birthDate,
                      onChanged: (v) => setState(() => birthDate = v),
                      lastDate: DateTime.now().subtract(
                        const Duration(days: 1),
                      ),
                      required: true,
                    ),
                    AppTextField(
                      controller: password,
                      label: S.password,
                      obscure: obscure,
                      validator: (v) =>
                          (v?.length ?? 0) < 8 ? S.passwordLength : null,
                      suffix: IconButton(
                        tooltip: obscure ? S.showPassword : S.hidePassword,
                        onPressed: () => setState(() => obscure = !obscure),
                        icon: Icon(
                          obscure ? Icons.visibility : Icons.visibility_off,
                        ),
                      ),
                    ),
                    AppTextField(
                      controller: confirmation,
                      label: S.confirmPassword,
                      obscure: obscure,
                      validator: (v) =>
                          v != password.text ? S.passwordsDiffer : null,
                    ),
                    InlineError(message: error),
                    PrimaryButton(
                      label: S.register,
                      busy: busy,
                      busyLabel: S.sending,
                      onPressed: submit,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    ),
  );
}
