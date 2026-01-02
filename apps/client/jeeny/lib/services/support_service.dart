import '../core/api_client.dart';

/// Support ticket model
class SupportTicket {
  final String id;
  final String subject;
  final String description;
  final String category;
  final String status;
  final String? rideId;
  final DateTime createdAt;
  final DateTime? resolvedAt;
  final List<TicketMessage> messages;

  SupportTicket({
    required this.id,
    required this.subject,
    required this.description,
    required this.category,
    required this.status,
    this.rideId,
    required this.createdAt,
    this.resolvedAt,
    this.messages = const [],
  });

  factory SupportTicket.fromJson(Map<String, dynamic> json) {
    return SupportTicket(
      id: json['id'],
      subject: json['subject'],
      description: json['description'],
      category: json['category'],
      status: json['status'],
      rideId: json['rideId'],
      createdAt: DateTime.parse(json['createdAt']),
      resolvedAt: json['resolvedAt'] != null ? DateTime.parse(json['resolvedAt']) : null,
      messages: (json['messages'] as List?)?.map((m) => TicketMessage.fromJson(m)).toList() ?? [],
    );
  }
}

/// Ticket message model
class TicketMessage {
  final String id;
  final String content;
  final bool isFromSupport;
  final DateTime createdAt;

  TicketMessage({
    required this.id,
    required this.content,
    required this.isFromSupport,
    required this.createdAt,
  });

  factory TicketMessage.fromJson(Map<String, dynamic> json) {
    return TicketMessage(
      id: json['id'],
      content: json['content'],
      isFromSupport: json['isFromSupport'] ?? false,
      createdAt: DateTime.parse(json['createdAt']),
    );
  }
}


/// FAQ item model
class FaqItem {
  final String id;
  final String question;
  final String answer;
  final String category;

  FaqItem({
    required this.id,
    required this.question,
    required this.answer,
    required this.category,
  });

  factory FaqItem.fromJson(Map<String, dynamic> json) {
    return FaqItem(
      id: json['id'],
      question: json['question'],
      answer: json['answer'],
      category: json['category'],
    );
  }
}

/// Service for support operations
class SupportService {
  final ApiClient _apiClient;

  SupportService(this._apiClient);

  /// Get FAQs
  Future<List<FaqItem>> getFaqs({String? category}) async {
    final queryParams = <String, dynamic>{};
    if (category != null) queryParams['category'] = category;

    final response = await _apiClient.get('/support/faqs', queryParameters: queryParams);
    final List<dynamic> data = response.data['faqs'] ?? [];
    return data.map((json) => FaqItem.fromJson(json)).toList();
  }

  /// Get user's support tickets
  Future<List<SupportTicket>> getTickets() async {
    final response = await _apiClient.get('/support/tickets');
    final List<dynamic> data = response.data['tickets'] ?? [];
    return data.map((json) => SupportTicket.fromJson(json)).toList();
  }

  /// Get ticket details
  Future<SupportTicket> getTicket(String ticketId) async {
    final response = await _apiClient.get('/support/tickets/$ticketId');
    return SupportTicket.fromJson(response.data);
  }

  /// Create support ticket
  Future<SupportTicket> createTicket({
    required String subject,
    required String description,
    required String category,
    String? rideId,
  }) async {
    final response = await _apiClient.post('/support/tickets', data: {
      'subject': subject,
      'description': description,
      'category': category,
      if (rideId != null) 'rideId': rideId,
    });
    return SupportTicket.fromJson(response.data);
  }

  /// Reply to ticket
  Future<void> replyToTicket(String ticketId, String message) async {
    await _apiClient.post('/support/tickets/$ticketId/reply', data: {
      'message': message,
    });
  }

  /// Close ticket
  Future<void> closeTicket(String ticketId) async {
    await _apiClient.post('/support/tickets/$ticketId/close');
  }
}
