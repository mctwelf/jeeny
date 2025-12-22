/**
 * Jeeny Notifications Lambda Handler
 *
 * Handles all notification-related operations including:
 * - Get user notifications
 * - Mark notifications as read
 * - Notification settings management
 * - Device token registration for push notifications
 */

import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  QueryCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

// Initialize clients
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Environment variables
const NOTIFICATIONS_TABLE = process.env.NOTIFICATIONS_TABLE || 'jeeny-notifications';
const USERS_TABLE = process.env.USERS_TABLE || 'jeeny-users';

// Types
interface Notification {
  notificationId: string;
  userId: string;
  type: 'ride' | 'payment' | 'promo' | 'system' | 'chat';
  title: string;
  titleAr?: string;
  body: string;
  bodyAr?: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

interface NotificationSettings {
  userId: string;
  pushEnabled: boolean;
  smsEnabled: boolean;
  emailEnabled: boolean;
  rideUpdates: boolean;
  promotions: boolean;
  news: boolean;
}

// Response helper
const response = (statusCode: number, body: any): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true',
  },
  body: JSON.stringify(body),
});

const getUserIdFromEvent = (event: APIGatewayProxyEvent): string | null => {
  try {
    const claims = event.requestContext.authorizer?.claims;
    return claims?.sub || claims?.['cognito:username'] || null;
  } catch {
    return null;
  }
};

/**
 * Get user notifications
 */
const getNotifications = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return response(401, { error: 'Unauthorized' });
    }

    const { unreadOnly, limit = '20', lastKey } = event.queryStringParameters || {};

    const params: any = {
      TableName: NOTIFICATIONS_TABLE,
      IndexName: 'userId-createdAt-index',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
      ScanIndexForward: false,
      Limit: parseInt(limit),
    };

    if (unreadOnly === 'true') {
      params.FilterExpression = 'isRead = :isRead';
      params.ExpressionAttributeValues[':isRead'] = false;
    }

    if (lastKey) {
      params.ExclusiveStartKey = JSON.parse(Buffer.from(lastKey, 'base64').toString());
    }

    const result = await docClient.send(new QueryCommand(params));

    return response(200, {
      success: true,
      data: {
        notifications: result.Items || [],
        lastKey: result.LastEvaluatedKey
          ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
          : null,
        unreadCount: (result.Items || []).filter((n: any) => !n.isRead).length,
      },
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    return response(500, { error: 'Failed to get notifications' });
  }
};

/**
 * Get notification by ID
 */
const getNotificationById = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return response(401, { error: 'Unauthorized' });
    }

    const notificationId = event.pathParameters?.notificationId;
    if (!notificationId) {
      return response(400, { error: 'Notification ID is required' });
    }

    const result = await docClient.send(new GetCommand({
      TableName: NOTIFICATIONS_TABLE,
      Key: { notificationId },
    }));

    if (!result.Item || result.Item.userId !== userId) {
      return response(404, { error: 'Notification not found' });
    }

    return response(200, {
      success: true,
      data: result.Item,
    });
  } catch (error) {
    console.error('Error getting notification:', error);
    return response(500, { error: 'Failed to get notification' });
  }
};

/**
 * Mark notification as read
 */
const markAsRead = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return response(401, { error: 'Unauthorized' });
    }

    const notificationId = event.pathParameters?.notificationId;
    if (!notificationId) {
      return response(400, { error: 'Notification ID is required' });
    }

    const now = new Date().toISOString();

    await docClient.send(new UpdateCommand({
      TableName: NOTIFICATIONS_TABLE,
      Key: { notificationId },
      UpdateExpression: 'SET isRead = :isRead, readAt = :readAt',
      ConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':isRead': true,
        ':readAt': now,
        ':userId': userId,
      },
    }));

    return response(200, {
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    if (error.name === 'ConditionalCheckFailedException') {
      return response(404, { error: 'Notification not found' });
    }
    return response(500, { error: 'Failed to mark notification as read' });
  }
};

