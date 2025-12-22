/**
 * Jeeny WebSocket Lambda Handler
 *
 * Handles real-time WebSocket connections for:
 * - Driver location updates
 * - Ride status updates
 * - Chat messages
 * - Notifications
 */

import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  DeleteCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
  DeleteConnectionCommand,
} from '@aws-sdk/client-apigatewaymanagementapi';

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Environment variables
const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE || 'jeeny-websocket-connections';
const USERS_TABLE = process.env.USERS_TABLE || 'jeeny-users';
const RIDES_TABLE = process.env.RIDES_TABLE || 'jeeny-rides';
const CHATS_TABLE = process.env.CHATS_TABLE || 'jeeny-chats';
const WEBSOCKET_ENDPOINT = process.env.WEBSOCKET_ENDPOINT || '';

// Types
interface WebSocketConnection {
  connectionId: string;
  userId: string;
  userType: 'client' | 'driver' | 'admin' | 'employee';
  connectedAt: string;
  lastActiveAt: string;
  deviceInfo?: {
    platform: string;
    version: string;
  };
}

interface WebSocketMessage {
  action: string;
  data: any;
  timestamp: string;
}

interface LocationUpdate {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
}

interface RideUpdate {
  rideId: string;
  status: string;
  driverLocation?: LocationUpdate;
  eta?: number;
}

interface ChatMessage {
  conversationId: string;
  senderId: string;
  message: string;
  messageType: 'text' | 'image' | 'location' | 'audio';
}

// Helper to create response
const response = (statusCode: number, body?: any): APIGatewayProxyResult => ({
  statusCode,
  body: body ? JSON.stringify(body) : '',
});

// Get API Gateway Management client
const getApiGatewayClient = (endpoint: string): ApiGatewayManagementApiClient => {
  return new ApiGatewayManagementApiClient({
    endpoint: endpoint.replace('wss://', 'https://'),
  });
};

// Send message to a specific connection
const sendToConnection = async (
  endpoint: string,
  connectionId: string,
  message: WebSocketMessage
): Promise<boolean> => {
  const client = getApiGatewayClient(endpoint);

  try {
    await client.send(
      new PostToConnectionCommand({
        ConnectionId: connectionId,
        Data: Buffer.from(JSON.stringify(message)),
      })
    );
    return true;
  } catch (error: any) {
    if (error.statusCode === 410) {
      // Connection is stale, remove it
      await removeConnection(connectionId);
    }
    console.error(`Failed to send to connection ${connectionId}:`, error);
    return false;
  }
};

// Send message to a user (all their connections)
const sendToUser = async (
  endpoint: string,
  userId: string,
  message: WebSocketMessage
): Promise<void> => {
  // Get all connections for the user
  const result = await docClient.send(
    new QueryCommand({
      TableName: CONNECTIONS_TABLE,
      IndexName: 'userId-index',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    })
  );

  if (result.Items && result.Items.length > 0) {
    await Promise.all(
      result.Items.map((item) =>
        sendToConnection(endpoint, item.connectionId, message)
      )
    );
  }
};

// Send message to multiple users
const sendToUsers = async (
  endpoint: string,
  userIds: string[],
  message: WebSocketMessage
): Promise<void> => {
  await Promise.all(userIds.map((userId) => sendToUser(endpoint, userId, message)));
};

// Store connection
const storeConnection = async (
  connectionId: string,
  userId: string,
  userType: string,
  deviceInfo?: any
): Promise<void> => {
  const now = new Date().toISOString();

  await docClient.send(
    new PutCommand({
      TableName: CONNECTIONS_TABLE,
      Item: {
        connectionId,
        userId,
        userType,
        deviceInfo,
        connectedAt: now,
        lastActiveAt: now,
        ttl: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hour TTL
      },
    })
  );
};

// Remove connection
const removeConnection = async (connectionId: string): Promise<void> => {
  await docClient.send(
    new DeleteCommand({
      TableName: CONNECTIONS_TABLE,
      Key: { connectionId },
    })
  );
};

