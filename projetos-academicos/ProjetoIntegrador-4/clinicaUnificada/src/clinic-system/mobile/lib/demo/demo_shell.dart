// Shell visual do build de demonstração (Play Console).
// Nenhuma tela aqui chama rede ou persiste dados: tudo é estático/fictício.
// Entrada real do app: lib/main.dart. Este shell só é usado por lib/main_google.dart.
import 'package:flutter/material.dart';
import 'package:google_sign_in/google_sign_in.dart';

import '../shared/theme/colors.dart';

class DemoShell extends StatefulWidget {
  const DemoShell({super.key, required this.account, required this.onSignOut});
  final GoogleSignInAccount account;
  final Future<void> Function() onSignOut;

  @override
  State<DemoShell> createState() => _DemoShellState();
}

class _DemoShellState extends State<DemoShell> {
  int index = 0;

  static const _titles = [
    'Início',
    'Agendar',
    'Consultas',
    'Prontuário',
    'Perfil',
  ];

  @override
  Widget build(BuildContext context) {
    final pages = [
      const _DemoHomeTab(),
      const _DemoBookingTab(),
      const _DemoAppointmentsTab(),
      const _DemoRecordsTab(),
      _DemoProfileTab(account: widget.account, onSignOut: widget.onSignOut),
    ];
    return Scaffold(
      appBar: AppBar(
        title: Text(_titles[index]),
        actions: [
          IconButton(
            tooltip: 'Notificações',
            onPressed: () => _showPreview(context, 'Notificações'),
            icon: const Icon(Icons.notifications_outlined),
          ),
        ],
      ),
      body: Banner(
        message: 'DEMO',
        location: BannerLocation.topEnd,
        color: AppColors.accent,
        child: pages[index],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (value) => setState(() => index = value),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home),
            label: 'Início',
          ),
          NavigationDestination(
            icon: Icon(Icons.add_circle_outline),
            label: 'Agendar',
          ),
          NavigationDestination(
            icon: Icon(Icons.calendar_month_outlined),
            label: 'Consultas',
          ),
          NavigationDestination(
            icon: Icon(Icons.assignment_outlined),
            label: 'Prontuário',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            label: 'Perfil',
          ),
        ],
      ),
    );
  }
}

void _showPreview(BuildContext context, [String feature = 'Este recurso']) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text(
        '$feature ainda não está disponível nesta versão de demonstração.',
      ),
    ),
  );
}

class _Card extends StatelessWidget {
  const _Card({required this.title, required this.children});
  final String title;
  final List<Widget> children;
  @override
  Widget build(BuildContext context) => Card(
    margin: const EdgeInsets.only(bottom: 16),
    child: Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(title, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 16),
          ...children,
        ],
      ),
    ),
  );
}

(Color, Color) _statusColors(String status) => switch (status) {
  'Agendada' => (const Color(0xFFE8F4FD), const Color(0xFF0B5ED7)),
  'Aguardando' => (const Color(0xFFF3E8FF), const Color(0xFF6F42C1)),
  'Concluída' => (const Color(0xFFD1F5EA), const Color(0xFF0F6848)),
  'Cancelada' => (const Color(0xFFF8D7DA), const Color(0xFF842029)),
  _ => (const Color(0xFFEEEEEE), const Color(0xFF212529)),
};

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.label});
  final String label;
  @override
  Widget build(BuildContext context) {
    final (background, foreground) = _statusColors(label);
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: background,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(label, style: TextStyle(color: foreground, fontSize: 13)),
      ),
    );
  }
}

// ---------------------------------------------------------------- Início

class _DemoHomeTab extends StatelessWidget {
  const _DemoHomeTab();
  @override
  Widget build(BuildContext context) => ListView(
    padding: const EdgeInsets.all(16),
    children: [
      Text('Olá!', style: Theme.of(context).textTheme.headlineSmall),
      const SizedBox(height: 16),
      const IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(
              child: _StatTile(value: '2', label: 'Agendadas'),
            ),
            SizedBox(width: 8),
            Expanded(
              child: _StatTile(value: '1', label: 'Este mês'),
            ),
            SizedBox(width: 8),
            Expanded(
              child: _StatTile(value: '8', label: 'Total'),
            ),
          ],
        ),
      ),
      const SizedBox(height: 16),
      const _Card(
        title: 'Próxima consulta',
        children: [
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: Icon(Icons.local_hospital_outlined),
            title: Text('Clínica Central — Cardiologia'),
            subtitle: Text('Dr. João Silva · 14/10/2026 às 09:00'),
          ),
          SizedBox(height: 4),
          _StatusChip(label: 'Agendada'),
        ],
      ),
    ],
  );
}

