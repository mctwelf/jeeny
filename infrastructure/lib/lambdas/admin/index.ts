/**
 * Jeeny Admin Lambda Handler
 *
 * Handles admin dashboard operations including:
 * - Dashboard statistics
 * - User management
 * - Driver management and verification
 * - Ride management
 * - Settings and configuration
 * - Promotions management
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
  ScanCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';

// Initialize clients
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Environment variables
const USERS_TABLE = process.env.USERS_TABLE || 'jeeny-users';
const RIDES_TABLE = process.env.RIDES_TABLE || 'jeeny-rides';
const TRANSACTIONS_TABLE = process.env.TRANSACTIONS_TABLE || 'jeeny-transactions';
const SETTINGS_TABLE = process.env.SETTINGS_TABLE || 'jeeny-settings';
const PROMOTIONS_TABLE = process.env.PROMOTIONS_TABLE || 'jeeny-promotions';
const SUPPORT_TICKETS_TABLE = process.env.SUPPORT_TICKETS_TABLE || 'jeeny-support-tickets';

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

/**
 * Get dashboard statistics
 */
const getDashboard = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // TODO: Implement actual dashboard stats from database
    const stats = {
      users: {
        total: 0,
        clients: 0,
        drivers: 0,
        employees: 0,
        newToday: 0,
        newThisWeek: 0,
      },
      rides: {
        total: 0,
        completed: 0,
        cancelled: 0,
        active: 0,
        todayCompleted: 0,
        todayRevenue: 0,
      },
      revenue: {
        total: 0,
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
      },
      drivers: {
        online: 0,
        offline: 0,
        busy: 0,
        pendingVerification: 0,
      },
    };

    return response(200, {
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return response(500, { error: 'Failed to get dashboard stats' });
  }
};

/**
 * Get admin statistics
 */
const getStats = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return getDashboard(event);
};

/**
 * List all users with filters
 */
const getUsers = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { role, status, limit = '20', lastKey } = event.queryStringParameters || {};

    const params: any = {
      TableName: USERS_TABLE,
      Limit: parseInt(limit),
    };

    if (lastKey) {
      params.ExclusiveStartKey = JSON.parse(Buffer.from(lastKey, 'base64').toString());
    }

    const result = await docClient.send(new ScanCommand(params));

    return response(200, {
      success: true,
      data: {
        users: result.Items || [],
        lastKey: result.LastEvaluatedKey
          ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
          : null,
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    return response(500, { error: 'Failed to get users' });
  }
};

/**
 * Get user by ID
 */
const getUserById = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.pathParameters?.userId;
    if (!userId) {
      return response(400, { error: 'User ID required' });
    }

    const result = await docClient.send(new GetCommand({
      TableName: USERS_TABLE,
      Key: { userId },
    }));

    if (!result.Item) {
      return response(404, { error: 'User not found' });
    }

    return response(200, {
      success: true,
      data: result.Item,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return response(500, { error: 'Failed to get user' });
  }
};

/**
 * Suspend user
 */
const suspendUser = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.pathParameters?.userId;
    if (!userId) {
      return response(400, { error: 'User ID required' });
    }

    await docClient.send(new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { userId },
      UpdateExpression: 'SET #status = :status, updatedAt = :now',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': 'suspended',
        ':now': new Date().toISOString(),
      },
    }));

    return response(200, {
      success: true,
      message: 'User suspended successfully',
    });
  } catch (error) {
    console.error('Suspend user error:', error);
    return response(500, { error: 'Failed to suspend user' });
  }
};

/**
 * Activate user
 */
const activateUser = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.pathParameters?.userId;
    if (!userId) {
      return response(400, { error: 'User ID required' });
    }

    await docClient.send(new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { userId },
      UpdateExpression: 'SET #status = :status, updatedAt = :now',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': 'active',
        ':now': new Date().toISOString(),
      },
    }));

    return response(200, {
      success: true,
      message: 'User activated successfully',
    });
  } catch (error) {
    console.error('Activate user error:', error);
    return response(500, { error: 'Failed to activate user' });
  }
};

