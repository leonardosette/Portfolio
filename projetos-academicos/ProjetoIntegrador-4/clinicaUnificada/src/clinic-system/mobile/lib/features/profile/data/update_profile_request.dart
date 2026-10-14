import '../../../core/json.dart';
import '../../../core/formatters.dart';

class UpdateProfileRequest {
  const UpdateProfileRequest({
    required this.phone,
    required this.address,
    required this.bloodType,
    required this.allergies,
    required this.emergencyContactName,
    required this.emergencyContactPhone,
  });
  final String phone,
      address,
      allergies,
      emergencyContactName,
      emergencyContactPhone;
  final String? bloodType;
  Json toJson() => {
    'phone': digits(phone),
    'address': address.trim(),
    'bloodType': bloodType,
    'allergies': allergies.trim(),
    'emergencyContactName': emergencyContactName.trim(),
    'emergencyContactPhone': digits(emergencyContactPhone),
  };
}