// Get connection
const getConnection = async (connectionId: string): Promise<WebSocketConnection | null> => {
  const result = await docClient.send(
    new GetCommand({
      TableName: CONNECTIONS_TABLE,
      Key: { connectionId },
    })
  );

  return (result.Item as WebSocketConnection) || null;
};

// Update last active timestamp
const updateLastActive = async (connectionId: string): Promise<void> => {
  await docClient.send(
    new UpdateCommand({
      TableName: CONNECTIONS_TABLE,
      Key: { connectionId },
      UpdateExpression: 'SET lastActiveAt = :now',
      ExpressionAttributeValues: {
        ':now': new Date().toISOString(),
      },
    })
  );
};

// =====================================================
// ROUTE HANDLERS
// =====================================================

/**
 * Handle new WebSocket connection
 */
const handleConnect = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const connectionId = event.requestContext.connectionId!;
  const { userId, userType, devicePlatform, deviceVersion } = event.queryStringParameters || {};

  console.log(`New connection: ${connectionId} for user: ${userId}`);

  if (!userId || !userType) {
    return response(400, { error: 'userId and userType are required' });
  }

  try {
    await storeConnection(connectionId, userId, userType, {
      platform: devicePlatform,
      version: deviceVersion,
    });

    // Update user's online status if driver
    if (userType === 'driver') {
      await docClient.send(
        new UpdateCommand({
          TableName: USERS_TABLE,
          Key: { userId },
          UpdateExpression: 'SET isOnline = :online, lastSeenAt = :now',
          ExpressionAttributeValues: {
            ':online': true,
            ':now': new Date().toISOString(),
          },
        })
      );
    }

    return response(200, { message: 'Connected' });
  } catch (error) {
    console.error('Connect error:', error);
    return response(500, { error: 'Failed to connect' });
  }
};

/**
 * Handle WebSocket disconnection
 */
const handleDisconnect = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const connectionId = event.requestContext.connectionId!;

  console.log(`Disconnection: ${connectionId}`);

  try {
    // Get connection info before removing
    const connection = await getConnection(connectionId);

    if (connection) {
      // Update user's online status if driver
      if (connection.userType === 'driver') {
        // Check if user has other active connections
        const result = await docClient.send(
          new QueryCommand({
            TableName: CONNECTIONS_TABLE,
            IndexName: 'userId-index',
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
              ':userId': connection.userId,
            },
          })
        );

        // If this is the only connection, mark as offline
        if (!result.Items || result.Items.length <= 1) {
          await docClient.send(
            new UpdateCommand({
              TableName: USERS_TABLE,
              Key: { userId: connection.userId },
              UpdateExpression: 'SET isOnline = :online, lastSeenAt = :now',
              ExpressionAttributeValues: {
                ':online': false,
                ':now': new Date().toISOString(),
              },
            })
          );
        }
      }
    }

    await removeConnection(connectionId);

    return response(200, { message: 'Disconnected' });
  } catch (error) {
    console.error('Disconnect error:', error);
    return response(500, { error: 'Failed to disconnect' });
  }
};

/**
 * Handle location update from driver
 */
const handleUpdateLocation = async (
  event: APIGatewayProxyEvent,
  body: any
): Promise<APIGatewayProxyResult> => {
  const connectionId = event.requestContext.connectionId!;
  const { latitude, longitude, heading, speed, accuracy, rideId } = body;

  if (!latitude || !longitude) {
    return response(400, { error: 'latitude and longitude are required' });
  }

  try {
    const connection = await getConnection(connectionId);

    if (!connection) {
      return response(401, { error: 'Connection not found' });
    }

    const userId = connection.userId;
    const now = new Date().toISOString();

    const locationData: LocationUpdate = {
      latitude,
      longitude,
      heading,
      speed,
      accuracy,
    };

    // Update driver's location in database
    await docClient.send(
      new UpdateCommand({
        TableName: USERS_TABLE,
        Key: { userId },
        UpdateExpression: 'SET currentLocation = :location, lastLocationUpdate = :now',
        ExpressionAttributeValues: {
          ':location': locationData,
          ':now': now,
        },
      })
    );

    // If there's an active ride, notify the client
    if (rideId) {
      const rideResult = await docClient.send(
        new GetCommand({
          TableName: RIDES_TABLE,
          Key: { rideId },
        })
      );

      if (rideResult.Item) {
        const ride = rideResult.Item;

        // Send location update to client
        const endpoint = `https://${event.requestContext.domainName}/${event.requestContext.stage}`;
        await sendToUser(endpoint, ride.clientId, {
          action: 'driverLocation',
          data: {
            rideId,
            driverId: userId,
            location: locationData,
          },
          timestamp: now,
        });
      }
    }

    await updateLastActive(connectionId);

    return response(200, { message: 'Location updated' });
  } catch (error) {
    console.error('Update location error:', error);
    return response(500, { error: 'Failed to update location' });
  }
};

