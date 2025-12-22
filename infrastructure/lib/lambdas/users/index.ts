/**
 * Jeeny Users Lambda Handler
 *
 * Handles user CRUD operations for the Jeeny taxi platform.
 *
 * Endpoints:
 * - GET /users - List users
 * - POST /users - Create user
 * - GET /users/{userId} - Get user by ID
 * - PUT /users/{userId} - Update user
 * - DELETE /users/{userId} - Delete user
 * - GET /users/{userId}/profile - Get user profile
 * - PUT /users/{userId}/profile - Update user profile
 * - GET /users/{userId}/wallet - Get user wallet
 * - GET /users/{userId}/saved-places - Get saved places
 * - POST /users/{userId}/saved-places - Add saved place
 * - GET /users/{userId}/ride-history - Get ride history
 * - GET /me - Get current user
 * - PUT /me - Update current user
 */

import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import {
  CognitoIdentityProviderClient,
  AdminGetUserCommand,
  AdminUpdateUserAttributesCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';

// Initialize clients
const dynamoDb = new DynamoDBClient({ region: process.env.AWS_REGION_NAME || 'eu-north-1' });
const cognito = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION_NAME || 'eu-north-1' });

// Environment variables
const USERS_TABLE = process.env.USERS_TABLE || 'jeeny-users';
const RIDES_TABLE = process.env.RIDES_TABLE || 'jeeny-rides';
const LOCATIONS_TABLE = process.env.LOCATIONS_TABLE || 'jeeny-locations';
const USER_POOL_ID = process.env.USER_POOL_ID || '';

// Types
interface User {
  userId: string;
  phoneNumber: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  gender?: string;
  birthdate?: string;
  role: 'client' | 'driver' | 'employee' | 'admin';
  status: 'active' | 'suspended' | 'pending' | 'deleted';
  preferredLanguage: string;
  cityId?: string;
  referralCode: string;
  referredBy?: string;
  walletBalance: number;
  rating?: number;
  totalRides?: number;
  createdAt: string;
  updatedAt: string;
}

interface SavedPlace {
  placeId: string;
  userId: string;
  name: string;
  label: 'home' | 'work' | 'other';
  address: string;
  latitude: number;
  longitude: number;
  createdAt: string;
}

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

// Helper functions
const response = (statusCode: number, body: ApiResponse): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  },
  body: JSON.stringify(body),
});

const getUserIdFromToken = (event: APIGatewayProxyEvent): string | null => {
  const claims = event.requestContext.authorizer?.claims;
  return claims?.sub || claims?.['cognito:username'] || null;
};

const generateReferralCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'JNY';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Handler functions

/**
 * List all users (admin only)
 */
const listUsers = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { role, status, page = '1', limit = '20' } = event.queryStringParameters || {};
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    let filterExpression = '';
    const expressionAttributeValues: Record<string, any> = {};
    const expressionAttributeNames: Record<string, string> = {};

    if (role) {
      filterExpression += '#role = :role';
      expressionAttributeValues[':role'] = { S: role };
      expressionAttributeNames['#role'] = 'role';
    }

    if (status) {
      if (filterExpression) filterExpression += ' AND ';
      filterExpression += '#status = :status';
      expressionAttributeValues[':status'] = { S: status };
      expressionAttributeNames['#status'] = 'status';
    }

    const params: any = {
      TableName: USERS_TABLE,
      Limit: limitNum,
    };

    if (filterExpression) {
      params.FilterExpression = filterExpression;
      params.ExpressionAttributeValues = expressionAttributeValues;
      params.ExpressionAttributeNames = expressionAttributeNames;
    }

    const result = await dynamoDb.send(new ScanCommand(params));

    const users = result.Items?.map((item) => unmarshall(item)) || [];

    return response(200, {
      success: true,
      data: users,
      pagination: {
        total: result.Count || 0,
        page: pageNum,
        limit: limitNum,
        hasMore: !!result.LastEvaluatedKey,
      },
    });
  } catch (error) {
    console.error('Error listing users:', error);
    return response(500, {
      success: false,
      error: 'Failed to list users',
    });
  }
};

