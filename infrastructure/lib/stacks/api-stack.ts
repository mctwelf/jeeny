/**
 * Jeeny API Stack - API Gateway and Lambda Functions
 *
 * Creates REST API, WebSocket API, and Lambda functions
 * for the Jeeny taxi booking platform.
 *
 * Features:
 * - REST API for CRUD operations
 * - WebSocket API for real-time updates
 * - Lambda functions for business logic
 * - Cognito authorizer for authentication
 *
 * Region: eu-north-1
 * Account: 160343708363
 */

import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayv2Integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import * as path from 'path';

export interface JeenyApiStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  userPool: cognito.IUserPool;
  userPoolClient: cognito.IUserPoolClient;
  tables: {
    users: dynamodb.ITable;
    rides: dynamodb.ITable;
    transactions: dynamodb.ITable;
    notifications: dynamodb.ITable;
    chats: dynamodb.ITable;
    settings: dynamodb.ITable;
    locations: dynamodb.ITable;
    vehicles: dynamodb.ITable;
    promotions: dynamodb.ITable;
    supportTickets: dynamodb.ITable;
  };
  assetsBucket: s3.IBucket;
  locationResources: {
    mapName: string;
    placeIndexName: string;
    routeCalculatorName: string;
    trackerName: string;
  };
}

export class JeenyApiStack extends cdk.Stack {
  public readonly restApi: apigateway.RestApi;
  public readonly webSocketApi: apigatewayv2.WebSocketApi;
  public readonly restApiUrl: string;
  public readonly webSocketApiUrl: string;

  constructor(scope: Construct, id: string, props: JeenyApiStackProps) {
    super(scope, id, props);

    const { vpc, userPool, userPoolClient, tables, assetsBucket, locationResources } = props;

    // =====================================================
    // COMMON LAMBDA CONFIGURATION
    // =====================================================

    const lambdaEnvironment: { [key: string]: string } = {
      // Tables
      USERS_TABLE: tables.users.tableName,
      RIDES_TABLE: tables.rides.tableName,
      TRANSACTIONS_TABLE: tables.transactions.tableName,
      NOTIFICATIONS_TABLE: tables.notifications.tableName,
      CHATS_TABLE: tables.chats.tableName,
      SETTINGS_TABLE: tables.settings.tableName,
      LOCATIONS_TABLE: tables.locations.tableName,
      VEHICLES_TABLE: tables.vehicles.tableName,
      PROMOTIONS_TABLE: tables.promotions.tableName,
      SUPPORT_TICKETS_TABLE: tables.supportTickets.tableName,
      // Cognito
      USER_POOL_ID: userPool.userPoolId,
      USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
      // Location Service
      MAP_NAME: locationResources.mapName,
      PLACE_INDEX_NAME: locationResources.placeIndexName,
      ROUTE_CALCULATOR_NAME: locationResources.routeCalculatorName,
      TRACKER_NAME: locationResources.trackerName,
      // S3
      ASSETS_BUCKET: assetsBucket.bucketName,
      // Region
      AWS_REGION_NAME: 'eu-north-1',
    };

    // Common Lambda props
    const commonLambdaProps: Partial<lambda.FunctionProps> = {
      runtime: lambda.Runtime.NODEJS_18_X,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: lambdaEnvironment,
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_MONTH,
    };

    // =====================================================
    // LAMBDA EXECUTION ROLE
    // =====================================================

    const lambdaExecutionRole = new iam.Role(this, 'LambdaExecutionRole', {
      roleName: 'jeeny-lambda-execution-role',
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
      ],
    });

