/**
 * Jeeny Promotions Lambda Handler
 *
 * Handles all promotion-related operations including:
 * - Listing promotions
 * - Applying promo codes
 * - Validating promo codes
 * - Admin promotion management
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
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

// Initialize clients
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Environment variables
const PROMOTIONS_TABLE = process.env.PROMOTIONS_TABLE || 'jeeny-promotions';
const USERS_TABLE = process.env.USERS_TABLE || 'jeeny-users';

// Types
interface Promotion {
  promotionId: string;
  code: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  type: 'percentage' | 'fixed' | 'free_ride';
  value: number;
  maxDiscount?: number;
  minOrderAmount?: number;
  usageLimit?: number;
  usageCount: number;
  userUsageLimit?: number;
  validFrom: string;
  validUntil: string;
  status: 'active' | 'inactive' | 'expired';
  applicableVehicleTypes?: string[];
  applicableCities?: string[];
  isFirstRideOnly?: boolean;
  createdAt: string;
  updatedAt: string;
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
 * Get all active promotions
 */
const getPromotions = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const now = new Date().toISOString();

    const result = await docClient.send(new ScanCommand({
      TableName: PROMOTIONS_TABLE,
      FilterExpression: '#status = :active AND validFrom <= :now AND validUntil >= :now',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':active': 'active',
        ':now': now,
      },
    }));

    return response(200, {
      success: true,
      data: result.Items || [],
    });
  } catch (error) {
    console.error('Error getting promotions:', error);
    return response(500, { error: 'Failed to get promotions' });
  }
};

/**
 * Get promotion by ID
 */
const getPromotionById = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const promotionId = event.pathParameters?.promotionId;

    if (!promotionId) {
      return response(400, { error: 'Promotion ID is required' });
    }

    const result = await docClient.send(new GetCommand({
      TableName: PROMOTIONS_TABLE,
      Key: { promotionId },
    }));

    if (!result.Item) {
      return response(404, { error: 'Promotion not found' });
    }

    return response(200, {
      success: true,
      data: result.Item,
    });
  } catch (error) {
    console.error('Error getting promotion:', error);
    return response(500, { error: 'Failed to get promotion' });
  }
};

/**
 * Validate a promo code
 */
const validatePromoCode = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return response(401, { error: 'Unauthorized' });
    }

    const body = JSON.parse(event.body || '{}');
    const { code, orderAmount, vehicleType, cityId } = body;

    if (!code) {
      return response(400, { error: 'Promo code is required' });
    }

    // Find promotion by code
    const result = await docClient.send(new QueryCommand({
      TableName: PROMOTIONS_TABLE,
      IndexName: 'code-index',
      KeyConditionExpression: 'code = :code',
      ExpressionAttributeValues: {
        ':code': code.toUpperCase(),
      },
    }));

    if (!result.Items || result.Items.length === 0) {
      return response(404, {
        success: false,
        error: 'Invalid promo code',
        errorAr: 'رمز الترويج غير صالح',
      });
    }

    const promotion = result.Items[0] as Promotion;
    const now = new Date().toISOString();

    // Check if promotion is active
    if (promotion.status !== 'active') {
      return response(400, {
        success: false,
        error: 'This promotion is no longer active',
        errorAr: 'هذا العرض لم يعد نشطاً',
      });
    }

    // Check validity period
    if (now < promotion.validFrom || now > promotion.validUntil) {
      return response(400, {
        success: false,
        error: 'This promotion has expired',
        errorAr: 'انتهت صلاحية هذا العرض',
      });
    }

    // Check usage limit
    if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) {
      return response(400, {
        success: false,
        error: 'This promotion has reached its usage limit',
        errorAr: 'وصل هذا العرض إلى حد الاستخدام',
      });
    }

    // Check minimum order amount
    if (promotion.minOrderAmount && orderAmount && orderAmount < promotion.minOrderAmount) {
      return response(400, {
        success: false,
        error: `Minimum order amount is ${promotion.minOrderAmount} MRU`,
        errorAr: `الحد الأدنى للطلب هو ${promotion.minOrderAmount} أوقية`,
      });
    }

    // Check vehicle type applicability
    if (promotion.applicableVehicleTypes && promotion.applicableVehicleTypes.length > 0) {
      if (vehicleType && !promotion.applicableVehicleTypes.includes(vehicleType)) {
        return response(400, {
          success: false,
          error: 'This promotion is not valid for the selected vehicle type',
          errorAr: 'هذا العرض غير صالح لنوع السيارة المحدد',
        });
      }
    }

    // Calculate discount
    let discount = 0;
    if (promotion.type === 'percentage') {
      discount = orderAmount ? (orderAmount * promotion.value) / 100 : 0;
      if (promotion.maxDiscount && discount > promotion.maxDiscount) {
        discount = promotion.maxDiscount;
      }
    } else if (promotion.type === 'fixed') {
      discount = promotion.value;
    }

    return response(200, {
      success: true,
      data: {
        valid: true,
        promotionId: promotion.promotionId,
        code: promotion.code,
        name: promotion.name,
        nameAr: promotion.nameAr,
        type: promotion.type,
        value: promotion.value,
        discount: Math.round(discount),
        maxDiscount: promotion.maxDiscount,
      },
    });
  } catch (error) {
    console.error('Error validating promo code:', error);
    return response(500, { error: 'Failed to validate promo code' });
  }
};

/**
 * Apply a promo code to a ride
 */
const applyPromoCode = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return response(401, { error: 'Unauthorized' });
    }

    const body = JSON.parse(event.body || '{}');
    const { code, rideId, orderAmount } = body;

    if (!code || !rideId) {
      return response(400, { error: 'Promo code and ride ID are required' });
    }

    // Validate the promo code first
    const validationResult = await validatePromoCode({
      ...event,
      body: JSON.stringify({ code, orderAmount }),
    } as APIGatewayProxyEvent);

    const validationBody = JSON.parse(validationResult.body);
    if (!validationBody.success) {
      return validationResult;
    }

    const promotion = validationBody.data;

    // Increment usage count
    await docClient.send(new UpdateCommand({
      TableName: PROMOTIONS_TABLE,
      Key: { promotionId: promotion.promotionId },
      UpdateExpression: 'SET usageCount = usageCount + :inc',
      ExpressionAttributeValues: {
        ':inc': 1,
      },
    }));

    return response(200, {
      success: true,
      data: {
        applied: true,
        promotionId: promotion.promotionId,
        discount: promotion.discount,
      },
      message: 'Promo code applied successfully',
      messageAr: 'تم تطبيق رمز الترويج بنجاح',
    });
  } catch (error) {
    console.error('Error applying promo code:', error);
    return response(500, { error: 'Failed to apply promo code' });
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
    if (path.match(/\/promotions\/validate\/?$/) || resource === '/promotions/validate') {
      if (httpMethod === 'POST') return validatePromoCode(event);
    }

    if (path.match(/\/promotions\/apply\/?$/) || resource === '/promotions/apply') {
      if (httpMethod === 'POST') return applyPromoCode(event);
    }

    if (path.match(/\/promotions\/[^/]+\/?$/) || resource === '/promotions/{promotionId}') {
      if (httpMethod === 'GET') return getPromotionById(event);
    }

    if (path.match(/\/promotions\/?$/) || resource === '/promotions') {
      if (httpMethod === 'GET') return getPromotions(event);
    }

    return response(404, { error: 'Not found' });
  } catch (error) {
    console.error('Unhandled error:', error);
    return response(500, { error: 'Internal server error' });
  }
};