/**
 * Create a new user
 */
const createUser = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { phoneNumber, email, firstName, lastName, role = 'client', preferredLanguage = 'ar' } = body;

    if (!phoneNumber) {
      return response(400, {
        success: false,
        error: 'Phone number is required',
      });
    }

    const now = new Date().toISOString();
    const userId = uuidv4();

    const user: User = {
      userId,
      phoneNumber,
      email,
      firstName,
      lastName,
      role,
      status: 'active',
      preferredLanguage,
      referralCode: generateReferralCode(),
      walletBalance: 0,
      totalRides: 0,
      createdAt: now,
      updatedAt: now,
    };

    await dynamoDb.send(
      new PutItemCommand({
        TableName: USERS_TABLE,
        Item: marshall(user, { removeUndefinedValues: true }),
        ConditionExpression: 'attribute_not_exists(userId)',
      })
    );

    return response(201, {
      success: true,
      data: user,
      message: 'User created successfully',
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    if (error.name === 'ConditionalCheckFailedException') {
      return response(409, {
        success: false,
        error: 'User already exists',
      });
    }
    return response(500, {
      success: false,
      error: 'Failed to create user',
    });
  }
};

/**
 * Get user by ID
 */
const getUserById = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.pathParameters?.userId;

    if (!userId) {
      return response(400, {
        success: false,
        error: 'User ID is required',
      });
    }

    const result = await dynamoDb.send(
      new GetItemCommand({
        TableName: USERS_TABLE,
        Key: marshall({ userId }),
      })
    );

    if (!result.Item) {
      return response(404, {
        success: false,
        error: 'User not found',
      });
    }

    const user = unmarshall(result.Item);

    // Remove sensitive fields
    delete user.referredBy;

    return response(200, {
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error getting user:', error);
    return response(500, {
      success: false,
      error: 'Failed to get user',
    });
  }
};

/**
 * Update user
 */
const updateUser = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.pathParameters?.userId;
    const body = JSON.parse(event.body || '{}');

    if (!userId) {
      return response(400, {
        success: false,
        error: 'User ID is required',
      });
    }

    const allowedFields = [
      'email',
      'firstName',
      'lastName',
      'profilePicture',
      'gender',
      'birthdate',
      'preferredLanguage',
      'cityId',
    ];

    const updateExpressions: string[] = ['#updatedAt = :updatedAt'];
    const expressionAttributeNames: Record<string, string> = { '#updatedAt': 'updatedAt' };
    const expressionAttributeValues: Record<string, any> = {
      ':updatedAt': { S: new Date().toISOString() },
    };

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateExpressions.push(`#${field} = :${field}`);
        expressionAttributeNames[`#${field}`] = field;
        expressionAttributeValues[`:${field}`] = marshall({ value: body[field] }).value;
      }
    }

    const result = await dynamoDb.send(
      new UpdateItemCommand({
        TableName: USERS_TABLE,
        Key: marshall({ userId }),
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW',
        ConditionExpression: 'attribute_exists(userId)',
      })
    );

    const updatedUser = result.Attributes ? unmarshall(result.Attributes) : null;

    return response(200, {
      success: true,
      data: updatedUser,
      message: 'User updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    if (error.name === 'ConditionalCheckFailedException') {
      return response(404, {
        success: false,
        error: 'User not found',
      });
    }
    return response(500, {
      success: false,
      error: 'Failed to update user',
    });
  }
};

/**
 * Delete user
 */
