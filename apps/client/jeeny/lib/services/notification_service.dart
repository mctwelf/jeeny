import 'dart:async';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import '../core/api_client.dart';
import '../models/notification.dart' as models;

/// Service for push notifications using FCM
class NotificationService {
  final ApiClient _apiClient;
  final FirebaseMessaging _messaging;
  final FlutterLocalNotificationsPlugin _localNotifications;

  // Stream controllers for notification events
  final _notificationStreamController = StreamController<models.AppNotification>.broadcast();
  final _tokenStreamController = StreamController<String>.broadcast();

  NotificationService(
    this._apiClient, {
    FirebaseMessaging? messaging,
    FlutterLocalNotificationsPlugin? localNotifications,
  })  : _messaging = messaging ?? FirebaseMessaging.instance,
        _localNotifications = localNotifications ?? FlutterLocalNotificationsPlugin();

  /// Stream of incoming notifications
  Stream<models.AppNotification> get notificationStream => _notificationStreamController.stream;

  /// Stream of FCM token updates
  Stream<String> get tokenStream => _tokenStreamController.stream;

  /// Initialize notification service
  Future<void> initialize() async {
    // Request permission
    await _requestPermission();

    // Initialize local notifications
    await _initializeLocalNotifications();

    // Get and register FCM token
    final token = await _messaging.getToken();
    if (token != null) {
      await _registerToken(token);
      _tokenStreamController.add(token);
    }

    // Listen for token refresh
    _messaging.onTokenRefresh.listen((token) async {
      await _registerToken(token);
      _tokenStreamController.add(token);
    });

    // Handle foreground messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // Handle background message tap
    FirebaseMessaging.onMessageOpenedApp.listen(_handleMessageTap);

    // Check for initial message (app opened from terminated state)
    final initialMessage = await _messaging.getInitialMessage();
    if (initialMessage != null) {
      _handleMessageTap(initialMessage);
    }
  }

  /// Request notification permission
  Future<bool> _requestPermission() async {
    final settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    return settings.authorizationStatus == AuthorizationStatus.authorized;
  }

  /// Initialize local notifications
  Future<void> _initializeLocalNotifications() async {
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: _onNotificationTap,
    );
  }

  /// Register FCM token with backend
  Future<void> _registerToken(String token) async {
    try {
      await _apiClient.post('/notifications/register', data: {
        'token': token,
        'platform': 'fcm',
      });
    } catch (e) {
      // Silently fail - token registration is not critical
    }
  }

  /// Handle foreground message
  void _handleForegroundMessage(RemoteMessage message) {
    final notification = _parseNotification(message);
    _notificationStreamController.add(notification);

    // Show local notification
    _showLocalNotification(notification);
  }

  /// Handle message tap (background/terminated)
  void _handleMessageTap(RemoteMessage message) {
    final notification = _parseNotification(message);
    _notificationStreamController.add(notification);
  }

  /// Handle local notification tap
  void _onNotificationTap(NotificationResponse response) {
    // Parse payload and navigate
    if (response.payload != null) {
      // Navigation will be handled by the app
    }
  }

  /// Parse RemoteMessage to AppNotification
  models.AppNotification _parseNotification(RemoteMessage message) {
    return models.AppNotification(
      id: message.messageId ?? DateTime.now().millisecondsSinceEpoch.toString(),
      userId: '', // Will be set by backend
      type: _parseNotificationType(message.data['type']),
      title: message.notification?.title ?? '',
      body: message.notification?.body ?? '',
      data: message.data,
      isRead: false,
      createdAt: DateTime.now(),
    );
  }

  models.NotificationType _parseNotificationType(String? type) {
    switch (type) {
      case 'ride_accepted':
        return models.NotificationType.rideAccepted;
      case 'driver_arriving':
        return models.NotificationType.driverArriving;
      case 'ride_started':
        return models.NotificationType.rideStarted;
      case 'ride_completed':
        return models.NotificationType.rideCompleted;
      case 'payment':
        return models.NotificationType.payment;
      case 'promotion':
        return models.NotificationType.promotion;
      case 'chat':
        return models.NotificationType.chat;
      default:
        return models.NotificationType.general;
    }
  }

  /// Show local notification
  Future<void> _showLocalNotification(models.AppNotification notification) async {
    const androidDetails = AndroidNotificationDetails(
      'jeeny_channel',
      'Jeeny Notifications',
      channelDescription: 'Notifications from Jeeny app',
      importance: Importance.high,
      priority: Priority.high,
      showWhen: true,
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _localNotifications.show(
      notification.id.hashCode,
      notification.title,
      notification.body,
      details,
      payload: notification.id,
    );
  }

  /// Get notification history
  Future<List<models.AppNotification>> getNotifications({
    int page = 1,
    int limit = 20,
  }) async {
    final response = await _apiClient.get(
      '/notifications',
      queryParameters: {'page': page, 'limit': limit},
    );

    final List<dynamic> data = response.data['notifications'] ?? [];
    return data.map((json) => models.AppNotification.fromJson(json)).toList();
  }

  /// Mark notification as read
  Future<void> markAsRead(String notificationId) async {
    await _apiClient.post('/notifications/$notificationId/read');
  }

  /// Mark all notifications as read
  Future<void> markAllAsRead() async {
    await _apiClient.post('/notifications/read-all');
  }

  /// Get unread count
  Future<int> getUnreadCount() async {
    final response = await _apiClient.get('/notifications/unread-count');
    return response.data['count'] as int? ?? 0;
  }

  /// Dispose resources
  void dispose() {
    _notificationStreamController.close();
    _tokenStreamController.close();
  }
}
