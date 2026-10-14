import '../../../l10n/strings.dart';

enum AppointmentType {
  firstVisit('FIRST_VISIT', S.firstVisit),
  returnVisit('RETURN', S.returnVisit),
  unknown('', '');

  const AppointmentType(this.wire, this.label);
  final String wire, label;
  static AppointmentType fromWire(String? value) =>
      values.firstWhere((e) => e.wire == value, orElse: () => unknown);
}
