/**
 * Jeeny Auth Lambda Handler
 *
 * Handles authentication operations including:
 * - User registration
 * - OTP verification
 * - OTP resend
 * - Login
 * - Token refresh
 * - Logout
 */

import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  ResendConfirmationCodeCommand,
  InitiateAuthCommand,
  GlobalSignOutCommand,
  AdminGetUserCommand,
  AdminUpdateUserAttributesCommand,
  AdminAddUserToGroupCommand,
  AuthFlowType,
} from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

// Initialize clients
const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION_NAME || 'eu-north-1',
});

const ddbClient = new DynamoDBClient({
  region: process.env.AWS_REGION_NAME || 'eu-north-1',
});

const docClient = DynamoDBDocumentClient.from(ddbClient);

// Environment variables
const USER_POOL_ID = process.env.USER_POOL_ID!;
const USER_POOL_CLIENT_ID = process.env.USER_POOL_CLIENT_ID!;
const USERS_TABLE = process.env.USERS_TABLE!;

// Types
interface RegisterRequest {
  phoneNumber: string;
  userType: 'client' | 'driver' | 'employee';
  preferredLanguage?: string;
  referralCode?: string;
}

interface VerifyOtpRequest {
  phoneNumber: string;
  code: string;
}

interface ResendOtpRequest {
  phoneNumber: string;
}

interface LoginRequest {
  phoneNumber: string;
  password?: string;
}

interface RefreshTokenRequest {
  refreshToken: string;
}

// Helper functions
const createResponse = (
  statusCode: number,
  body: Record<string, unknown>
): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true',
  },
  body: JSON.stringify(body),
});

const generateReferralCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const formatPhoneNumber = (phone: string): string => {
  // Ensure phone number starts with +
  if (!phone.startsWith('+')) {
    // Assume Mauritania country code if not provided
    if (phone.startsWith('00')) {
      return '+' + phone.slice(2);
    }
    return '+222' + phone;
  }
  return phone;
};

// Handler functions
const handleRegister = async (body: RegisterRequest): Promise<APIGatewayProxyResult> => {
  try {
    const { phoneNumber, userType, preferredLanguage = 'ar', referralCode } = body;

    if (!phoneNumber || !userType) {
      return createResponse(400, {
        success: false,
        message: 'Phone number and user type are required',
        messageAr: 'رقم الهاتف ونوع المستخدم مطلوبان',
      });
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    const userId = uuidv4();
    const userReferralCode = generateReferralCode();

    // Generate a temporary password (user will use OTP)
    const tempPassword = `Temp${Math.random().toString(36).slice(2)}!1`;

    // Create user in Cognito
    const signUpCommand = new SignUpCommand({
      ClientId: USER_POOL_CLIENT_ID,
      Username: formattedPhone,
      Password: tempPassword,
      UserAttributes: [
        { Name: 'phone_number', Value: formattedPhone },
        { Name: 'custom:user_role', Value: userType },
        { Name: 'custom:user_status', Value: 'pending' },
        { Name: 'custom:preferred_language', Value: preferredLanguage },
        { Name: 'custom:referral_code', Value: userReferralCode },
        ...(referralCode ? [{ Name: 'custom:referred_by', Value: referralCode }] : []),
      ],
    });

    await cognitoClient.send(signUpCommand);

    // Create user record in DynamoDB
    const now = new Date().toISOString();
    const userRecord = {
      PK: `USER#${userId}`,
      SK: `PROFILE#${userId}`,
      userId,
      phoneNumber: formattedPhone,
      userType,
      status: 'pending',
      preferredLanguage,
      referralCode: userReferralCode,
      referredBy: referralCode || null,
      walletBalance: 0,
      rating: 0,
      totalRides: 0,
      createdAt: now,
      updatedAt: now,
      // GSI keys
      GSI1PK: `PHONE#${formattedPhone}`,
      GSI1SK: `USER#${userId}`,
      GSI2PK: `TYPE#${userType}`,
      GSI2SK: now,
    };

    await docClient.send(
      new PutCommand({
        TableName: USERS_TABLE,
        Item: userRecord,
        ConditionExpression: 'attribute_not_exists(PK)',
      })
    );

    return createResponse(200, {
      success: true,
      message: 'Registration successful. Please verify your phone number.',
      messageAr: 'تم التسجيل بنجاح. يرجى التحقق من رقم هاتفك.',
      data: {
        userId,
        phoneNumber: formattedPhone,
        referralCode: userReferralCode,
      },
    });
  } catch (error: any) {
    console.error('Register error:', error);

    if (error.name === 'UsernameExistsException') {
      return createResponse(409, {
        success: false,
        message: 'Phone number already registered',
        messageAr: 'رقم الهاتف مسجل بالفعل',
      });
    }

    return createResponse(500, {
      success: false,
      message: 'Registration failed',
      messageAr: 'فشل التسجيل',
      error: error.message,
    });
  }
};

const handleVerifyOtp = async (body: VerifyOtpRequest): Promise<APIGatewayProxyResult> => {
  try {
    const { phoneNumber, code } = body;

    if (!phoneNumber || !code) {
      return createResponse(400, {
        success: false,
        message: 'Phone number and verification code are required',
        messageAr: 'رقم الهاتف ورمز التحقق مطلوبان',
      });
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);

    // Confirm sign up
    const confirmCommand = new ConfirmSignUpCommand({
      ClientId: USER_POOL_CLIENT_ID,
      Username: formattedPhone,
      ConfirmationCode: code,
    });

    await cognitoClient.send(confirmCommand);

    // Update user status in Cognito
    await cognitoClient.send(
      new AdminUpdateUserAttributesCommand({
        UserPoolId: USER_POOL_ID,
        Username: formattedPhone,
        UserAttributes: [{ Name: 'custom:user_status', Value: 'active' }],
      })
    );

    // Get user info from Cognito
    const userInfo = await cognitoClient.send(
      new AdminGetUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: formattedPhone,
      })
    );

    const userRole = userInfo.UserAttributes?.find(
      (attr) => attr.Name === 'custom:user_role'
    )?.Value;

    // Add user to appropriate group
    if (userRole) {
      const groupName = `${userRole}s`; // clients, drivers, employees
      await cognitoClient.send(
        new AdminAddUserToGroupCommand({
          UserPoolId: USER_POOL_ID,
          Username: formattedPhone,
          GroupName: groupName,
        })
      );
    }

    return createResponse(200, {
      success: true,
      message: 'Phone number verified successfully',
      messageAr: 'تم التحقق من رقم الهاتف بنجاح',
      data: {
        verified: true,
      },
    });
  } catch (error: any) {
    console.error('Verify OTP error:', error);

    if (error.name === 'CodeMismatchException') {
      return createResponse(400, {
        success: false,
        message: 'Invalid verification code',
        messageAr: 'رمز التحقق غير صالح',
      });
    }

    if (error.name === 'ExpiredCodeException') {
      return createResponse(400, {
        success: false,
        message: 'Verification code has expired',
        messageAr: 'انتهت صلاحية رمز التحقق',
      });
    }

    return createResponse(500, {
      success: false,
      message: 'Verification failed',
      messageAr: 'فشل التحقق',
      error: error.message,
    });
  }
};