const deleteUser = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.pathParameters?.userId;

    if (!userId) {
      return response(400, {
        success: false,
        error: 'User ID is required',
      });
    }

    // Soft delete - update status to deleted
    await dynamoDb.send(
      new UpdateItemCommand({
        TableName: USERS_TABLE,
        Key: marshall({ userId }),
        UpdateExpression: 'SET #status = :status, #updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#status': 'status',
          '#updatedAt': 'updatedAt',
        },
        ExpressionAttributeValues: {
          ':status': { S: 'deleted' },
          ':updatedAt': { S: new Date().toISOString() },
        },
        ConditionExpression: 'attribute_exists(userId)',
      })
    );

    return response(200, {
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    if (error.name === 'ConditionalCheckFailedException') {
      return response(404, {
        success: false,
        error: 'User not found',
      });
    }
    return response(500, {
      success: false,
      error: 'Failed to delete user',
    });
  }
};

/**
 * Get current user (from token)
 */
const getCurrentUser = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromToken(event);

    if (!userId) {
      return response(401, {
        success: false,
        error: 'Unauthorized',
      });
    }

    const result = await dynamoDb.send(
      new GetItemCommand({
        TableName: USERS_TABLE,
        Key: marshall({ userId }),
      })
    );

    if (!result.Item) {
      return response(404, {
        success: false,
        error: 'User not found',
      });
    }

    const user = unmarshall(result.Item);

    return response(200, {
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    return response(500, {
      success: false,
      error: 'Failed to get user',
    });
  }
};

/**
 * Update current user
 */
const updateCurrentUser = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const userId = getUserIdFromToken(event);

  if (!userId) {
    return response(401, {
      success: false,
      error: 'Unauthorized',
    });
  }

  // Reuse updateUser logic with current user's ID
  event.pathParameters = { ...event.pathParameters, userId };
  return updateUser(event);
};

/**
 * Get user profile
 */
const getUserProfile = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return getUserById(event);
};

/**
 * Update user profile
 */
const updateUserProfile = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return updateUser(event);
};

/**
 * Get user wallet
 */
const getUserWallet = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.pathParameters?.userId;

    if (!userId) {
      return response(400, {
        success: false,
        error: 'User ID is required',
      });
    }

    const result = await dynamoDb.send(
      new GetItemCommand({
        TableName: USERS_TABLE,
        Key: marshall({ userId }),
        ProjectionExpression: 'userId, walletBalance',
      })
    );

    if (!result.Item) {
      return response(404, {
        success: false,
        error: 'User not found',
      });
    }

    const user = unmarshall(result.Item);

    return response(200, {
      success: true,
      data: {
        userId: user.userId,
        balance: user.walletBalance || 0,
        currency: 'MRU',
      },
    });
  } catch (error) {
    console.error('Error getting wallet:', error);
    return response(500, {
      success: false,
      error: 'Failed to get wallet',
    });
  }
};

/**
 * Get saved places
 */
const getSavedPlaces = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.pathParameters?.userId;

    if (!userId) {
      return response(400, {
        success: false,
        error: 'User ID is required',
      });
    }

    const result = await dynamoDb.send(
      new QueryCommand({
        TableName: LOCATIONS_TABLE,
        IndexName: 'userId-index',
        KeyConditionExpression: 'userId = :userId',
        FilterExpression: 'locationType = :type',
        ExpressionAttributeValues: {
          ':userId': { S: userId },
          ':type': { S: 'saved_place' },
        },
      })
    );

    const places = result.Items?.map((item) => unmarshall(item)) || [];

    return response(200, {
      success: true,
      data: places,
    });
  } catch (error) {
    console.error('Error getting saved places:', error);
    return response(500, {
      success: false,
      error: 'Failed to get saved places',
    });
  }
};

/**
 * Add saved place
 */