/**
 * Handle ride status update
 */
const handleRideUpdate = async (
  event: APIGatewayProxyEvent,
  body: any
): Promise<APIGatewayProxyResult> => {
  const connectionId = event.requestContext.connectionId!;
  const { rideId, status, eta, message: statusMessage } = body;

  if (!rideId || !status) {
    return response(400, { error: 'rideId and status are required' });
  }

  try {
    const connection = await getConnection(connectionId);

    if (!connection) {
      return response(401, { error: 'Connection not found' });
    }

    // Get ride info
    const rideResult = await docClient.send(
      new GetCommand({
        TableName: RIDES_TABLE,
        Key: { rideId },
      })
    );

    if (!rideResult.Item) {
      return response(404, { error: 'Ride not found' });
    }

    const ride = rideResult.Item;
    const now = new Date().toISOString();

    // Update ride status
    await docClient.send(
      new UpdateCommand({
        TableName: RIDES_TABLE,
        Key: { rideId },
        UpdateExpression: 'SET #status = :status, updatedAt = :now',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':status': status,
          ':now': now,
        },
      })
    );

    const endpoint = `https://${event.requestContext.domainName}/${event.requestContext.stage}`;

    // Notify both client and driver
    const updateMessage: WebSocketMessage = {
      action: 'rideUpdate',
      data: {
        rideId,
        status,
        eta,
        message: statusMessage,
      },
      timestamp: now,
    };

    await sendToUsers(endpoint, [ride.clientId, ride.driverId].filter(Boolean), updateMessage);

    await updateLastActive(connectionId);

    return response(200, { message: 'Ride status updated' });
  } catch (error) {
    console.error('Ride update error:', error);
    return response(500, { error: 'Failed to update ride status' });
  }
};

/**
 * Handle chat message
 */
const handleSendMessage = async (
  event: APIGatewayProxyEvent,
  body: any
): Promise<APIGatewayProxyResult> => {
  const connectionId = event.requestContext.connectionId!;
  const { conversationId, recipientId, message, messageType = 'text' } = body;

  if (!recipientId || !message) {
    return response(400, { error: 'recipientId and message are required' });
  }

  try {
    const connection = await getConnection(connectionId);

    if (!connection) {
      return response(401, { error: 'Connection not found' });
    }

    const senderId = connection.userId;
    const now = new Date().toISOString();
    const messageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Determine or create conversation ID
    const actualConversationId =
      conversationId || [senderId, recipientId].sort().join('#');

    // Store message
    await docClient.send(
      new PutCommand({
        TableName: CHATS_TABLE,
        Item: {
          conversationId: actualConversationId,
          messageId,
          senderId,
          recipientId,
          message,
          messageType,
          status: 'sent',
          createdAt: now,
        },
      })
    );

    const endpoint = `https://${event.requestContext.domainName}/${event.requestContext.stage}`;

    // Send to recipient
    const chatMessage: WebSocketMessage = {
      action: 'newMessage',
      data: {
        conversationId: actualConversationId,
        messageId,
        senderId,
        message,
        messageType,
        createdAt: now,
      },
      timestamp: now,
    };

    await sendToUser(endpoint, recipientId, chatMessage);

    // Send confirmation to sender
    await sendToConnection(endpoint, connectionId, {
      action: 'messageSent',
      data: {
        conversationId: actualConversationId,
        messageId,
        status: 'sent',
      },
      timestamp: now,
    });

    await updateLastActive(connectionId);

    return response(200, { message: 'Message sent', messageId });
  } catch (error) {
    console.error('Send message error:', error);
    return response(500, { error: 'Failed to send message' });
  }
};