/**
 * Verify driver
 */
const verifyDriver = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const driverId = event.pathParameters?.driverId;
    if (!driverId) {
      return response(400, { error: 'Driver ID required' });
    }

    await docClient.send(new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { userId: driverId },
      UpdateExpression: 'SET verificationStatus = :status, #status = :active, updatedAt = :now',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': 'approved',
        ':active': 'active',
        ':now': new Date().toISOString(),
      },
    }));

    return response(200, {
      success: true,
      message: 'Driver verified successfully',
    });
  } catch (error) {
    console.error('Verify driver error:', error);
    return response(500, { error: 'Failed to verify driver' });
  }
};

/**
 * Reject driver
 */
const rejectDriver = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const driverId = event.pathParameters?.driverId;
    const body = JSON.parse(event.body || '{}');
    const { reason } = body;

    if (!driverId) {
      return response(400, { error: 'Driver ID required' });
    }

    await docClient.send(new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { userId: driverId },
      UpdateExpression: 'SET verificationStatus = :status, rejectionReason = :reason, updatedAt = :now',
      ExpressionAttributeValues: {
        ':status': 'rejected',
        ':reason': reason || 'Documents not approved',
        ':now': new Date().toISOString(),
      },
    }));

    return response(200, {
      success: true,
      message: 'Driver verification rejected',
    });
  } catch (error) {
    console.error('Reject driver error:', error);
    return response(500, { error: 'Failed to reject driver' });
  }
};

/**
 * Get settings
 */
const getSettings = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const result = await docClient.send(new GetCommand({
      TableName: SETTINGS_TABLE,
      Key: { settingId: 'global' },
    }));

    return response(200, {
      success: true,
      data: result.Item || {},
    });
  } catch (error) {
    console.error('Get settings error:', error);
    return response(500, { error: 'Failed to get settings' });
  }
};

/**
 * Update settings
 */
const updateSettings = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');

    await docClient.send(new PutCommand({
      TableName: SETTINGS_TABLE,
      Item: {
        settingId: 'global',
        ...body,
        updatedAt: new Date().toISOString(),
      },
    }));

    return response(200, {
      success: true,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    console.error('Update settings error:', error);
    return response(500, { error: 'Failed to update settings' });
  }
};

/**
 * Main handler
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('Admin Lambda:', JSON.stringify(event, null, 2));

  const { httpMethod, path, resource } = event;

  try {
    // Dashboard
    if (path.includes('/admin/dashboard')) {
      return getDashboard(event);
    }

    if (path.includes('/admin/stats')) {
      return getStats(event);
    }

    // Users
    if (path.match(/\/admin\/users\/[^/]+\/suspend/)) {
      return suspendUser(event);
    }

    if (path.match(/\/admin\/users\/[^/]+\/activate/)) {
      return activateUser(event);
    }

    if (path.match(/\/admin\/users\/[^/]+$/)) {
      if (httpMethod === 'GET') return getUserById(event);
    }

    if (path.match(/\/admin\/users\/?$/)) {
      if (httpMethod === 'GET') return getUsers(event);
    }

    // Drivers
    if (path.match(/\/admin\/drivers\/[^/]+\/verify/)) {
      return verifyDriver(event);
    }

    if (path.match(/\/admin\/drivers\/[^/]+\/reject/)) {
      return rejectDriver(event);
    }

    // Settings
    if (path.includes('/admin/settings')) {
      if (httpMethod === 'GET') return getSettings(event);
      if (httpMethod === 'PUT') return updateSettings(event);
    }

    return response(404, { error: 'Endpoint not found' });
  } catch (error) {
    console.error('Admin handler error:', error);
    return response(500, { error: 'Internal server error' });
  }
};
