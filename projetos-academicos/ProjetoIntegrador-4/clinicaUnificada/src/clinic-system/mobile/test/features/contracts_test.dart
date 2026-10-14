import 'package:flutter_test/flutter_test.dart';
import 'package:scu_paciente/core/json.dart';
import 'package:scu_paciente/features/appointments/data/appointment.dart';
import 'package:scu_paciente/features/appointments/domain/appointment_status.dart';
import 'package:scu_paciente/features/appointments/domain/appointment_type.dart';
import 'package:scu_paciente/features/profile/domain/blood_type.dart';
import 'package:scu_paciente/features/profile/data/profile_repository.dart';
import 'package:scu_paciente/features/profile/data/update_profile_request.dart';
import 'package:scu_paciente/features/insurance/data/insurance_repository.dart';
import 'package:scu_paciente/features/insurance/data/insurance_request.dart';
import 'package:scu_paciente/features/notifications/data/notification_repository.dart';
import 'package:scu_paciente/features/home/presentation/home_provider.dart';

import '../support/fixture.dart';

void main() {
  test(
    'enums novos preservam valor cru e nulabilidade não derruba modelos',
    () {
      expect(AppointmentStatus.fromWire('NEW'), AppointmentStatus.unknown);
      expect(AppointmentType.fromWire('NEW'), AppointmentType.unknown);
      expect(BloodType.fromWire('NEW'), BloodType.unknown);
      final item = Appointment.fromJson({
        'status': 'NEW',
        'doctor': null,
        'scheduledAt': null,
      });
      expect(item.statusLabel, 'NEW');
      expect(item.doctor.name, '');
    },
  );
  test('indicadores da web incluem IN_PROGRESS e canceladas no mês', () {
    Appointment item(String status, String date) =>
        Appointment.fromJson({'status': status, 'scheduledAt': date});
    final home = HomeSummary([
      item('SCHEDULED', '2026-09-10T12:00'),
      item('IN_PROGRESS', '2026-09-09T12:00'),
      item('CANCELLED', '2026-09-01T12:00'),
      item('PENDING', '2026-10-01T12:00'),
    ], now: DateTime(2026, 9, 13));
    expect(home.upcoming.length, 2);
    expect(home.upcoming.first.status, AppointmentStatus.inProgress);
    expect(home.month, 3);
    expect(home.total, 4);
  });
  test('perfil envia strings vazias e faz GET depois do PUT', () async {
    final f = Fixture();
    final profile = await ProfileRepository(f.api).update(
      const UpdateProfileRequest(
        phone: '',
        address: '',
        bloodType: null,
        allergies: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
      ),
    );
    expect(profile.phone, '');
    final request = f.requests.first;
    expect(request.method, 'PUT');
    expect(asObject(request.data)['allergies'], '');
    expect(f.requests.last.method, 'GET');
    expect(f.requests.last.path, '/api/patient/profile');
  });
  test(
    'convênio salva objeto inteiro, define principal, exclui e recarrega',
    () async {
      final f = Fixture(),
          request = InsuranceRequest(
            operadora: 'Unimed',
            numeroCarteirinha: '0001',
            plano: 'Nacional',
            codigoAns: '123',
            dataInicio: DateTime(2026, 1, 1),
            dataValidade: DateTime(2027, 1, 1),
            titular: false,
            nomeTitular: 'Responsável',
            principal: false,
          );
      final repo = InsuranceRepository(f.api);
      await repo.save(request);
      await repo.save(request, id: 'insurance');
      final put = f.requests.firstWhere((r) => r.method == 'PUT');
      expect(asObject(put.data), request.toJson());
      expect(asObject(put.data)['titular'], false);
      expect(asObject(put.data)['principal'], false);
      await repo.principal('insurance');
      expect(f.insurances.single['principal'], true);
      await repo.remove('insurance');
      expect(f.insurances, isEmpty);
      for (var i = 0; i < f.requests.length; i++) {
        if (f.requests[i].method != 'GET') {
          expect(f.requests[i + 1].method, 'GET');
        }
      }
    },
  );
  test('contador número cru e escritas vazias nas notificações', () async {
    final f = Fixture(), repo = NotificationRepository(Fixture().api);
    expect(await repo.unreadCount(), 1);
    final own = NotificationRepository(f.api);
    expect((await own.markRead('welcome')).single.read, true);
    expect(await own.unreadCount(), 0);
    await own.markAllRead();
    expect(f.requests.last.path, '/api/patient/notifications');
  });
}
