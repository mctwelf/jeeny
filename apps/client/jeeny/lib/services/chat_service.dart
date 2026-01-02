import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';

import '../core/api_client.dart';
import '../models/chat.dart';
import '../models/enums.dart';

/// Service for chat operations
class ChatService {
  final ApiClient _apiClient;
  final FirebaseFirestore _firestore;

  ChatService(this._apiClient, {FirebaseFirestore? firestore})
      : _firestore = firestore ?? FirebaseFirestore.instance;

  /// Get all conversations for the current user
  Future<List<Conversation>> getConversations() async {
    final response = await _apiClient.get('/chat/conversations');
    final List<dynamic> data = response.data['conversations'] ?? [];
    return data.map((json) => Conversation.fromJson(json)).toList();
  }

  /// Get or create a conversation for a ride
  Future<Conversation> getOrCreateConversation(String rideId) async {
    final response = await _apiClient.post('/chat/conversations', data: {
      'rideId': rideId,
    });
    return Conversation.fromJson(response.data['conversation']);
  }

  /// Get messages for a conversation
  Future<List<Message>> getMessages(String conversationId, {
    int limit = 50,
    String? beforeMessageId,
  }) async {
    final queryParams = <String, dynamic>{'limit': limit};
    if (beforeMessageId != null) {
      queryParams['before'] = beforeMessageId;
    }

    final response = await _apiClient.get(
      '/chat/conversations/$conversationId/messages',
      queryParameters: queryParams,
    );

    final List<dynamic> data = response.data['messages'] ?? [];
    return data.map((json) => Message.fromJson(json)).toList();
  }

  /// Send a message
  Future<Message> sendMessage({
    required String conversationId,
    required String content,
    MessageType type = MessageType.text,
    String? mediaUrl,
  }) async {
    final response = await _apiClient.post(
      '/chat/conversations/$conversationId/messages',
      data: {
        'content': content,
        'type': type.name,
        if (mediaUrl != null) 'mediaUrl': mediaUrl,
      },
    );

    return Message.fromJson(response.data['message']);
  }

  /// Mark messages as read
  Future<void> markAsRead(String conversationId) async {
    await _apiClient.post('/chat/conversations/$conversationId/read');
  }

  /// Stream messages for a conversation (real-time)
  Stream<List<Message>> watchMessages(String conversationId) {
    return _firestore
        .collection('conversations')
        .doc(conversationId)
        .collection('messages')
        .orderBy('createdAt', descending: true)
        .limit(100)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => Message.fromJson({...doc.data(), 'id': doc.id}))
            .toList());
  }

  /// Stream conversation updates (for unread count, etc.)
  Stream<Conversation> watchConversation(String conversationId) {
    return _firestore
        .collection('conversations')
        .doc(conversationId)
        .snapshots()
        .map((doc) => Conversation.fromJson({...doc.data()!, 'id': doc.id}));
  }

  /// Send a quick message (predefined)
  Future<Message> sendQuickMessage(String conversationId, String quickMessageKey) async {
    final quickMessages = {
      'on_my_way': 'أنا في الطريق',
      'arrived': 'وصلت',
      'waiting': 'أنا في الانتظار',
      'running_late': 'سأتأخر قليلاً',
      'ok': 'حسناً',
      'thank_you': 'شكراً',
    };

    final content = quickMessages[quickMessageKey] ?? quickMessageKey;
    return sendMessage(conversationId: conversationId, content: content);
  }

  /// Upload media and send as message
  Future<Message> sendMediaMessage({
    required String conversationId,
    required String filePath,
    required MessageType type,
    String? caption,
  }) async {
    // First upload the media
    final uploadResponse = await _apiClient.uploadFile(
      '/chat/upload',
      filePath,
      field: 'media',
    );

    final mediaUrl = uploadResponse.data['url'] as String;

    // Then send the message with the media URL
    return sendMessage(
      conversationId: conversationId,
      content: caption ?? '',
      type: type,
      mediaUrl: mediaUrl,
    );
  }
}
