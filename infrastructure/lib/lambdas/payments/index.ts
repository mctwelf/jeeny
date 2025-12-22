/**
 * Jeeny Payments Lambda Handler
 *
 * Handles all payment-related operations including:
 * - Payment processing
 * - Wallet management
 * - Payment methods management
 * - Transaction history
 * - Integration with local payment providers (Bankily, Sedad, Masrvi)
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
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

// Initialize clients
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Environment variables
const USERS_TABLE = process.env.USERS_TABLE || 'jeeny-users';
const TRANSACTIONS_TABLE = process.env.TRANSACTIONS_TABLE || 'jeeny-transactions';
const RIDES_TABLE = process.env.RIDES_TABLE || 'jeeny-rides';

// Types
interface PaymentMethod {
  methodId: string;
  userId: string;
  type: 'wallet' | 'bankily' | 'sedad' | 'masrvi' | 'cash';
  name: string;
  details: {
    phoneNumber?: string;
    accountNumber?: string;
    lastFour?: string;
  };
  isDefault: boolean;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

interface Transaction {
  transactionId: string;
  userId: string;
  type: 'payment' | 'topup' | 'withdrawal' | 'refund' | 'earning' | 'tip' | 'commission';
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  paymentMethod: string;
  provider?: string;
  providerTransactionId?: string;
  rideId?: string;
  description: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

interface WalletInfo {
  userId: string;
  balance: number;
  currency: string;
  lastUpdated: string;
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

// =====================================================
// PAYMENT METHODS HANDLERS
// =====================================================

/**
 * Get user's payment methods
 */
const getPaymentMethods = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return response(401, { error: 'Unauthorized' });
    }

    const result = await docClient.send(new QueryCommand({
      TableName: TRANSACTIONS_TABLE,
      IndexName: 'userId-type-index',
      KeyConditionExpression: 'userId = :userId AND begins_with(SK, :prefix)',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':prefix': 'PAYMENT_METHOD#',
      },
    }));

    // Add default wallet method
    const methods: PaymentMethod[] = [
      {
        methodId: 'wallet',
        userId,
        type: 'wallet',
        name: 'Jeeny Wallet',
        details: {},
        isDefault: true,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        methodId: 'cash',
        userId,
        type: 'cash',
        name: 'Cash',
        details: {},
        isDefault: false,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      ...(result.Items as PaymentMethod[] || []),
    ];

    return response(200, {
      success: true,
      data: methods,
    });
  } catch (error) {
    console.error('Error getting payment methods:', error);
    return response(500, { error: 'Failed to get payment methods' });
  }
};

/**
 * Add a new payment method
 */
const addPaymentMethod = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return response(401, { error: 'Unauthorized' });
    }

    const body = JSON.parse(event.body || '{}');
    const { type, name, details, isDefault = false } = body;

    if (!type || !['bankily', 'sedad', 'masrvi'].includes(type)) {
      return response(400, { error: 'Invalid payment method type' });
    }

    if (!details?.phoneNumber && !details?.accountNumber) {
      return response(400, { error: 'Phone number or account number is required' });
    }

    const methodId = uuidv4();
    const now = new Date().toISOString();

    const paymentMethod: PaymentMethod = {
      methodId,
      userId,
      type,
      name: name || type.charAt(0).toUpperCase() + type.slice(1),
      details: {
        phoneNumber: details.phoneNumber,
        accountNumber: details.accountNumber,
        lastFour: details.phoneNumber?.slice(-4) || details.accountNumber?.slice(-4),
      },
      isDefault,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    await docClient.send(new PutCommand({
      TableName: TRANSACTIONS_TABLE,
      Item: {
        PK: `USER#${userId}`,
        SK: `PAYMENT_METHOD#${methodId}`,
        ...paymentMethod,
      },
    }));

    return response(201, {
      success: true,
      data: paymentMethod,
      message: 'Payment method added successfully',
    });
  } catch (error) {
    console.error('Error adding payment method:', error);
    return response(500, { error: 'Failed to add payment method' });
  }
};

// =====================================================
// WALLET HANDLERS
// =====================================================

/**
 * Get wallet balance
 */
const getWallet = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return response(401, { error: 'Unauthorized' });
    }

    // Get user record for wallet balance
    const userResult = await docClient.send(new GetCommand({
      TableName: USERS_TABLE,
      Key: { userId },
      ProjectionExpression: 'userId, walletBalance',
    }));

    if (!userResult.Item) {
      return response(404, { error: 'User not found' });
    }

    const wallet: WalletInfo = {
      userId,
      balance: userResult.Item.walletBalance || 0,
      currency: 'MRU',
      lastUpdated: new Date().toISOString(),
    };

    return response(200, {
      success: true,
      data: wallet,
    });
  } catch (error) {
    console.error('Error getting wallet:', error);
    return response(500, { error: 'Failed to get wallet' });
  }
};

