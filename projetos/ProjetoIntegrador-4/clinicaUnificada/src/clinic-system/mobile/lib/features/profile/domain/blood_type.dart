import '../../../l10n/strings.dart';

enum BloodType {
  aPos('A_POS', 'A+'),
  aNeg('A_NEG', 'A-'),
  bPos('B_POS', 'B+'),
  bNeg('B_NEG', 'B-'),
  abPos('AB_POS', 'AB+'),
  abNeg('AB_NEG', 'AB-'),
  oPos('O_POS', 'O+'),
  oNeg('O_NEG', 'O-'),
  unknown('', S.unspecified);

  const BloodType(this.wire, this.label);
  final String wire, label;
  static BloodType fromWire(String? value) =>
      values.firstWhere((e) => e.wire == value, orElse: () => unknown);
}
