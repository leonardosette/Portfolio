import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/error_mapper.dart';
import '../../../l10n/strings.dart';
import '../../../shared/widgets/app_text_field.dart';
import '../../../shared/widgets/form_helpers.dart';
import '../../../shared/widgets/primary_button.dart';
import '../../../shared/widgets/offline_banner.dart';
import 'session_provider.dart';

class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});
  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  final form = GlobalKey<FormState>(),
      email = TextEditingController(),
      password = TextEditingController();
  bool busy = false, obscure = true;
  String? error;
  @override
  void dispose() {
    email.dispose();
    password.dispose();
    super.dispose();
  }

  Future<void> submit() async {
    if (!form.currentState!.validate()) return;
    setState(() {
      busy = true;
      error = null;
    });
    try {
      await ref.read(sessionProvider.notifier).login(email.text, password.text);
    } catch (e) {
      if (mounted) setState(() => error = mapearErro(e).mensagem);
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(sessionProvider);
    return Scaffold(
      appBar: AppBar(title: const Text(S.patientArea)),
      body: Column(
        children: [
          const OfflineBanner(),
          Expanded(
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 480),
                child: ListView(
                  padding: const EdgeInsets.all(24),
                  children: [
                    const Icon(
                      Icons.favorite,
                      size: 56,
                      color: Color(0xFF17A97E),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      S.appName,
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                    const SizedBox(height: 32),
                    Text(
                      S.welcome,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const Text(S.credentials),
                    const SizedBox(height: 24),
                    Form(
                      key: form,
                      child: AutofillGroup(
                        child: Column(
                          children: [
                            AppTextField(
                              controller: email,
                              label: S.email,
                              validator: emailValidator,
                              keyboardType: TextInputType.emailAddress,
                              autofillHints: const [AutofillHints.email],
                            ),
                            AppTextField(
                              controller: password,
                              label: S.password,
                              obscure: obscure,
                              validator: (v) => v == null || v.isEmpty
                                  ? S.requiredPassword
                                  : null,
                              suffix: IconButton(
                                tooltip: obscure
                                    ? S.showPassword
                                    : S.hidePassword,
                                onPressed: () =>
                                    setState(() => obscure = !obscure),
                                icon: Icon(
                                  obscure
                                      ? Icons.visibility
                                      : Icons.visibility_off,
                                ),
                              ),
                            ),
                            PrimaryButton(
                              label: S.login,
                              busyLabel: S.loggingIn,
                              busy: busy,
                              onPressed: submit,
                            ),
                            InlineError(message: error ?? session.message),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    const Text(S.noAccount, textAlign: TextAlign.center),
                    TextButton(
                      onPressed: busy
                          ? null
                          : () => context.push('/auth/register'),
                      child: const Text(S.register),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