/**
 * Top up wallet
 */
const topUpWallet = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return response(401, { error: 'Unauthorized' });
    }

    const body = JSON.parse(event.body || '{}');
    const { amount, paymentMethod, providerDetails } = body;

    if (!amount || amount <= 0) {
      return response(400, { error: 'Valid amount is required' });
    }

    if (!paymentMethod || !['bankily', 'sedad', 'masrvi'].includes(paymentMethod)) {
      return response(400, { error: 'Valid payment method is required' });
    }

    const transactionId = uuidv4();
    const now = new Date().toISOString();

    // Create pending transaction
    const transaction: Transaction = {
      transactionId,
      userId,
      type: 'topup',
      amount,
      currency: 'MRU',
      status: 'pending',
      paymentMethod,
      provider: paymentMethod,
      description: `Wallet top-up via ${paymentMethod}`,
      metadata: providerDetails,
      createdAt: now,
      updatedAt: now,
    };

    await docClient.send(new PutCommand({
      TableName: TRANSACTIONS_TABLE,
      Item: {
        PK: `USER#${userId}`,
        SK: `TRANSACTION#${transactionId}`,
        ...transaction,
        GSI1PK: `TRANSACTION#${transactionId}`,
        GSI1SK: now,
      },
    }));

    // TODO: Integrate with actual payment provider
    // For now, simulate immediate success
    const simulatedSuccess = true;

    if (simulatedSuccess) {
      // Update wallet balance
      await docClient.send(new UpdateCommand({
        TableName: USERS_TABLE,
        Key: { userId },
        UpdateExpression: 'SET walletBalance = if_not_exists(walletBalance, :zero) + :amount, updatedAt = :now',
        ExpressionAttributeValues: {
          ':amount': amount,
          ':zero': 0,
          ':now': now,
        },
      }));

      // Update transaction status
      await docClient.send(new UpdateCommand({
        TableName: TRANSACTIONS_TABLE,
        Key: { PK: `USER#${userId}`, SK: `TRANSACTION#${transactionId}` },
        UpdateExpression: 'SET #status = :status, completedAt = :now, updatedAt = :now',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':status': 'completed',
          ':now': now,
        },
      }));

      transaction.status = 'completed';
      transaction.completedAt = now;
    }

    return response(200, {
      success: true,
      data: transaction,
      message: 'Wallet topped up successfully',
    });
  } catch (error) {
    console.error('Error topping up wallet:', error);
    return response(500, { error: 'Failed to top up wallet' });
  }
};

/**
 * Withdraw from wallet
 */
const withdrawFromWallet = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return response(401, { error: 'Unauthorized' });
    }

    const body = JSON.parse(event.body || '{}');
    const { amount, paymentMethod, withdrawalDetails } = body;

    if (!amount || amount <= 0) {
      return response(400, { error: 'Valid amount is required' });
    }

    // Check wallet balance
    const userResult = await docClient.send(new GetCommand({
      TableName: USERS_TABLE,
      Key: { userId },
      ProjectionExpression: 'walletBalance',
    }));

    if (!userResult.Item) {
      return response(404, { error: 'User not found' });
    }

    const currentBalance = userResult.Item.walletBalance || 0;
    if (currentBalance < amount) {
      return response(400, { error: 'Insufficient wallet balance' });
    }

    const transactionId = uuidv4();
    const now = new Date().toISOString();

    // Create withdrawal transaction
    const transaction: Transaction = {
      transactionId,
      userId,
      type: 'withdrawal',
      amount: -amount,
      currency: 'MRU',
      status: 'pending',
      paymentMethod: paymentMethod || 'bank_transfer',
      description: 'Wallet withdrawal',
      metadata: withdrawalDetails,
      createdAt: now,
      updatedAt: now,
    };

    await docClient.send(new PutCommand({
      TableName: TRANSACTIONS_TABLE,
      Item: {
        PK: `USER#${userId}`,
        SK: `TRANSACTION#${transactionId}`,
        ...transaction,
        GSI1PK: `TRANSACTION#${transactionId}`,
        GSI1SK: now,
      },
    }));

    // Deduct from wallet
    await docClient.send(new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { userId },
      UpdateExpression: 'SET walletBalance = walletBalance - :amount, updatedAt = :now',
      ExpressionAttributeValues: {
        ':amount': amount,
        ':now': now,
      },
      ConditionExpression: 'walletBalance >= :amount',
    }));

    return response(200, {
      success: true,
      data: transaction,
      message: 'Withdrawal request submitted. Processing may take 1-3 business days.',
    });
  } catch (error: any) {
    console.error('Error withdrawing from wallet:', error);
    if (error.name === 'ConditionalCheckFailedException') {
      return response(400, { error: 'Insufficient wallet balance' });
    }
    return response(500, { error: 'Failed to process withdrawal' });
  }
};

