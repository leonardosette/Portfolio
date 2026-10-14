import 'package:equatable/equatable.dart';

import '../../../core/json.dart';

class AppNotification extends Equatable {
  const AppNotification({
    required this.id,
    required this.title,
    required this.body,
    required this.link,
    required this.read,
    required this.createdAt,
  });
  final String id;
  final String title;
  final String body;
  final String link;
  final bool read;
  final DateTime? createdAt;
  factory AppNotification.fromJson(Json json) => AppNotification(
    id: asString(json['id']),
    title: asString(json['title']),
    body: asString(json['body']),
    link: asString(json['link']),
    read: asBool(json['read']),
    createdAt: asDateTimeOrNull(json['createdAt']),
  );
  @override
  List<Object?> get props => [id, title, body, link, read, createdAt];
  @override
  bool get stringify => false;
  AppNotification markRead() => AppNotification(
    id: id,
    title: title,
    body: body,
    link: link,
    read: true,
    createdAt: createdAt,
  );
}
