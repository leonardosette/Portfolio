abstract final class Endpoints {
  static const login = '/api/auth/login';
  static const register = '/api/pacients/register';
  static const profile = '/api/patient/profile';
  static const appointments = '/api/patient/appointments';
  static String appointment(String id) =>
      '$appointments/${Uri.encodeComponent(id)}';
  static const records = '/api/patient/records';
  static String record(String appointmentId) =>
      '$records/${Uri.encodeComponent(appointmentId)}';
  static const notifications = '/api/patient/notifications';
  static const unreadCount = '$notifications/unread-count';
  static const markAllRead = '$notifications/mark-all-read';
  static String markRead(String id) =>
      '$notifications/${Uri.encodeComponent(id)}/read';
  static const clinics = '/api/patient/booking/clinics';
  static String specialties(String id) =>
      '$clinics/${Uri.encodeComponent(id)}/specialties';
  static String doctors(String id) =>
      '$clinics/${Uri.encodeComponent(id)}/doctors';
  static const insurance = '/api/patient/insurance';
  static String insuranceItem(String id) =>
      '$insurance/${Uri.encodeComponent(id)}';
  static String principal(String id) => '${insuranceItem(id)}/set-principal';
}
