import 'package:equatable/equatable.dart';
import 'enums.dart';

/// Notification model
class AppNotification extends Equatable {
  final String id;
  final String userId;
  final NotificationType type;
  final String title;
  final String body;
  final Map<String, dynamic>? data;
  final bool isRead;
  final DateTime createdAt;

  const AppNotification({
    required this.id,
    required this.userId,
    required this.type,
    required this.title,
    required this.body,
    this.data,
    this.isRead = false,
    required this.createdAt,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: json['id'] as String,
      userId: json['userId'] as String,
      type: NotificationType.values.firstWhere(
        (e) => e.name == json['type'],
        orElse: () => NotificationType.general,
      ),
      title: json['title'] as String,
      body: json['body'] as String,
      data: json['data'] as Map<String, dynamic>?,
      isRead: json['isRead'] as bool? ?? false,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'userId': userId,
        'type': type.name,
        'title': title,
        'body': body,
        if (data != null) 'data': data,
        'isRead': isRead,
        'createdAt': createdAt.toIso8601String(),
      };

  AppNotification copyWith({bool? isRead}) {
    return AppNotification(
      id: id,
      userId: userId,
      type: type,
      title: title,
      body: body,
      data: data,
      isRead: isRead ?? this.isRead,
      createdAt: createdAt,
    );
  }

  @override
  List<Object?> get props => [id, type, isRead];
}

/// Push notification payload
class PushNotificationPayload extends Equatable {
  final String? rideId;
  final String? orderId;
  final String? conversationId;
  final String? action;

  const PushNotificationPayload({
    this.rideId,
    this.orderId,
    this.conversationId,
    this.action,
  });

  factory PushNotificationPayload.fromJson(Map<String, dynamic> json) {
    return PushNotificationPayload(
      rideId: json['rideId'] as String?,
      orderId: json['orderId'] as String?,
      conversationId: json['conversationId'] as String?,
      action: json['action'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        if (rideId != null) 'rideId': rideId,
        if (orderId != null) 'orderId': orderId,
        if (conversationId != null) 'conversationId': conversationId,
        if (action != null) 'action': action,
      };

  @override
  List<Object?> get props => [rideId, orderId, conversationId, action];
}