/**
 * Mark all notifications as read
 */
const markAllAsRead = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return response(401, { error: 'Unauthorized' });
    }

    // Get all unread notifications
    const result = await docClient.send(new QueryCommand({
      TableName: NOTIFICATIONS_TABLE,
      IndexName: 'userId-createdAt-index',
      KeyConditionExpression: 'userId = :userId',
      FilterExpression: 'isRead = :isRead',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':isRead': false,
      },
    }));

    const now = new Date().toISOString();

    // Update each notification
    if (result.Items && result.Items.length > 0) {
      await Promise.all(
        result.Items.map((item) =>
          docClient.send(new UpdateCommand({
            TableName: NOTIFICATIONS_TABLE,
            Key: { notificationId: item.notificationId },
            UpdateExpression: 'SET isRead = :isRead, readAt = :readAt',
            ExpressionAttributeValues: {
              ':isRead': true,
              ':readAt': now,
            },
          }))
        )
      );
    }

    return response(200, {
      success: true,
      message: `Marked ${result.Items?.length || 0} notifications as read`,
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return response(500, { error: 'Failed to mark notifications as read' });
  }
};

/**
 * Delete notification
 */
const deleteNotification = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return response(401, { error: 'Unauthorized' });
    }

    const notificationId = event.pathParameters?.notificationId;
    if (!notificationId) {
      return response(400, { error: 'Notification ID is required' });
    }

    // Verify ownership first
    const existing = await docClient.send(new GetCommand({
      TableName: NOTIFICATIONS_TABLE,
      Key: { notificationId },
    }));

    if (!existing.Item || existing.Item.userId !== userId) {
      return response(404, { error: 'Notification not found' });
    }

    await docClient.send(new DeleteCommand({
      TableName: NOTIFICATIONS_TABLE,
      Key: { notificationId },
    }));

    return response(200, {
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return response(500, { error: 'Failed to delete notification' });
  }
};

/**
 * Get notification settings
 */
const getSettings = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return response(401, { error: 'Unauthorized' });
    }

    const result = await docClient.send(new GetCommand({
      TableName: USERS_TABLE,
      Key: { userId },
      ProjectionExpression: 'notificationSettings',
    }));

    const defaultSettings: NotificationSettings = {
      userId,
      pushEnabled: true,
      smsEnabled: true,
      emailEnabled: true,
      rideUpdates: true,
      promotions: true,
      news: true,
    };

    return response(200, {
      success: true,
      data: result.Item?.notificationSettings || defaultSettings,
    });
  } catch (error) {
    console.error('Error getting notification settings:', error);
    return response(500, { error: 'Failed to get notification settings' });
  }
};

/**
 * Update notification settings
 */
const updateSettings = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return response(401, { error: 'Unauthorized' });
    }

    const body = JSON.parse(event.body || '{}');

    const settings: NotificationSettings = {
      userId,
      pushEnabled: body.pushEnabled ?? true,
      smsEnabled: body.smsEnabled ?? true,
      emailEnabled: body.emailEnabled ?? true,
      rideUpdates: body.rideUpdates ?? true,
      promotions: body.promotions ?? true,
      news: body.news ?? true,
    };

    await docClient.send(new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { userId },
      UpdateExpression: 'SET notificationSettings = :settings, updatedAt = :now',
      ExpressionAttributeValues: {
        ':settings': settings,
        ':now': new Date().toISOString(),
      },
    }));

    return response(200, {
      success: true,
      data: settings,
      message: 'Notification settings updated',
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return response(500, { error: 'Failed to update notification settings' });
  }
};

/**
 * Register device token for push notifications
 */