const handleResendOtp = async (body: ResendOtpRequest): Promise<APIGatewayProxyResult> => {
  try {
    const { phoneNumber } = body;

    if (!phoneNumber) {
      return createResponse(400, {
        success: false,
        message: 'Phone number is required',
        messageAr: 'رقم الهاتف مطلوب',
      });
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);

    const resendCommand = new ResendConfirmationCodeCommand({
      ClientId: USER_POOL_CLIENT_ID,
      Username: formattedPhone,
    });

    await cognitoClient.send(resendCommand);

    return createResponse(200, {
      success: true,
      message: 'Verification code sent successfully',
      messageAr: 'تم إرسال رمز التحقق بنجاح',
    });
  } catch (error: any) {
    console.error('Resend OTP error:', error);

    if (error.name === 'LimitExceededException') {
      return createResponse(429, {
        success: false,
        message: 'Too many attempts. Please try again later.',
        messageAr: 'محاولات كثيرة جداً. يرجى المحاولة لاحقاً.',
      });
    }

    return createResponse(500, {
      success: false,
      message: 'Failed to resend verification code',
      messageAr: 'فشل في إعادة إرسال رمز التحقق',
      error: error.message,
    });
  }
};

const handleLogin = async (body: LoginRequest): Promise<APIGatewayProxyResult> => {
  try {
    const { phoneNumber, password } = body;

    if (!phoneNumber) {
      return createResponse(400, {
        success: false,
        message: 'Phone number is required',
        messageAr: 'رقم الهاتف مطلوب',
      });
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);

    // For OTP-based login, we use custom auth flow
    // For password-based login (admin), we use USER_PASSWORD_AUTH
    const authCommand = new InitiateAuthCommand({
      ClientId: USER_POOL_CLIENT_ID,
      AuthFlow: password ? AuthFlowType.USER_PASSWORD_AUTH : AuthFlowType.CUSTOM_AUTH,
      AuthParameters: password
        ? {
            USERNAME: formattedPhone,
            PASSWORD: password,
          }
        : {
            USERNAME: formattedPhone,
          },
    });

    const authResult = await cognitoClient.send(authCommand);

    if (authResult.ChallengeName) {
      // Challenge required (e.g., SMS_MFA, CUSTOM_CHALLENGE)
      return createResponse(200, {
        success: true,
        message: 'Challenge required',
        messageAr: 'التحقق مطلوب',
        data: {
          challengeName: authResult.ChallengeName,
          session: authResult.Session,
          challengeParameters: authResult.ChallengeParameters,
        },
      });
    }

    if (authResult.AuthenticationResult) {
      // Successful authentication
      return createResponse(200, {
        success: true,
        message: 'Login successful',
        messageAr: 'تم تسجيل الدخول بنجاح',
        data: {
          accessToken: authResult.AuthenticationResult.AccessToken,
          idToken: authResult.AuthenticationResult.IdToken,
          refreshToken: authResult.AuthenticationResult.RefreshToken,
          expiresIn: authResult.AuthenticationResult.ExpiresIn,
          tokenType: authResult.AuthenticationResult.TokenType,
        },
      });
    }

    return createResponse(400, {
      success: false,
      message: 'Login failed',
      messageAr: 'فشل تسجيل الدخول',
    });
  } catch (error: any) {
    console.error('Login error:', error);

    if (error.name === 'NotAuthorizedException') {
      return createResponse(401, {
        success: false,
        message: 'Invalid credentials',
        messageAr: 'بيانات الاعتماد غير صالحة',
      });
    }

    if (error.name === 'UserNotConfirmedException') {
      return createResponse(403, {
        success: false,
        message: 'Please verify your phone number first',
        messageAr: 'يرجى التحقق من رقم هاتفك أولاً',
      });
    }

    if (error.name === 'UserNotFoundException') {
      return createResponse(404, {
        success: false,
        message: 'User not found',
        messageAr: 'المستخدم غير موجود',
      });
    }

    return createResponse(500, {
      success: false,
      message: 'Login failed',
      messageAr: 'فشل تسجيل الدخول',
      error: error.message,
    });
  }
};

