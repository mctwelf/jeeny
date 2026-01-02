import 'package:equatable/equatable.dart';
import 'enums.dart';

/// Conversation model
class Conversation extends Equatable {
  final String id;
  final String rideId;
  final String clientId;
  final String driverId;
  final String? lastMessage;
  final DateTime? lastMessageAt;
  final int unreadCount;
  final bool isActive;
  final DateTime createdAt;

  const Conversation({
    required this.id,
    required this.rideId,
    required this.clientId,
    required this.driverId,
    this.lastMessage,
    this.lastMessageAt,
    this.unreadCount = 0,
    this.isActive = true,
    required this.createdAt,
  });

  factory Conversation.fromJson(Map<String, dynamic> json) {
    return Conversation(
      id: json['id'] as String,
      rideId: json['rideId'] as String,
      clientId: json['clientId'] as String,
      driverId: json['driverId'] as String,
      lastMessage: json['lastMessage'] as String?,
      lastMessageAt: json['lastMessageAt'] != null
          ? DateTime.parse(json['lastMessageAt'] as String)
          : null,
      unreadCount: json['unreadCount'] as int? ?? 0,
      isActive: json['isActive'] as bool? ?? true,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'rideId': rideId,
        'clientId': clientId,
        'driverId': driverId,
        if (lastMessage != null) 'lastMessage': lastMessage,
        if (lastMessageAt != null)
          'lastMessageAt': lastMessageAt!.toIso8601String(),
        'unreadCount': unreadCount,
        'isActive': isActive,
        'createdAt': createdAt.toIso8601String(),
      };

  @override
  List<Object?> get props => [id, rideId, unreadCount];
}

/// Message model
class Message extends Equatable {
  final String id;
  final String conversationId;
  final String senderId;
  final MessageType type;
  final String content;
  final String? mediaUrl;
  final bool isRead;
  final DateTime createdAt;

  const Message({
    required this.id,
    required this.conversationId,
    required this.senderId,
    required this.type,
    required this.content,
    this.mediaUrl,
    this.isRead = false,
    required this.createdAt,
  });

  factory Message.fromJson(Map<String, dynamic> json) {
    return Message(
      id: json['id'] as String,
      conversationId: json['conversationId'] as String,
      senderId: json['senderId'] as String,
      type: MessageType.values.firstWhere(
        (e) => e.name == json['type'],
        orElse: () => MessageType.text,
      ),
      content: json['content'] as String,
      mediaUrl: json['mediaUrl'] as String?,
      isRead: json['isRead'] as bool? ?? false,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'conversationId': conversationId,
        'senderId': senderId,
        'type': type.name,
        'content': content,
        if (mediaUrl != null) 'mediaUrl': mediaUrl,
        'isRead': isRead,
        'createdAt': createdAt.toIso8601String(),
      };

  @override
  List<Object?> get props => [id, conversationId, senderId, createdAt];
}

/// Send message request
class SendMessageRequest extends Equatable {
  final String conversationId;
  final MessageType type;
  final String content;
  final String? mediaUrl;

  const SendMessageRequest({
    required this.conversationId,
    required this.type,
    required this.content,
    this.mediaUrl,
  });

  Map<String, dynamic> toJson() => {
        'conversationId': conversationId,
        'type': type.name,
        'content': content,
        if (mediaUrl != null) 'mediaUrl': mediaUrl,
      };

  @override
  List<Object?> get props => [conversationId, type, content];
}