class _StatTile extends StatelessWidget {
  const _StatTile({required this.value, required this.label});
  final String value, label;
  @override
  Widget build(BuildContext context) => Card(
    child: Padding(
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(value, style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 8),
          Text(label),
        ],
      ),
    ),
  );
}

// ---------------------------------------------------------------- Agendar

class _DemoBookingTab extends StatefulWidget {
  const _DemoBookingTab();
  @override
  State<_DemoBookingTab> createState() => _DemoBookingTabState();
}

class _DemoBookingTabState extends State<_DemoBookingTab> {
  String clinic = 'Clínica Central';
  String specialty = 'Cardiologia';
  String? horario;

  static const clinics = [
    'Clínica Central',
    'Clínica Norte',
    'Clínica Jardins',
  ];
  static const specialties = [
    'Cardiologia',
    'Dermatologia',
    'Ortopedia',
    'Clínica Geral',
  ];
  static const horarios = ['09:00', '10:30', '14:00', '16:30'];

  @override
  Widget build(BuildContext context) => ListView(
    padding: const EdgeInsets.all(16),
    children: [
      _Card(
        title: '1. Clínica',
        children: [
          DropdownButtonFormField<String>(
            initialValue: clinic,
            items: [
              for (final c in clinics)
                DropdownMenuItem(value: c, child: Text(c)),
            ],
            onChanged: (value) => setState(() => clinic = value ?? clinic),
            decoration: const InputDecoration(labelText: 'Selecione a clínica'),
          ),
        ],
      ),
      _Card(
        title: '2. Especialidade e médico',
        children: [
          DropdownButtonFormField<String>(
            initialValue: specialty,
            items: [
              for (final s in specialties)
                DropdownMenuItem(value: s, child: Text(s)),
            ],
            onChanged: (value) =>
                setState(() => specialty = value ?? specialty),
            decoration: const InputDecoration(labelText: 'Especialidade'),
          ),
          const SizedBox(height: 12),
          const ListTile(
            contentPadding: EdgeInsets.zero,
            leading: CircleAvatar(child: Icon(Icons.person_outline)),
            title: Text('Dr. João Silva'),
            subtitle: Text('CRM 12345 · Cardiologia'),
          ),
        ],
      ),
      _Card(
        title: '3. Data e horário',
        children: [
          TextField(
            readOnly: true,
            decoration: const InputDecoration(
              labelText: 'Data',
              suffixIcon: Icon(Icons.calendar_today_outlined),
            ),
            controller: TextEditingController(text: '14/10/2026'),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            children: [
              for (final h in horarios)
                ChoiceChip(
                  label: Text(h),
                  selected: horario == h,
                  onSelected: (_) => setState(() => horario = h),
                ),
            ],
          ),
        ],
      ),
      const SizedBox(height: 8),
      SizedBox(
        width: double.infinity,
        child: FilledButton(
          onPressed: () => _showPreview(context, 'O agendamento'),
          child: const Text('Confirmar agendamento'),
        ),
      ),
    ],
  );
}

// ---------------------------------------------------------------- Consultas

class _DemoAppointmentsTab extends StatefulWidget {
  const _DemoAppointmentsTab();
  @override
  State<_DemoAppointmentsTab> createState() => _DemoAppointmentsTabState();
}

class _DemoAppointmentsTabState extends State<_DemoAppointmentsTab> {
  String filter = 'Todas';
  static const filters = ['Todas', 'Agendadas', 'Concluídas', 'Canceladas'];
  static const appointments = [
    ('Clínica Central', 'Dr. João Silva', '14/10/2026 09:00', 'Agendada'),
    ('Clínica Jardins', 'Dra. Ana Costa', '02/10/2026 11:00', 'Aguardando'),
    ('Clínica Norte', 'Dr. Pedro Lima', '20/09/2026 15:30', 'Concluída'),
    ('Clínica Central', 'Dra. Maria Souza', '05/09/2026 08:00', 'Cancelada'),
  ];