const registerDeviceToken = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return response(401, { error: 'Unauthorized' });
    }

    const body = JSON.parse(event.body || '{}');
    const { token, platform, deviceId } = body;

    if (!token || !platform) {
      return response(400, { error: 'Token and platform are required' });
    }

    const now = new Date().toISOString();

    // Store device token
    await docClient.send(new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { userId },
      UpdateExpression: 'SET deviceTokens = list_append(if_not_exists(deviceTokens, :empty), :token), updatedAt = :now',
      ExpressionAttributeValues: {
        ':token': [{
          token,
          platform,
          deviceId,
          registeredAt: now,
        }],
        ':empty': [],
        ':now': now,
      },
    }));

    // TODO: Register with SNS/Pinpoint for push notifications

    return response(200, {
      success: true,
      message: 'Device token registered',
    });
  } catch (error) {
    console.error('Error registering device token:', error);
    return response(500, { error: 'Failed to register device token' });
  }
};

/**
 * Remove device token
 */
const removeDeviceToken = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return response(401, { error: 'Unauthorized' });
    }

    const body = JSON.parse(event.body || '{}');
    const { token } = body;

    if (!token) {
      return response(400, { error: 'Token is required' });
    }

    // Get current tokens
    const result = await docClient.send(new GetCommand({
      TableName: USERS_TABLE,
      Key: { userId },
      ProjectionExpression: 'deviceTokens',
    }));

    const tokens = result.Item?.deviceTokens || [];
    const updatedTokens = tokens.filter((t: any) => t.token !== token);

    await docClient.send(new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { userId },
      UpdateExpression: 'SET deviceTokens = :tokens, updatedAt = :now',
      ExpressionAttributeValues: {
        ':tokens': updatedTokens,
        ':now': new Date().toISOString(),
      },
    }));

    return response(200, {
      success: true,
      message: 'Device token removed',
    });
  } catch (error) {
    console.error('Error removing device token:', error);
    return response(500, { error: 'Failed to remove device token' });
  }
};

/**
 * Main handler
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('Notifications Lambda:', JSON.stringify(event, null, 2));

  const { httpMethod, path, resource } = event;

  try {
    // GET /notifications
    if ((path.match(/\/notifications\/?$/) || resource === '/notifications') && httpMethod === 'GET') {
      return getNotifications(event);
    }

    // GET /notifications/{notificationId}
    if ((path.match(/\/notifications\/[^/]+\/?$/) || resource === '/notifications/{notificationId}') && httpMethod === 'GET') {
      return getNotificationById(event);
    }

    // DELETE /notifications/{notificationId}
    if ((path.match(/\/notifications\/[^/]+\/?$/) || resource === '/notifications/{notificationId}') && httpMethod === 'DELETE') {
      return deleteNotification(event);
    }

    // PUT /notifications/{notificationId}/read
    if ((path.match(/\/notifications\/[^/]+\/read\/?$/) || resource === '/notifications/{notificationId}/read') && httpMethod === 'PUT') {
      return markAsRead(event);
    }

    // PUT /notifications/read-all
    if ((path.match(/\/notifications\/read-all\/?$/) || resource === '/notifications/read-all') && httpMethod === 'PUT') {
      return markAllAsRead(event);
    }

    // GET /notifications/settings
    if ((path.match(/\/notifications\/settings\/?$/) || resource === '/notifications/settings') && httpMethod === 'GET') {
      return getSettings(event);
    }

    // PUT /notifications/settings
    if ((path.match(/\/notifications\/settings\/?$/) || resource === '/notifications/settings') && httpMethod === 'PUT') {
      return updateSettings(event);
    }

    // POST /notifications/device-token
    if ((path.match(/\/notifications\/device-token\/?$/) || resource === '/notifications/device-token') && httpMethod === 'POST') {
      return registerDeviceToken(event);
    }

    // DELETE /notifications/device-token
    if ((path.match(/\/notifications\/device-token\/?$/) || resource === '/notifications/device-token') && httpMethod === 'DELETE') {
      return removeDeviceToken(event);
    }

    return response(404, { error: 'Not found' });
  } catch (error) {
    console.error('Unhandled error:', error);
    return response(500, { error: 'Internal server error' });
  }
};
