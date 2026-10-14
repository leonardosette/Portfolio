// Ponto de entrada de teste: só a tela de login com Google, sem backend.
// Uso: flutter build appbundle --release -t lib/main_google.dart \
//   --dart-define=GOOGLE_SERVER_CLIENT_ID=<web-client-id>.apps.googleusercontent.com
import 'package:flutter/material.dart';
import 'package:google_sign_in/google_sign_in.dart';

import 'demo/demo_shell.dart';
import 'shared/theme/app_theme.dart';

const _serverClientId = String.fromEnvironment('GOOGLE_SERVER_CLIENT_ID');

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const GoogleAuthApp());
}

class GoogleAuthApp extends StatelessWidget {
  const GoogleAuthApp({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'SCU Paciente',
    debugShowCheckedModeBanner: false,
    theme: appTheme(),
    home: const GoogleAuthPage(),
  );
}

class GoogleAuthPage extends StatefulWidget {
  const GoogleAuthPage({super.key});
  @override
  State<GoogleAuthPage> createState() => _GoogleAuthPageState();
}

class _GoogleAuthPageState extends State<GoogleAuthPage> {
  GoogleSignInAccount? account;
  bool busy = false, ready = false;
  String? error;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    try {
      await GoogleSignIn.instance.initialize(
        serverClientId: _serverClientId.isEmpty ? null : _serverClientId,
      );
      if (mounted) setState(() => ready = true);
    } catch (e) {
      if (mounted) setState(() => error = 'Falha ao iniciar o login: $e');
    }
  }

  Future<void> _signIn() async {
    setState(() {
      busy = true;
      error = null;
    });
    try {
      final result = await GoogleSignIn.instance.authenticate();
      if (mounted) setState(() => account = result);
    } on GoogleSignInException catch (e) {
      if (mounted && e.code != GoogleSignInExceptionCode.canceled) {
        setState(() => error = 'Não foi possível entrar (${e.code.name}).');
      }
    } catch (e) {
      if (mounted) setState(() => error = 'Erro inesperado: $e');
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  Future<void> _signOut() async {
    await GoogleSignIn.instance.signOut();
    if (mounted) setState(() => account = null);
  }

  @override
  Widget build(BuildContext context) {
    final user = account;
    if (user != null) {
      return DemoShell(account: user, onSignOut: _signOut);
    }
    final theme = Theme.of(context);
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 480),
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Icon(
                    Icons.favorite,
                    size: 56,
                    color: Color(0xFF17A97E),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Sistema Clínico Unificado',
                    textAlign: TextAlign.center,
                    style: theme.textTheme.headlineSmall,
                  ),
                  const SizedBox(height: 32),
                  FilledButton.icon(
                    onPressed: (busy || !ready) ? null : _signIn,
                    icon: busy
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.login),
                    label: const Text('Entrar com Google'),
                  ),
                  if (error != null) ...[
                    const SizedBox(height: 16),
                    Text(
                      error!,
                      textAlign: TextAlign.center,
                      style: TextStyle(color: theme.colorScheme.error),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
