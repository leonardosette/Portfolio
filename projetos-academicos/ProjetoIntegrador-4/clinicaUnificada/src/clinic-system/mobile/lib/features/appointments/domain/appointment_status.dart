import '../../../l10n/strings.dart';

enum AppointmentStatus {
  pending('PENDING', S.pending),
  scheduled('SCHEDULED', S.scheduled),
  inProgress('IN_PROGRESS', S.inProgress),
  completed('COMPLETED', S.completed),
  cancelled('CANCELLED', S.cancelled),
  unknown('', '');

  const AppointmentStatus(this.wire, this.label);
  final String wire, label;
  static AppointmentStatus fromWire(String? value) =>
      values.firstWhere((e) => e.wire == value, orElse: () => unknown);
  bool get cancelavel => this == pending || this == scheduled;
}
