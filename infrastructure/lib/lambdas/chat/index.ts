/**
 * Jeeny Chat Lambda Handler
 *
 * Handles chat-related operations including:
 * - Conversations management
 * - Message sending/receiving
 * - Message history
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
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

// Initialize clients
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Environment variables
const CHATS_TABLE = process.env.CHATS_TABLE || 'jeeny-chats';
const USERS_TABLE = process.env.USERS_TABLE || 'jeeny-users';

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

// Extract user ID from JWT
const getUserIdFromEvent = (event: APIGatewayProxyEvent): string | null => {
  try {
    const claims = event.requestContext.authorizer?.claims;
    return claims?.sub || claims?.['cognito:username'] || null;
  } catch {
    return null;
  }
};

/**
 * Get conversations list
 */
const getConversations = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return response(401, { error: 'Unauthorized' });
    }

    const result = await docClient.send(new QueryCommand({
      TableName: CHATS_TABLE,
      IndexName: 'userId-index',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
      ScanIndexForward: false,
    }));

    return response(200, {
      success: true,
      data: result.Items || [],
    });
  } catch (error) {
    console.error('Error getting conversations:', error);
    return response(500, { error: 'Failed to get conversations' });
  }
};

/**
 * Create a new conversation
 */
const createConversation = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return response(401, { error: 'Unauthorized' });
    }

    const body = JSON.parse(event.body || '{}');
    const { participantId, rideId, type = 'ride' } = body;

    if (!participantId) {
      return response(400, { error: 'participantId is required' });
    }

    const conversationId = [userId, participantId].sort().join('#');
    const now = new Date().toISOString();

    await docClient.send(new PutCommand({
      TableName: CHATS_TABLE,
      Item: {
        conversationId,
        participants: [userId, participantId],
        type,
        rideId,
        lastMessage: null,
        lastMessageAt: now,
        createdAt: now,
        updatedAt: now,
      },
    }));

    return response(201, {
      success: true,
      data: { conversationId },
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return response(500, { error: 'Failed to create conversation' });
  }
};

/**
 * Get conversation by ID
 */
const getConversation = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return response(401, { error: 'Unauthorized' });
    }

    const conversationId = event.pathParameters?.conversationId;
    if (!conversationId) {
      return response(400, { error: 'conversationId is required' });
    }

    const result = await docClient.send(new GetCommand({
      TableName: CHATS_TABLE,
      Key: { conversationId },
    }));

    if (!result.Item) {
      return response(404, { error: 'Conversation not found' });
    }

    return response(200, {
      success: true,
      data: result.Item,
    });
  } catch (error) {
    console.error('Error getting conversation:', error);
    return response(500, { error: 'Failed to get conversation' });
  }
};

/**
 * Get messages for a conversation
 */
const getMessages = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return response(401, { error: 'Unauthorized' });
    }

    const conversationId = event.pathParameters?.conversationId;
    if (!conversationId) {
      return response(400, { error: 'conversationId is required' });
    }

    const { limit = '50', lastKey } = event.queryStringParameters || {};

    const params: any = {
      TableName: CHATS_TABLE,
      KeyConditionExpression: 'conversationId = :conversationId',
      ExpressionAttributeValues: {
        ':conversationId': conversationId,
      },
      ScanIndexForward: false,
      Limit: parseInt(limit),
    };

    if (lastKey) {
      params.ExclusiveStartKey = JSON.parse(Buffer.from(lastKey, 'base64').toString());
    }

    const result = await docClient.send(new QueryCommand(params));

    return response(200, {
      success: true,
      data: {
        messages: result.Items || [],
        lastKey: result.LastEvaluatedKey
          ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
          : null,
      },
    });
  } catch (error) {
    console.error('Error getting messages:', error);
    return response(500, { error: 'Failed to get messages' });
  }
};

/**
 * Send a message
 */
const sendMessage = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return response(401, { error: 'Unauthorized' });
    }

    const conversationId = event.pathParameters?.conversationId;
    if (!conversationId) {
      return response(400, { error: 'conversationId is required' });
    }

    const body = JSON.parse(event.body || '{}');
    const { message, messageType = 'text' } = body;

    if (!message) {
      return response(400, { error: 'message is required' });
    }

    const messageId = uuidv4();
    const now = new Date().toISOString();

    await docClient.send(new PutCommand({
      TableName: CHATS_TABLE,
      Item: {
        conversationId,
        messageId,
        senderId: userId,
        message,
        messageType,
        status: 'sent',
        createdAt: now,
      },
    }));

    // Update conversation's last message
    await docClient.send(new UpdateCommand({
      TableName: CHATS_TABLE,
      Key: { conversationId },
      UpdateExpression: 'SET lastMessage = :message, lastMessageAt = :now, updatedAt = :now',
      ExpressionAttributeValues: {
        ':message': message,
        ':now': now,
      },
    }));

    return response(201, {
      success: true,
      data: {
        messageId,
        conversationId,
        message,
        messageType,
        createdAt: now,
      },
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return response(500, { error: 'Failed to send message' });
  }
};

/**
 * Main handler
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('Chat Lambda:', JSON.stringify(event, null, 2));

  const { httpMethod, path, resource } = event;

  try {
    // GET /chat/conversations
    if (path.match(/\/chat\/conversations\/?$/) || resource === '/chat/conversations') {
      if (httpMethod === 'GET') return getConversations(event);
      if (httpMethod === 'POST') return createConversation(event);
    }

    // GET /chat/conversations/{conversationId}
    if (path.match(/\/chat\/conversations\/[^/]+\/?$/) || resource === '/chat/conversations/{conversationId}') {
      if (httpMethod === 'GET') return getConversation(event);
    }

    // GET/POST /chat/conversations/{conversationId}/messages
    if (path.match(/\/chat\/conversations\/[^/]+\/messages\/?$/) || resource === '/chat/conversations/{conversationId}/messages') {
      if (httpMethod === 'GET') return getMessages(event);
      if (httpMethod === 'POST') return sendMessage(event);
    }

    // Base /chat endpoint
    if (path.match(/\/chat\/?$/) || resource === '/chat') {
      if (httpMethod === 'GET') return getConversations(event);
    }

    return response(404, { error: 'Not found' });
  } catch (error) {
    console.error('Unhandled error:', error);
    return response(500, { error: 'Internal server error' });
  }
};