// =====================================================
// TRANSACTION HANDLERS
// =====================================================

/**
 * Get transaction history
 */
const getTransactionHistory = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return response(401, { error: 'Unauthorized' });
    }

    const { type, status, limit = '20', lastKey } = event.queryStringParameters || {};

    const params: any = {
      TableName: TRANSACTIONS_TABLE,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':prefix': 'TRANSACTION#',
      },
      ScanIndexForward: false,
      Limit: parseInt(limit),
    };

    if (type || status) {
      let filterExpression = '';
      if (type) {
        filterExpression = '#type = :type';
        params.ExpressionAttributeNames = { '#type': 'type' };
        params.ExpressionAttributeValues[':type'] = type;
      }
      if (status) {
        if (filterExpression) filterExpression += ' AND ';
        filterExpression += '#status = :status';
        params.ExpressionAttributeNames = { ...params.ExpressionAttributeNames, '#status': 'status' };
        params.ExpressionAttributeValues[':status'] = status;
      }
      params.FilterExpression = filterExpression;
    }

    if (lastKey) {
      params.ExclusiveStartKey = JSON.parse(Buffer.from(lastKey, 'base64').toString());
    }

    const result = await docClient.send(new QueryCommand(params));

    return response(200, {
      success: true,
      data: {
        transactions: result.Items,
        lastKey: result.LastEvaluatedKey
          ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
          : null,
      },
    });
  } catch (error) {
    console.error('Error getting transaction history:', error);
    return response(500, { error: 'Failed to get transaction history' });
  }
};

/**
 * Get transaction by ID
 */
const getTransactionById = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return response(401, { error: 'Unauthorized' });
    }

    const paymentId = event.pathParameters?.paymentId;
    if (!paymentId) {
      return response(400, { error: 'Payment ID is required' });
    }

    const result = await docClient.send(new GetCommand({
      TableName: TRANSACTIONS_TABLE,
      Key: {
        PK: `USER#${userId}`,
        SK: `TRANSACTION#${paymentId}`,
      },
    }));

    if (!result.Item) {
      return response(404, { error: 'Transaction not found' });
    }

    return response(200, {
      success: true,
      data: result.Item,
    });
  } catch (error) {
    console.error('Error getting transaction:', error);
    return response(500, { error: 'Failed to get transaction' });
  }
};

// =====================================================
// PAYMENT PROVIDER HANDLERS
// =====================================================

/**
 * Process Bankily payment
 */
const processBankilyPayment = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return response(401, { error: 'Unauthorized' });
    }

    const body = JSON.parse(event.body || '{}');
    const { amount, phoneNumber, rideId } = body;

    if (!amount || !phoneNumber) {
      return response(400, { error: 'Amount and phone number are required' });
    }

    // TODO: Integrate with actual Bankily API
    // For now, simulate the payment flow

    const transactionId = uuidv4();
    const now = new Date().toISOString();

    const transaction: Transaction = {
      transactionId,
      userId,
      type: 'payment',
      amount,
      currency: 'MRU',
      status: 'processing',
      paymentMethod: 'bankily',
      provider: 'bankily',
      rideId,
      description: rideId ? `Payment for ride ${rideId}` : 'Bankily payment',
      metadata: { phoneNumber },
      createdAt: now,
      updatedAt: now,
    };

    await docClient.send(new PutCommand({
      TableName: TRANSACTIONS_TABLE,
      Item: {
        PK: `USER#${userId}`,
        SK: `TRANSACTION#${transactionId}`,
        ...transaction,
      },
    }));

    return response(200, {
      success: true,
      data: {
        transactionId,
        status: 'processing',
        message: 'Please confirm the payment on your Bankily app',
        checkStatusUrl: `/payments/${transactionId}`,
      },
    });
  } catch (error) {
    console.error('Error processing Bankily payment:', error);
    return response(500, { error: 'Failed to process payment' });
  }
};

/**
 * Process Sedad payment
 */
