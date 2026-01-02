import 'dart:async';
import '../core/api_client.dart';

/// Call state enum
enum CallState {
  idle,
  calling,
  ringing,
  connected,
  ended,
  failed,
}

/// Call info model
class CallInfo {
  final String callId;
  final String channelName;
  final String token;
  final int uid;
  final String recipientId;
  final String recipientName;
  final DateTime startedAt;

  CallInfo({
    required this.callId,
    required this.channelName,
    required this.token,
    required this.uid,
    required this.recipientId,
    required this.recipientName,
    required this.startedAt,
  });

  factory CallInfo.fromJson(Map<String, dynamic> json) {
    return CallInfo(
      callId: json['callId'] as String,
      channelName: json['channelName'] as String,
      token: json['token'] as String,
      uid: json['uid'] as int,
      recipientId: json['recipientId'] as String,
      recipientName: json['recipientName'] as String? ?? 'السائق',
      startedAt: DateTime.parse(json['startedAt'] as String),
    );
  }
}

/// Service for voice call operations using Agora
class CallService {
  final ApiClient _apiClient;

  CallService(this._apiClient);

  /// Start a call with a driver
  Future<CallInfo> startCall(String driverId) async {
    final response = await _apiClient.post('/calls/start', data: {
      'recipientId': driverId,
    });

    return CallInfo.fromJson(response.data['call']);
  }

  /// End a call
  Future<void> endCall(String callId) async {
    await _apiClient.post('/calls/$callId/end');
  }

  /// Get call token (for reconnection)
  Future<String> getCallToken(String channelName) async {
    final response = await _apiClient.get('/calls/token', queryParameters: {
      'channelName': channelName,
    });

    return response.data['token'] as String;
  }

  /// Report call quality
  Future<void> reportCallQuality(String callId, {
    required int quality,
    String? feedback,
  }) async {
    await _apiClient.post('/calls/$callId/quality', data: {
      'quality': quality,
      if (feedback != null) 'feedback': feedback,
    });
  }
}
