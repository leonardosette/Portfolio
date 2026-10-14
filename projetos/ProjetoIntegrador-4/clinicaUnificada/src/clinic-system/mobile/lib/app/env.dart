import 'package:flutter/foundation.dart';

class Env {
  static const baseUrl = String.fromEnvironment('SCU_BASE_URL');
  static const isDev = bool.fromEnvironment('SCU_DEV', defaultValue: false);
  static String validate(String value, {bool release = kReleaseMode}) {
    final uri = Uri.tryParse(value);
    if (uri == null ||
        !uri.hasAuthority ||
        uri.host.isEmpty ||
        uri.userInfo.isNotEmpty ||
        uri.hasQuery ||
        uri.hasFragment ||
        !['http', 'https'].contains(uri.scheme) ||
        (release && uri.scheme != 'https')) {
      throw const FormatException(
        'Configure SCU_BASE_URL com a URL da API; release exige HTTPS.',
      );
    }
    return value.replaceFirst(RegExp(r'/$'), '');
  }
}