const processSedadPayment = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return response(401, { error: 'Unauthorized' });
    }

    const body = JSON.parse(event.body || '{}');
    const { amount, phoneNumber, rideId } = body;

    if (!amount || !phoneNumber) {
      return response(400, { error: 'Amount and phone number are required' });
    }

    // TODO: Integrate with actual Sedad API

    const transactionId = uuidv4();
    const now = new Date().toISOString();

    const transaction: Transaction = {
      transactionId,
      userId,
      type: 'payment',
      amount,
      currency: 'MRU',
      status: 'processing',
      paymentMethod: 'sedad',
      provider: 'sedad',
      rideId,
      description: rideId ? `Payment for ride ${rideId}` : 'Sedad payment',
      metadata: { phoneNumber },
      createdAt: now,
      updatedAt: now,
    };

    await docClient.send(new PutCommand({
      TableName: TRANSACTIONS_TABLE,
      Item: {
        PK: `USER#${userId}`,
        SK: `TRANSACTION#${transactionId}`,
        ...transaction,
      },
    }));

    return response(200, {
      success: true,
      data: {
        transactionId,
        status: 'processing',
        message: 'Please confirm the payment on your Sedad app',
        checkStatusUrl: `/payments/${transactionId}`,
      },
    });
  } catch (error) {
    console.error('Error processing Sedad payment:', error);
    return response(500, { error: 'Failed to process payment' });
  }
};

/**
 * Process Masrvi payment
 */
const processMasrviPayment = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) {
      return response(401, { error: 'Unauthorized' });
    }

    const body = JSON.parse(event.body || '{}');
    const { amount, phoneNumber, rideId } = body;

    if (!amount || !phoneNumber) {
      return response(400, { error: 'Amount and phone number are required' });
    }

    // TODO: Integrate with actual Masrvi API

    const transactionId = uuidv4();
    const now = new Date().toISOString();

    const transaction: Transaction = {
      transactionId,
      userId,
      type: 'payment',
      amount,
      currency: 'MRU',
      status: 'processing',
      paymentMethod: 'masrvi',
      provider: 'masrvi',
      rideId,
      description: rideId ? `Payment for ride ${rideId}` : 'Masrvi payment',
      metadata: { phoneNumber },
      createdAt: now,
      updatedAt: now,
    };

    await docClient.send(new PutCommand({
      TableName: TRANSACTIONS_TABLE,
      Item: {
        PK: `USER#${userId}`,
        SK: `TRANSACTION#${transactionId}`,
        ...transaction,
      },
    }));

    return response(200, {
      success: true,
      data: {
        transactionId,
        status: 'processing',
        message: 'Please confirm the payment on your Masrvi app',
        checkStatusUrl: `/payments/${transactionId}`,
      },
    });
  } catch (error) {
    console.error('Error processing Masrvi payment:', error);
    return response(500, { error: 'Failed to process payment' });
  }
};

// =====================================================
// MAIN HANDLER
// =====================================================

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event, null, 2));

  const { httpMethod, path, resource } = event;

  try {
    // Payment methods
    if (path.match(/\/payments\/methods\/?$/) || resource === '/payments/methods') {
      if (httpMethod === 'GET') return getPaymentMethods(event);
      if (httpMethod === 'POST') return addPaymentMethod(event);
    }

    // Wallet
    if (path.match(/\/payments\/wallet\/?$/) || resource === '/payments/wallet') {
      if (httpMethod === 'GET') return getWallet(event);
    }

    if (path.match(/\/payments\/wallet\/topup\/?$/) || resource === '/payments/wallet/topup') {
      if (httpMethod === 'POST') return topUpWallet(event);
    }

    if (path.match(/\/payments\/wallet\/withdraw\/?$/) || resource === '/payments/wallet/withdraw') {
      if (httpMethod === 'POST') return withdrawFromWallet(event);
    }

    // Transaction history
    if (path.match(/\/payments\/history\/?$/) || resource === '/payments/history') {
      if (httpMethod === 'GET') return getTransactionHistory(event);
    }

    // Payment providers
    if (path.match(/\/payments\/providers\/bankily\/?$/) || resource === '/payments/providers/bankily') {
      if (httpMethod === 'POST') return processBankilyPayment(event);
    }

    if (path.match(/\/payments\/providers\/sedad\/?$/) || resource === '/payments/providers/sedad') {
      if (httpMethod === 'POST') return processSedadPayment(event);
    }

    if (path.match(/\/payments\/providers\/masrvi\/?$/) || resource === '/payments/providers/masrvi') {
      if (httpMethod === 'POST') return processMasrviPayment(event);
    }

    // Single payment/transaction
    if (path.match(/\/payments\/[^/]+\/?$/) || resource === '/payments/{paymentId}') {
      if (httpMethod === 'GET') return getTransactionById(event);
    }

    // General payments endpoint
    if (path.match(/\/payments\/?$/) || resource === '/payments') {
      if (httpMethod === 'GET') return getTransactionHistory(event);
    }

    return response(404, { error: 'Not found' });
  } catch (error) {
    console.error('Unhandled error:', error);
    return response(500, { error: 'Internal server error' });
  }
};
