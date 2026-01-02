import 'dart:async';
import 'package:flutter/foundation.dart';
import '../models/chat.dart';
import '../models/enums.dart';
import '../services/chat_service.dart';

/// Chat state provider
class ChatProvider extends ChangeNotifier {
  final ChatService _chatService;

  ChatProvider(this._chatService);

  // State
  List<Conversation> _conversations = [];
  Conversation? _activeConversation;
  List<Message> _messages = [];
  bool _isLoading = false;
  bool _isSending = false;
  String? _error;

  // Streams
  StreamSubscription? _messagesSubscription;
  StreamSubscription? _conversationSubscription;

  // Getters
  List<Conversation> get conversations => _conversations;
  Conversation? get activeConversation => _activeConversation;
  List<Message> get messages => _messages;
  bool get isLoading => _isLoading;
  bool get isSending => _isSending;
  String? get error => _error;
  int get totalUnreadCount =>
      _conversations.fold(0, (sum, c) => sum + c.unreadCount);

  /// Load all conversations
  Future<void> loadConversations() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _conversations = await _chatService.getConversations();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Open a conversation for a ride
  Future<void> openConversation(String rideId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _activeConversation = await _chatService.getOrCreateConversation(rideId);
      _messages = await _chatService.getMessages(_activeConversation!.id);

      // Start listening for real-time updates
      _startListening();

      // Mark as read
      await _chatService.markAsRead(_activeConversation!.id);
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Open an existing conversation by ID
  Future<void> openConversationById(String conversationId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      // Find in existing conversations or fetch
      _activeConversation = _conversations.firstWhere(
        (c) => c.id == conversationId,
        orElse: () => throw Exception('Conversation not found'),
      );
      _messages = await _chatService.getMessages(conversationId);

      // Start listening for real-time updates
      _startListening();

      // Mark as read
      await _chatService.markAsRead(conversationId);
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Start listening for real-time updates
  void _startListening() {
    if (_activeConversation == null) return;

    // Cancel existing subscriptions
    _stopListening();

    // Listen for new messages
    _messagesSubscription = _chatService
        .watchMessages(_activeConversation!.id)
        .listen((messages) {
      _messages = messages;
      notifyListeners();
    });

    // Listen for conversation updates
    _conversationSubscription = _chatService
        .watchConversation(_activeConversation!.id)
        .listen((conversation) {
      _activeConversation = conversation;
      // Update in conversations list
      final index = _conversations.indexWhere((c) => c.id == conversation.id);
      if (index != -1) {
        _conversations[index] = conversation;
      }
      notifyListeners();
    });
  }

  /// Stop listening for updates
  void _stopListening() {
    _messagesSubscription?.cancel();
    _messagesSubscription = null;
    _conversationSubscription?.cancel();
    _conversationSubscription = null;
  }

  /// Send a text message
  Future<bool> sendMessage(String content) async {
    if (_activeConversation == null || content.trim().isEmpty) return false;

    _isSending = true;
    _error = null;
    notifyListeners();

    try {
      final message = await _chatService.sendMessage(
        conversationId: _activeConversation!.id,
        content: content.trim(),
      );

      // Add to local list (will be updated by stream anyway)
      _messages.insert(0, message);
      return true;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isSending = false;
      notifyListeners();
    }
  }

  /// Send a quick message
  Future<bool> sendQuickMessage(String quickMessageKey) async {
    if (_activeConversation == null) return false;

    _isSending = true;
    _error = null;
    notifyListeners();

    try {
      final message = await _chatService.sendQuickMessage(
        _activeConversation!.id,
        quickMessageKey,
      );
      _messages.insert(0, message);
      return true;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isSending = false;
      notifyListeners();
    }
  }

  /// Send a media message
  Future<bool> sendMediaMessage({
    required String filePath,
    required MessageType type,
    String? caption,
  }) async {
    if (_activeConversation == null) return false;

    _isSending = true;
    _error = null;
    notifyListeners();

    try {
      final message = await _chatService.sendMediaMessage(
        conversationId: _activeConversation!.id,
        filePath: filePath,
        type: type,
        caption: caption,
      );
      _messages.insert(0, message);
      return true;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isSending = false;
      notifyListeners();
    }
  }

  /// Load more messages (pagination)
  Future<void> loadMoreMessages() async {
    if (_activeConversation == null || _messages.isEmpty) return;

    _isLoading = true;
    notifyListeners();

    try {
      final olderMessages = await _chatService.getMessages(
        _activeConversation!.id,
        beforeMessageId: _messages.last.id,
      );
      _messages.addAll(olderMessages);
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Close active conversation
  void closeConversation() {
    _stopListening();
    _activeConversation = null;
    _messages = [];
    notifyListeners();
  }

  /// Clear error
  void clearError() {
    _error = null;
    notifyListeners();
  }

  @override
  void dispose() {
    _stopListening();
    super.dispose();
  }
}
