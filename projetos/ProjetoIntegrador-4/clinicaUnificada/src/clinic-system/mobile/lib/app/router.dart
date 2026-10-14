import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../core/api_client.dart';
import '../features/auth/presentation/login_page.dart';
import '../features/auth/presentation/register_page.dart';
import '../features/appointments/presentation/appointments_page.dart';
import '../features/booking/presentation/booking_flow_page.dart';
import '../features/home/presentation/home_page.dart';
import '../features/records/presentation/records_page.dart';
import '../features/profile/presentation/profile_page.dart';
import '../features/insurance/presentation/insurance_page.dart';
import '../features/insurance/presentation/insurance_form_page.dart';
import '../features/notifications/presentation/notifications_page.dart';
import '../features/notifications/presentation/notifications_provider.dart';
import '../l10n/strings.dart';
import '../shared/widgets/offline_banner.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final router = GoRouter(
    initialLocation: '/inicio',
    refreshListenable: ref.watch(sessionStoreProvider),
    redirect: (context, state) {
      final authenticated = ref.read(sessionStoreProvider).state.authenticated;
      final auth = state.matchedLocation.startsWith('/auth');
      if (!authenticated && !auth) return '/auth/login';
      if (authenticated && auth) return '/inicio';
      return null;
    },
    routes: [
      GoRoute(
        path: '/auth/login',
        builder: (context, state) => const LoginPage(),
      ),
      GoRoute(
        path: '/auth/register',
        builder: (context, state) => const RegisterPage(),
      ),
      StatefulShellRoute.indexedStack(
        builder: (context, state, shell) => PatientShell(shell: shell),
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/inicio',
                builder: (context, state) => const HomePage(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/agendar',
                builder: (context, state) => const BookingFlowPage(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/consultas',
                builder: (context, state) => const AppointmentsPage(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/prontuario',
                builder: (context, state) => const RecordsPage(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/perfil',
                builder: (context, state) => const ProfilePage(),
              ),
            ],
          ),
        ],
      ),
      GoRoute(
        path: '/perfil/editar',
        builder: (context, state) => const ProfilePage(edit: true),
      ),
      GoRoute(
        path: '/perfil/convenios',
        builder: (context, state) => const InsurancePage(),
      ),
      GoRoute(
        path: '/perfil/convenios/form',
        builder: (context, state) =>
            InsuranceFormPage(id: state.uri.queryParameters['id']),
      ),
      GoRoute(
        path: '/notificacoes',
        builder: (context, state) => const NotificationsPage(),
      ),
    ],
  );
  ref.onDispose(router.dispose);
  return router;
});

class PatientShell extends ConsumerWidget {
  const PatientShell({super.key, required this.shell});
  final StatefulNavigationShell shell;
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    const titles = [
      S.home,
      S.booking,
      S.myAppointments,
      S.myRecords,
      S.myProfile,
    ];
    final count = ref.watch(unreadCountProvider).asData?.value ?? 0;
    return Scaffold(
      appBar: AppBar(
        title: Text(titles[shell.currentIndex]),
        actions: [
          IconButton(
            tooltip: count > 0 ? S.unread(count) : S.notifications,
            onPressed: () => context.push('/notificacoes'),
            icon: Badge(
              backgroundColor: const Color(0xFFF8D7DA),
              textColor: const Color(0xFF842029),
              isLabelVisible: count > 0,
              label: count < 10 ? Text('$count') : null,
              child: const Icon(Icons.notifications_outlined),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          const OfflineBanner(),
          Expanded(child: shell),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: shell.currentIndex,
        onDestinationSelected: (index) => shell.goBranch(index),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home),
            label: S.home,
          ),
          NavigationDestination(
            icon: Icon(Icons.add_circle_outline),
            label: S.booking,
          ),
          NavigationDestination(
            icon: Icon(Icons.calendar_month_outlined),
            label: S.appointments,
          ),
          NavigationDestination(
            icon: Icon(Icons.assignment_outlined),
            label: S.records,
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            label: S.profile,
          ),
        ],
      ),
    );
  }
}