    // DynamoDB permissions
    lambdaExecutionRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'dynamodb:GetItem',
          'dynamodb:PutItem',
          'dynamodb:UpdateItem',
          'dynamodb:DeleteItem',
          'dynamodb:Query',
          'dynamodb:Scan',
          'dynamodb:BatchGetItem',
          'dynamodb:BatchWriteItem',
        ],
        resources: [
          tables.users.tableArn,
          `${tables.users.tableArn}/index/*`,
          tables.rides.tableArn,
          `${tables.rides.tableArn}/index/*`,
          tables.transactions.tableArn,
          `${tables.transactions.tableArn}/index/*`,
          tables.notifications.tableArn,
          `${tables.notifications.tableArn}/index/*`,
          tables.chats.tableArn,
          `${tables.chats.tableArn}/index/*`,
          tables.settings.tableArn,
          tables.locations.tableArn,
          `${tables.locations.tableArn}/index/*`,
          tables.vehicles.tableArn,
          `${tables.vehicles.tableArn}/index/*`,
          tables.promotions.tableArn,
          `${tables.promotions.tableArn}/index/*`,
          tables.supportTickets.tableArn,
          `${tables.supportTickets.tableArn}/index/*`,
        ],
      })
    );

    // Cognito permissions
    lambdaExecutionRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'cognito-idp:AdminGetUser',
          'cognito-idp:AdminCreateUser',
          'cognito-idp:AdminUpdateUserAttributes',
          'cognito-idp:AdminDeleteUser',
          'cognito-idp:AdminAddUserToGroup',
          'cognito-idp:AdminRemoveUserFromGroup',
          'cognito-idp:ListUsers',
          'cognito-idp:ListUsersInGroup',
        ],
        resources: [userPool.userPoolArn],
      })
    );

    // Location Service permissions
    lambdaExecutionRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'geo:SearchPlaceIndexForText',
          'geo:SearchPlaceIndexForPosition',
          'geo:SearchPlaceIndexForSuggestions',
          'geo:GetPlace',
          'geo:CalculateRoute',
          'geo:CalculateRouteMatrix',
          'geo:BatchUpdateDevicePosition',
          'geo:GetDevicePosition',
          'geo:GetDevicePositionHistory',
          'geo:BatchGetDevicePosition',
          'geo:ListDevicePositions',
        ],
        resources: [
          `arn:aws:geo:eu-north-1:160343708363:place-index/${locationResources.placeIndexName}`,
          `arn:aws:geo:eu-north-1:160343708363:route-calculator/${locationResources.routeCalculatorName}`,
          `arn:aws:geo:eu-north-1:160343708363:tracker/${locationResources.trackerName}`,
        ],
      })
    );

    // S3 permissions
    lambdaExecutionRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject', 's3:ListBucket'],
        resources: [assetsBucket.bucketArn, `${assetsBucket.bucketArn}/*`],
      })
    );

    // SNS/Pinpoint permissions for notifications
    lambdaExecutionRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['sns:Publish', 'mobiletargeting:SendMessages', 'mobiletargeting:SendUsersMessages'],
        resources: ['*'],
      })
    );

    // =====================================================
    // LAMBDA FUNCTIONS
    // =====================================================

    // Auth Lambda
    const authLambda = new lambda.Function(this, 'AuthLambda', {
      ...commonLambdaProps,
      functionName: 'jeeny-auth',
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambdas/auth')),
      role: lambdaExecutionRole,
      description: 'Handles authentication operations',
    });

    // Users Lambda
    const usersLambda = new lambda.Function(this, 'UsersLambda', {
      ...commonLambdaProps,
      functionName: 'jeeny-users',
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambdas/users')),
      role: lambdaExecutionRole,
      description: 'Handles user CRUD operations',
    });

    // Rides Lambda
    const ridesLambda = new lambda.Function(this, 'RidesLambda', {
      ...commonLambdaProps,
      functionName: 'jeeny-rides',
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambdas/rides')),
      role: lambdaExecutionRole,
      description: 'Handles ride operations',
      timeout: cdk.Duration.seconds(60),
    });

    // Drivers Lambda
    const driversLambda = new lambda.Function(this, 'DriversLambda', {
      ...commonLambdaProps,
      functionName: 'jeeny-drivers',
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambdas/drivers')),
      role: lambdaExecutionRole,
      description: 'Handles driver operations',
    });

    // Location Lambda
    const locationLambda = new lambda.Function(this, 'LocationLambda', {
      ...commonLambdaProps,
      functionName: 'jeeny-location',
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambdas/location')),
      role: lambdaExecutionRole,
      description: 'Handles location and tracking operations',
    });

    // Payments Lambda
    const paymentsLambda = new lambda.Function(this, 'PaymentsLambda', {
      ...commonLambdaProps,
      functionName: 'jeeny-payments',
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambdas/payments')),
      role: lambdaExecutionRole,
      description: 'Handles payment operations',
    });

    // Notifications Lambda
    const notificationsLambda = new lambda.Function(this, 'NotificationsLambda', {
      ...commonLambdaProps,
      functionName: 'jeeny-notifications',
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambdas/notifications')),
      role: lambdaExecutionRole,
      description: 'Handles notification operations',
    });

    // Chat Lambda
    const chatLambda = new lambda.Function(this, 'ChatLambda', {
      ...commonLambdaProps,
      functionName: 'jeeny-chat',
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambdas/chat')),
      role: lambdaExecutionRole,
      description: 'Handles chat operations',
    });

    // Support Lambda
    const supportLambda = new lambda.Function(this, 'SupportLambda', {
      ...commonLambdaProps,
      functionName: 'jeeny-support',
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambdas/support')),
      role: lambdaExecutionRole,
      description: 'Handles support ticket operations',
    });

    // Promotions Lambda
    const promotionsLambda = new lambda.Function(this, 'PromotionsLambda', {
      ...commonLambdaProps,
      functionName: 'jeeny-promotions',
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambdas/promotions')),
      role: lambdaExecutionRole,
      description: 'Handles promotions and discounts',
    });

    // Admin Lambda
    const adminLambda = new lambda.Function(this, 'AdminLambda', {
      ...commonLambdaProps,
      functionName: 'jeeny-admin',
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambdas/admin')),
      role: lambdaExecutionRole,
      description: 'Handles admin operations',
    });

    // Analytics Lambda
    const analyticsLambda = new lambda.Function(this, 'AnalyticsLambda', {
      ...commonLambdaProps,
      functionName: 'jeeny-analytics',
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambdas/analytics')),
      role: lambdaExecutionRole,
      description: 'Handles analytics and reporting',
    });

    // WebSocket Handler Lambda
    const webSocketHandlerLambda = new lambda.Function(this, 'WebSocketHandlerLambda', {
      ...commonLambdaProps,
      functionName: 'jeeny-websocket-handler',
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambdas/websocket')),
      role: lambdaExecutionRole,
      description: 'Handles WebSocket connections and messages',
    });

    // =====================================================
    // REST API
    // =====================================================

    // Create REST API
    this.restApi = new apigateway.RestApi(this, 'JeenyRestApi', {
      restApiName: 'jeeny-api',
      description: 'Jeeny Taxi Platform REST API',
      deployOptions: {
        stageName: 'v1',
        throttlingBurstLimit: 1000,
        throttlingRateLimit: 500,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
          'X-Amz-User-Agent',
          'Accept-Language',
        ],
        allowCredentials: true,
      },
      cloudWatchRole: true,
    });

    this.restApiUrl = this.restApi.url;

    // Cognito Authorizer
    const cognitoAuthorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
      authorizerName: 'jeeny-cognito-authorizer',
      cognitoUserPools: [userPool],
      identitySource: 'method.request.header.Authorization',
    });

    // Request validator
    const requestValidator = new apigateway.RequestValidator(this, 'RequestValidator', {
      restApi: this.restApi,
      requestValidatorName: 'jeeny-request-validator',
      validateRequestBody: true,
      validateRequestParameters: true,
    });

    // =====================================================
    // API RESOURCES AND METHODS
    // =====================================================

    // Helper function to add resource with methods
    const addApiResource = (
      parentResource: apigateway.IResource,
      pathPart: string,
      lambdaFn: lambda.IFunction,
      methods: string[],
      requireAuth: boolean = true
    ) => {
      const resource = parentResource.addResource(pathPart);
      const integration = new apigateway.LambdaIntegration(lambdaFn, {
        proxy: true,
      });

      methods.forEach((method) => {
        resource.addMethod(method, integration, {
          authorizer: requireAuth ? cognitoAuthorizer : undefined,
          authorizationType: requireAuth ? apigateway.AuthorizationType.COGNITO : apigateway.AuthorizationType.NONE,
        });
      });

      return resource;
    };

    // ----- AUTH -----
    const authResource = this.restApi.root.addResource('auth');
    const authIntegration = new apigateway.LambdaIntegration(authLambda, { proxy: true });

    // Public auth endpoints
    authResource.addResource('register').addMethod('POST', authIntegration);
    authResource.addResource('verify-otp').addMethod('POST', authIntegration);
    authResource.addResource('resend-otp').addMethod('POST', authIntegration);
    authResource.addResource('login').addMethod('POST', authIntegration);
    authResource.addResource('refresh-token').addMethod('POST', authIntegration);

    // Protected auth endpoints
    const authLogout = authResource.addResource('logout');
    authLogout.addMethod('POST', authIntegration, {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // ----- USERS -----
    const usersResource = addApiResource(this.restApi.root, 'users', usersLambda, ['GET', 'POST']);
    const userByIdResource = addApiResource(usersResource, '{userId}', usersLambda, ['GET', 'PUT', 'DELETE']);
    addApiResource(userByIdResource, 'profile', usersLambda, ['GET', 'PUT']);
    addApiResource(userByIdResource, 'wallet', usersLambda, ['GET']);
    addApiResource(userByIdResource, 'saved-places', usersLambda, ['GET', 'POST']);
    addApiResource(userByIdResource, 'ride-history', usersLambda, ['GET']);

    // Me endpoint (current user)
    const meResource = this.restApi.root.addResource('me');
    const meIntegration = new apigateway.LambdaIntegration(usersLambda, { proxy: true });
    meResource.addMethod('GET', meIntegration, {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
    meResource.addMethod('PUT', meIntegration, {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // ----- DRIVERS -----
    const driversResource = addApiResource(this.restApi.root, 'drivers', driversLambda, ['GET', 'POST']);
    const driverByIdResource = addApiResource(driversResource, '{driverId}', driversLambda, ['GET', 'PUT']);
    addApiResource(driverByIdResource, 'status', driversLambda, ['GET', 'PUT']);
    addApiResource(driverByIdResource, 'location', driversLambda, ['GET', 'PUT']);
    addApiResource(driverByIdResource, 'earnings', driversLambda, ['GET']);
    addApiResource(driverByIdResource, 'vehicle', driversLambda, ['GET', 'PUT']);
    addApiResource(driverByIdResource, 'documents', driversLambda, ['GET', 'POST']);
    addApiResource(driverByIdResource, 'rating', driversLambda, ['GET']);
    addApiResource(driversResource, 'nearby', driversLambda, ['GET']);
    addApiResource(driversResource, 'online', driversLambda, ['GET']);

    // ----- RIDES -----
    const ridesResource = addApiResource(this.restApi.root, 'rides', ridesLambda, ['GET', 'POST']);
    const rideByIdResource = addApiResource(ridesResource, '{rideId}', ridesLambda, ['GET', 'PUT']);
    addApiResource(rideByIdResource, 'accept', ridesLambda, ['POST']);
    addApiResource(rideByIdResource, 'reject', ridesLambda, ['POST']);
    addApiResource(rideByIdResource, 'start', ridesLambda, ['POST']);
    addApiResource(rideByIdResource, 'complete', ridesLambda, ['POST']);
    addApiResource(rideByIdResource, 'cancel', ridesLambda, ['POST']);
    addApiResource(rideByIdResource, 'rate', ridesLambda, ['POST']);
    addApiResource(rideByIdResource, 'tip', ridesLambda, ['POST']);
    addApiResource(rideByIdResource, 'route', ridesLambda, ['GET']);
    addApiResource(rideByIdResource, 'receipt', ridesLambda, ['GET']);

    // Ride estimates
    addApiResource(ridesResource, 'estimate', ridesLambda, ['POST']);
    addApiResource(ridesResource, 'current', ridesLambda, ['GET']);

    // ----- LOCATION -----
    const locationResource = addApiResource(this.restApi.root, 'location', locationLambda, ['GET']);
    addApiResource(locationResource, 'search', locationLambda, ['GET']);
    addApiResource(locationResource, 'reverse-geocode', locationLambda, ['GET']);
    addApiResource(locationResource, 'route', locationLambda, ['POST']);
    addApiResource(locationResource, 'autocomplete', locationLambda, ['GET']);
    addApiResource(locationResource, 'place', locationLambda, ['GET']);
    addApiResource(locationResource, 'eta', locationLambda, ['POST']);

    // ----- PAYMENTS -----
    const paymentsResource = addApiResource(this.restApi.root, 'payments', paymentsLambda, ['GET', 'POST']);
    const paymentByIdResource = addApiResource(paymentsResource, '{paymentId}', paymentsLambda, ['GET']);
    addApiResource(paymentsResource, 'methods', paymentsLambda, ['GET', 'POST']);
    addApiResource(paymentsResource, 'wallet', paymentsLambda, ['GET']);
    addApiResource(paymentsResource, 'wallet/topup', paymentsLambda, ['POST']);
    addApiResource(paymentsResource, 'wallet/withdraw', paymentsLambda, ['POST']);
    addApiResource(paymentsResource, 'history', paymentsLambda, ['GET']);

    // Payment providers (Bankily, Sedad, Masrvi)
    const providersResource = paymentsResource.addResource('providers');
    addApiResource(providersResource, 'bankily', paymentsLambda, ['POST']);
    addApiResource(providersResource, 'sedad', paymentsLambda, ['POST']);
    addApiResource(providersResource, 'masrvi', paymentsLambda, ['POST']);

    // ----- NOTIFICATIONS -----
    const notificationsResource = addApiResource(this.restApi.root, 'notifications', notificationsLambda, ['GET']);
    const notificationByIdResource = addApiResource(
      notificationsResource,
      '{notificationId}',
      notificationsLambda,
      ['GET', 'DELETE']
    );
    addApiResource(notificationByIdResource, 'read', notificationsLambda, ['PUT']);
    addApiResource(notificationsResource, 'read-all', notificationsLambda, ['PUT']);
    addApiResource(notificationsResource, 'settings', notificationsLambda, ['GET', 'PUT']);
    addApiResource(notificationsResource, 'device-token', notificationsLambda, ['POST', 'DELETE']);

    // ----- CHAT -----
    const chatResource = addApiResource(this.restApi.root, 'chat', chatLambda, ['GET']);
    const conversationResource = addApiResource(chatResource, 'conversations', chatLambda, ['GET', 'POST']);
    const conversationByIdResource = addApiResource(conversationResource, '{conversationId}', chatLambda, ['GET']);
    addApiResource(conversationByIdResource, 'messages', chatLambda, ['GET', 'POST']);

    // ----- SUPPORT -----
    const supportResource = addApiResource(this.restApi.root, 'support', supportLambda, ['GET']);
    addApiResource(supportResource, 'tickets', supportLambda, ['GET', 'POST']);
    const ticketByIdResource = addApiResource(supportResource, 'tickets/{ticketId}', supportLambda, ['GET', 'PUT']);
    addApiResource(ticketByIdResource, 'messages', supportLambda, ['GET', 'POST']);
    addApiResource(supportResource, 'faq', supportLambda, ['GET'], false);
    addApiResource(supportResource, 'contact', supportLambda, ['POST'], false);

    // ----- PROMOTIONS -----
    const promotionsResource = addApiResource(this.restApi.root, 'promotions', promotionsLambda, ['GET']);
    addApiResource(promotionsResource, '{promotionId}', promotionsLambda, ['GET']);
    addApiResource(promotionsResource, 'apply', promotionsLambda, ['POST']);
    addApiResource(promotionsResource, 'validate', promotionsLambda, ['POST']);

    // ----- ADMIN -----
    const adminResource = addApiResource(this.restApi.root, 'admin', adminLambda, ['GET']);

    // Admin - Dashboard
    addApiResource(adminResource, 'dashboard', adminLambda, ['GET']);
    addApiResource(adminResource, 'stats', adminLambda, ['GET']);

    // Admin - Users Management
    const adminUsersResource = addApiResource(adminResource, 'users', adminLambda, ['GET', 'POST']);
    const adminUserByIdResource = addApiResource(adminUsersResource, '{userId}', adminLambda, ['GET', 'PUT', 'DELETE']);
    addApiResource(adminUserByIdResource, 'suspend', adminLambda, ['POST']);
    addApiResource(adminUserByIdResource, 'activate', adminLambda, ['POST']);

    // Admin - Drivers Management
    const adminDriversResource = addApiResource(adminResource, 'drivers', adminLambda, ['GET']);
    const adminDriverByIdResource = addApiResource(adminDriversResource, '{driverId}', adminLambda, ['GET', 'PUT']);
    addApiResource(adminDriverByIdResource, 'verify', adminLambda, ['POST']);
    addApiResource(adminDriverByIdResource, 'reject', adminLambda, ['POST']);
    addApiResource(adminDriversResource, 'pending', adminLambda, ['GET']);

    // Admin - Rides Management
    addApiResource(adminResource, 'rides', adminLambda, ['GET']);
    addApiResource(adminResource, 'rides/{rideId}', adminLambda, ['GET']);

    // Admin - Transactions
    addApiResource(adminResource, 'transactions', adminLambda, ['GET']);

    // Admin - Promotions
    const adminPromotionsResource = addApiResource(adminResource, 'promotions', adminLambda, ['GET', 'POST']);
    addApiResource(adminPromotionsResource, '{promotionId}', adminLambda, ['GET', 'PUT', 'DELETE']);

    // Admin - Settings
    addApiResource(adminResource, 'settings', adminLambda, ['GET', 'PUT']);
    addApiResource(adminResource, 'pricing', adminLambda, ['GET', 'PUT']);
    addApiResource(adminResource, 'cities', adminLambda, ['GET', 'POST']);
    addApiResource(adminResource, 'vehicle-types', adminLambda, ['GET', 'POST']);

    // Admin - Support Tickets
    addApiResource(adminResource, 'support-tickets', adminLambda, ['GET']);

    // ----- ANALYTICS -----
    const analyticsResource = addApiResource(this.restApi.root, 'analytics', analyticsLambda, ['GET']);
    addApiResource(analyticsResource, 'rides', analyticsLambda, ['GET']);
    addApiResource(analyticsResource, 'revenue', analyticsLambda, ['GET']);
    addApiResource(analyticsResource, 'users', analyticsLambda, ['GET']);
    addApiResource(analyticsResource, 'drivers', analyticsLambda, ['GET']);
    addApiResource(analyticsResource, 'heatmap', analyticsLambda, ['GET']);
    addApiResource(analyticsResource, 'export', analyticsLambda, ['POST']);

    // =====================================================
    // WEBSOCKET API
    // =====================================================

    // Create WebSocket API
    this.webSocketApi = new apigatewayv2.WebSocketApi(this, 'JeenyWebSocketApi', {
      apiName: 'jeeny-websocket-api',
      description: 'Jeeny Real-time WebSocket API',
      connectRouteOptions: {
        integration: new apigatewayv2Integrations.WebSocketLambdaIntegration(
          'ConnectIntegration',
          webSocketHandlerLambda
        ),
      },
      disconnectRouteOptions: {
        integration: new apigatewayv2Integrations.WebSocketLambdaIntegration(
          'DisconnectIntegration',
          webSocketHandlerLambda
        ),
      },
      defaultRouteOptions: {
        integration: new apigatewayv2Integrations.WebSocketLambdaIntegration(
          'DefaultIntegration',
          webSocketHandlerLambda
        ),
      },
    });

    // WebSocket stage
    const webSocketStage = new apigatewayv2.WebSocketStage(this, 'JeenyWebSocketStage', {
      webSocketApi: this.webSocketApi,
      stageName: 'v1',
      autoDeploy: true,
    });

    this.webSocketApiUrl = webSocketStage.url;

    // Add custom routes for WebSocket
    this.webSocketApi.addRoute('sendMessage', {
      integration: new apigatewayv2Integrations.WebSocketLambdaIntegration(
        'SendMessageIntegration',
        webSocketHandlerLambda
      ),
    });

    this.webSocketApi.addRoute('updateLocation', {
      integration: new apigatewayv2Integrations.WebSocketLambdaIntegration(
        'UpdateLocationIntegration',
        webSocketHandlerLambda
      ),
    });

    this.webSocketApi.addRoute('rideUpdate', {
      integration: new apigatewayv2Integrations.WebSocketLambdaIntegration(
        'RideUpdateIntegration',
        webSocketHandlerLambda
      ),
    });

    this.webSocketApi.addRoute('driverStatus', {
      integration: new apigatewayv2Integrations.WebSocketLambdaIntegration(
        'DriverStatusIntegration',
        webSocketHandlerLambda
      ),
    });

    // Grant WebSocket Lambda permission to manage connections
    webSocketHandlerLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['execute-api:ManageConnections'],
        resources: [
          `arn:aws:execute-api:eu-north-1:160343708363:${this.webSocketApi.apiId}/*`,
        ],
      })
    );

    // Add WebSocket endpoint to Lambda environment
    webSocketHandlerLambda.addEnvironment('WEBSOCKET_ENDPOINT', webSocketStage.callbackUrl);

    // =====================================================
    // API GATEWAY USAGE PLANS & API KEYS
    // =====================================================

    // Create usage plan for rate limiting
    const usagePlan = this.restApi.addUsagePlan('JeenyUsagePlan', {
      name: 'jeeny-standard-plan',
      description: 'Standard usage plan for Jeeny API',
      throttle: {
        rateLimit: 1000,
        burstLimit: 2000,
      },
      quota: {
        limit: 100000,
        period: apigateway.Period.MONTH,
      },
    });

    // API Key for external integrations
    const apiKey = this.restApi.addApiKey('JeenyApiKey', {
      apiKeyName: 'jeeny-api-key',
      description: 'API Key for external integrations',
    });

    usagePlan.addApiKey(apiKey);
    usagePlan.addApiStage({
      stage: this.restApi.deploymentStage,
    });

    // =====================================================
    // STACK OUTPUTS
    // =====================================================

    // REST API URL
    new cdk.CfnOutput(this, 'RestApiUrl', {
      value: this.restApi.url,
      description: 'REST API URL',
      exportName: 'JeenyRestApiUrl',
    });

    // REST API ID
    new cdk.CfnOutput(this, 'RestApiId', {
      value: this.restApi.restApiId,
      description: 'REST API ID',
      exportName: 'JeenyRestApiId',
    });

    // WebSocket API URL
    new cdk.CfnOutput(this, 'WebSocketApiUrl', {
      value: webSocketStage.url,
      description: 'WebSocket API URL',
      exportName: 'JeenyWebSocketApiUrl',
    });

    // WebSocket API ID
    new cdk.CfnOutput(this, 'WebSocketApiId', {
      value: this.webSocketApi.apiId,
      description: 'WebSocket API ID',
      exportName: 'JeenyWebSocketApiId',
    });

    // WebSocket Callback URL
    new cdk.CfnOutput(this, 'WebSocketCallbackUrl', {
      value: webSocketStage.callbackUrl,
      description: 'WebSocket Callback URL for sending messages',
      exportName: 'JeenyWebSocketCallbackUrl',
    });

    // API Key ID
    new cdk.CfnOutput(this, 'ApiKeyId', {
      value: apiKey.keyId,
      description: 'API Key ID',
      exportName: 'JeenyApiKeyId',
    });

    // Add tags to all resources
    cdk.Tags.of(this).add('Stack', 'API');
    cdk.Tags.of(this).add('Service', 'APIGateway');
  }
}