/**
 * Handle driver status change (online/offline/busy)
 */
const handleDriverStatus = async (
  event: APIGatewayProxyEvent,
  body: any
): Promise<APIGatewayProxyResult> => {
  const connectionId = event.requestContext.connectionId!;
  const { status } = body;

  if (!status || !['online', 'offline', 'busy'].includes(status)) {
    return response(400, { error: 'Valid status is required (online/offline/busy)' });
  }

  try {
    const connection = await getConnection(connectionId);

    if (!connection) {
      return response(401, { error: 'Connection not found' });
    }

    if (connection.userType !== 'driver') {
      return response(403, { error: 'Only drivers can update driver status' });
    }

    const userId = connection.userId;
    const now = new Date().toISOString();

    await docClient.send(
      new UpdateCommand({
        TableName: USERS_TABLE,
        Key: { userId },
        UpdateExpression: 'SET driverStatus = :status, updatedAt = :now',
        ExpressionAttributeValues: {
          ':status': status,
          ':now': now,
        },
      })
    );

    await updateLastActive(connectionId);

    return response(200, { message: `Status updated to ${status}` });
  } catch (error) {
    console.error('Driver status error:', error);
    return response(500, { error: 'Failed to update driver status' });
  }
};

/**
 * Handle default/unknown routes
 */
const handleDefault = async (
  event: APIGatewayProxyEvent,
  body: any
): Promise<APIGatewayProxyResult> => {
  const connectionId = event.requestContext.connectionId!;

  console.log(`Default route for connection ${connectionId}:`, body);

  await updateLastActive(connectionId);

  const endpoint = `https://${event.requestContext.domainName}/${event.requestContext.stage}`;

  // Echo back for debugging
  await sendToConnection(endpoint, connectionId, {
    action: 'echo',
    data: body,
    timestamp: new Date().toISOString(),
  });

  return response(200, { message: 'Message received' });
};

/**
 * Handle ping (keep-alive)
 */
const handlePing = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const connectionId = event.requestContext.connectionId!;

  await updateLastActive(connectionId);

  const endpoint = `https://${event.requestContext.domainName}/${event.requestContext.stage}`;

  await sendToConnection(endpoint, connectionId, {
    action: 'pong',
    data: {},
    timestamp: new Date().toISOString(),
  });

  return response(200, { message: 'pong' });
};

// =====================================================
// MAIN HANDLER
// =====================================================

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('WebSocket event:', JSON.stringify(event, null, 2));

  const routeKey = event.requestContext.routeKey;
  const connectionId = event.requestContext.connectionId;

  console.log(`Route: ${routeKey}, Connection: ${connectionId}`);

  try {
    // Handle connection lifecycle
    if (routeKey === '$connect') {
      return handleConnect(event);
    }

    if (routeKey === '$disconnect') {
      return handleDisconnect(event);
    }

    // Parse message body
    let body: any = {};
    if (event.body) {
      try {
        body = JSON.parse(event.body);
      } catch {
        return response(400, { error: 'Invalid JSON body' });
      }
    }

    // Handle specific actions
    switch (routeKey) {
      case 'updateLocation':
        return handleUpdateLocation(event, body);

      case 'rideUpdate':
        return handleRideUpdate(event, body);

      case 'sendMessage':
        return handleSendMessage(event, body);

      case 'driverStatus':
        return handleDriverStatus(event, body);

      case 'ping':
        return handlePing(event);

      case '$default':
      default:
        return handleDefault(event, body);
    }
  } catch (error) {
    console.error('WebSocket handler error:', error);
    return response(500, {
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// =====================================================
// UTILITY EXPORTS (for use by other Lambdas)
// =====================================================

export {
  sendToUser,
  sendToUsers,
  sendToConnection,
  WebSocketMessage,
  LocationUpdate,
  RideUpdate,
  ChatMessage,
};