const handleRefreshToken = async (
  body: RefreshTokenRequest
): Promise<APIGatewayProxyResult> => {
  try {
    const { refreshToken } = body;

    if (!refreshToken) {
      return createResponse(400, {
        success: false,
        message: 'Refresh token is required',
        messageAr: 'رمز التحديث مطلوب',
      });
    }

    const authCommand = new InitiateAuthCommand({
      ClientId: USER_POOL_CLIENT_ID,
      AuthFlow: AuthFlowType.REFRESH_TOKEN_AUTH,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
      },
    });

    const authResult = await cognitoClient.send(authCommand);

    if (authResult.AuthenticationResult) {
      return createResponse(200, {
        success: true,
        message: 'Token refreshed successfully',
        messageAr: 'تم تحديث الرمز بنجاح',
        data: {
          accessToken: authResult.AuthenticationResult.AccessToken,
          idToken: authResult.AuthenticationResult.IdToken,
          expiresIn: authResult.AuthenticationResult.ExpiresIn,
          tokenType: authResult.AuthenticationResult.TokenType,
        },
      });
    }

    return createResponse(400, {
      success: false,
      message: 'Token refresh failed',
      messageAr: 'فشل تحديث الرمز',
    });
  } catch (error: any) {
    console.error('Refresh token error:', error);

    if (error.name === 'NotAuthorizedException') {
      return createResponse(401, {
        success: false,
        message: 'Invalid or expired refresh token',
        messageAr: 'رمز التحديث غير صالح أو منتهي الصلاحية',
      });
    }

    return createResponse(500, {
      success: false,
      message: 'Token refresh failed',
      messageAr: 'فشل تحديث الرمز',
      error: error.message,
    });
  }
};

const handleLogout = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const accessToken = event.headers.Authorization?.replace('Bearer ', '');

    if (!accessToken) {
      return createResponse(400, {
        success: false,
        message: 'Access token is required',
        messageAr: 'رمز الوصول مطلوب',
      });
    }

    const signOutCommand = new GlobalSignOutCommand({
      AccessToken: accessToken,
    });

    await cognitoClient.send(signOutCommand);

    return createResponse(200, {
      success: true,
      message: 'Logged out successfully',
      messageAr: 'تم تسجيل الخروج بنجاح',
    });
  } catch (error: any) {
    console.error('Logout error:', error);

    return createResponse(500, {
      success: false,
      message: 'Logout failed',
      messageAr: 'فشل تسجيل الخروج',
      error: error.message,
    });
  }
};

// Main handler
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('Auth Lambda invoked:', JSON.stringify(event, null, 2));

  const { httpMethod, path, body } = event;
  const parsedBody = body ? JSON.parse(body) : {};

  // Route based on path and method
  const pathParts = path.split('/').filter(Boolean);
  const endpoint = pathParts[pathParts.length - 1];

  try {
    switch (endpoint) {
      case 'register':
        if (httpMethod === 'POST') {
          return handleRegister(parsedBody);
        }
        break;

      case 'verify-otp':
        if (httpMethod === 'POST') {
          return handleVerifyOtp(parsedBody);
        }
        break;

      case 'resend-otp':
        if (httpMethod === 'POST') {
          return handleResendOtp(parsedBody);
        }
        break;

      case 'login':
        if (httpMethod === 'POST') {
          return handleLogin(parsedBody);
        }
        break;

      case 'refresh-token':
        if (httpMethod === 'POST') {
          return handleRefreshToken(parsedBody);
        }
        break;

      case 'logout':
        if (httpMethod === 'POST') {
          return handleLogout(event);
        }
        break;
    }

    return createResponse(404, {
      success: false,
      message: 'Endpoint not found',
      messageAr: 'نقطة النهاية غير موجودة',
    });
  } catch (error: any) {
    console.error('Unhandled error:', error);
    return createResponse(500, {
      success: false,
      message: 'Internal server error',
      messageAr: 'خطأ في الخادم الداخلي',
      error: error.message,
    });
  }
};