const addSavedPlace = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.pathParameters?.userId;
    const body = JSON.parse(event.body || '{}');

    if (!userId) {
      return response(400, {
        success: false,
        error: 'User ID is required',
      });
    }

    const { name, label, address, latitude, longitude } = body;

    if (!name || !address || latitude === undefined || longitude === undefined) {
      return response(400, {
        success: false,
        error: 'Name, address, latitude, and longitude are required',
      });
    }

    const placeId = uuidv4();
    const now = new Date().toISOString();

    const place: SavedPlace = {
      placeId,
      userId,
      name,
      label: label || 'other',
      address,
      latitude,
      longitude,
      createdAt: now,
    };

    await dynamoDb.send(
      new PutItemCommand({
        TableName: LOCATIONS_TABLE,
        Item: marshall(
          {
            ...place,
            locationType: 'saved_place',
          },
          { removeUndefinedValues: true }
        ),
      })
    );

    return response(201, {
      success: true,
      data: place,
      message: 'Place saved successfully',
    });
  } catch (error) {
    console.error('Error adding saved place:', error);
    return response(500, {
      success: false,
      error: 'Failed to save place',
    });
  }
};

/**
 * Get ride history
 */
const getRideHistory = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.pathParameters?.userId;
    const { page = '1', limit = '20', status } = event.queryStringParameters || {};

    if (!userId) {
      return response(400, {
        success: false,
        error: 'User ID is required',
      });
    }

    const params: any = {
      TableName: RIDES_TABLE,
      IndexName: 'clientId-index',
      KeyConditionExpression: 'clientId = :clientId',
      ExpressionAttributeValues: {
        ':clientId': { S: userId },
      },
      ScanIndexForward: false, // Most recent first
      Limit: parseInt(limit),
    };

    if (status) {
      params.FilterExpression = '#status = :status';
      params.ExpressionAttributeNames = { '#status': 'status' };
      params.ExpressionAttributeValues[':status'] = { S: status };
    }

    const result = await dynamoDb.send(new QueryCommand(params));

    const rides = result.Items?.map((item) => unmarshall(item)) || [];

    return response(200, {
      success: true,
      data: rides,
      pagination: {
        total: result.Count || 0,
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: !!result.LastEvaluatedKey,
      },
    });
  } catch (error) {
    console.error('Error getting ride history:', error);
    return response(500, {
      success: false,
      error: 'Failed to get ride history',
    });
  }
};

/**
 * Main handler
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event, null, 2));

  const { httpMethod, path, resource } = event;

  try {
    // Route handling
    if (path === '/me' || resource === '/me') {
      if (httpMethod === 'GET') return getCurrentUser(event);
      if (httpMethod === 'PUT') return updateCurrentUser(event);
    }

    if (path.match(/^\/users\/?$/) || resource === '/users') {
      if (httpMethod === 'GET') return listUsers(event);
      if (httpMethod === 'POST') return createUser(event);
    }

    if (path.match(/^\/users\/[^/]+\/?$/) || resource === '/users/{userId}') {
      if (httpMethod === 'GET') return getUserById(event);
      if (httpMethod === 'PUT') return updateUser(event);
      if (httpMethod === 'DELETE') return deleteUser(event);
    }

    if (path.match(/^\/users\/[^/]+\/profile\/?$/) || resource === '/users/{userId}/profile') {
      if (httpMethod === 'GET') return getUserProfile(event);
      if (httpMethod === 'PUT') return updateUserProfile(event);
    }

    if (path.match(/^\/users\/[^/]+\/wallet\/?$/) || resource === '/users/{userId}/wallet') {
      if (httpMethod === 'GET') return getUserWallet(event);
    }

    if (path.match(/^\/users\/[^/]+\/saved-places\/?$/) || resource === '/users/{userId}/saved-places') {
      if (httpMethod === 'GET') return getSavedPlaces(event);
      if (httpMethod === 'POST') return addSavedPlace(event);
    }

    if (path.match(/^\/users\/[^/]+\/ride-history\/?$/) || resource === '/users/{userId}/ride-history') {
      if (httpMethod === 'GET') return getRideHistory(event);
    }

    return response(404, {
      success: false,
      error: 'Not found',
    });
  } catch (error) {
    console.error('Unhandled error:', error);
    return response(500, {
      success: false,
      error: 'Internal server error',
    });
  }
};