  @override
  Widget build(BuildContext context) {
    final visible = appointments.where(
      (a) => filter == 'Todas' || filter == '${a.$4}s',
    );
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
          child: Wrap(
            spacing: 8,
            children: [
              for (final f in filters)
                ChoiceChip(
                  label: Text(f),
                  selected: filter == f,
                  onSelected: (_) => setState(() => filter = f),
                ),
            ],
          ),
        ),
        Expanded(
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              for (final a in visible)
                Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: ListTile(
                    title: Text('${a.$1} — ${a.$2}'),
                    subtitle: Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(a.$3),
                          const SizedBox(height: 6),
                          _StatusChip(label: a.$4),
                        ],
                      ),
                    ),
                    isThreeLine: true,
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }
}

// ---------------------------------------------------------------- Prontuário

class _DemoRecordsTab extends StatelessWidget {
  const _DemoRecordsTab();
  static const records = [
    (
      '20/09/2026',
      'Dr. Pedro Lima',
      'Clínica Norte',
      ['Losartana 50mg — 1x ao dia', 'Retorno em 30 dias'],
    ),
    (
      '12/06/2026',
      'Dra. Ana Costa',
      'Clínica Jardins',
      ['Dipirona 500mg — se necessário'],
    ),
  ];
  @override
  Widget build(BuildContext context) => ListView(
    padding: const EdgeInsets.all(16),
    children: [
      for (final r in records)
        Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: ExpansionTile(
            title: Text('${r.$2} · ${r.$1}'),
            subtitle: Text(r.$3),
            childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            children: [
              Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'Prescrição',
                  style: Theme.of(context).textTheme.titleSmall,
                ),
              ),
              const SizedBox(height: 8),
              for (final item in r.$4) Text('• $item'),
            ],
          ),
        ),
    ],
  );
}

// ---------------------------------------------------------------- Perfil

class _DemoProfileTab extends StatelessWidget {
  const _DemoProfileTab({required this.account, required this.onSignOut});
  final GoogleSignInAccount account;
  final Future<void> Function() onSignOut;

  @override
  Widget build(BuildContext context) => ListView(
    padding: const EdgeInsets.all(16),
    children: [
      Row(
        children: [
          CircleAvatar(
            radius: 32,
            backgroundImage: account.photoUrl != null
                ? NetworkImage(account.photoUrl!)
                : null,
            child: account.photoUrl == null
                ? const Icon(Icons.person, size: 32)
                : null,
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  account.displayName ?? 'Paciente',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                Text(account.email),
              ],
            ),
          ),
        ],
      ),
      const SizedBox(height: 24),
      _Card(
        title: 'Dados pessoais',
        children: [
          TextField(
            enabled: false,
            decoration: const InputDecoration(labelText: 'CPF'),
            controller: TextEditingController(text: '123.456.789-00'),
          ),
          const SizedBox(height: 12),
          TextField(
            enabled: false,
            decoration: const InputDecoration(labelText: 'Data de nascimento'),
            controller: TextEditingController(text: '10/05/1990'),
          ),
          const SizedBox(height: 12),
          TextField(
            enabled: false,
            decoration: const InputDecoration(labelText: 'Tipo sanguíneo'),
            controller: TextEditingController(text: 'O+'),
          ),
          const SizedBox(height: 12),
          Align(
            alignment: Alignment.centerRight,
            child: TextButton(
              onPressed: () => _showPreview(context, 'A edição do perfil'),
              child: const Text('Editar'),
            ),
          ),
        ],
      ),
      _Card(
        title: 'Convênios',
        children: [
          const ListTile(
            contentPadding: EdgeInsets.zero,
            leading: Icon(Icons.shield_outlined),
            title: Text('Convênio Saúde Plena'),
            subtitle: Text('Carteirinha 0001234567 · Principal'),
          ),
          Align(
            alignment: Alignment.centerRight,
            child: TextButton(
              onPressed: () => _showPreview(context, 'Convênios'),
              child: const Text('Gerenciar'),
            ),
          ),
        ],
      ),
      const SizedBox(height: 8),
      OutlinedButton.icon(
        onPressed: onSignOut,
        icon: const Icon(Icons.logout),
        label: const Text('Sair'),
      ),
    ],
  );
}
