/**
 * Jeeny Database Stack - DynamoDB Tables
 *
 * Creates DynamoDB tables for the Jeeny taxi booking platform.
 * Using DynamoDB for scalability, low latency, and serverless operation.
 *
 * Tables:
 * - Users: All user types (clients, drivers, admins, employees)
 * - Rides: Ride requests and history
 * - Transactions: Payment transactions
 * - Notifications: Push notification history
 * - Chats: Chat messages between users
 * - Settings: App settings and configurations
 *
 * Region: eu-north-1
 * Account: 160343708363
 */

import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface JeenyDatabaseStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
}

export class JeenyDatabaseStack extends cdk.Stack {
  public readonly tables: {
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

  constructor(scope: Construct, id: string, props: JeenyDatabaseStackProps) {
    super(scope, id, props);

    // =====================================================
    // USERS TABLE
    // =====================================================

    const usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: 'jeeny-users',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING }, // USER#<userId>
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING }, // PROFILE, SETTINGS, etc.
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    // GSI for phone number lookup
    usersTable.addGlobalSecondaryIndex({
      indexName: 'GSI1-PhoneNumber',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING }, // PHONE#<phoneNumber>
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI for email lookup
    usersTable.addGlobalSecondaryIndex({
      indexName: 'GSI2-Email',
      partitionKey: { name: 'GSI2PK', type: dynamodb.AttributeType.STRING }, // EMAIL#<email>
      sortKey: { name: 'GSI2SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI for user role queries
    usersTable.addGlobalSecondaryIndex({
      indexName: 'GSI3-Role',
      partitionKey: { name: 'userRole', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI for city-based driver queries
    usersTable.addGlobalSecondaryIndex({
      indexName: 'GSI4-CityDrivers',
      partitionKey: { name: 'cityId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'driverStatus', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // =====================================================
    // RIDES TABLE
    // =====================================================

    const ridesTable = new dynamodb.Table(this, 'RidesTable', {
      tableName: 'jeeny-rides',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING }, // RIDE#<rideId>
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING }, // DETAILS, TRACKING#<timestamp>, etc.
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      timeToLiveAttribute: 'ttl',
    });

    // GSI for client rides
    ridesTable.addGlobalSecondaryIndex({
      indexName: 'GSI1-ClientRides',
      partitionKey: { name: 'clientId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'requestedAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI for driver rides
    ridesTable.addGlobalSecondaryIndex({
      indexName: 'GSI2-DriverRides',
      partitionKey: { name: 'driverId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'requestedAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI for ride status queries
    ridesTable.addGlobalSecondaryIndex({
      indexName: 'GSI3-Status',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'requestedAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI for city-based ride queries
    ridesTable.addGlobalSecondaryIndex({
      indexName: 'GSI4-CityRides',
      partitionKey: { name: 'cityId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'requestedAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI for ride number lookup
    ridesTable.addGlobalSecondaryIndex({
      indexName: 'GSI5-RideNumber',
      partitionKey: { name: 'rideNumber', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // =====================================================
    // TRANSACTIONS TABLE
    // =====================================================

    const transactionsTable = new dynamodb.Table(this, 'TransactionsTable', {
      tableName: 'jeeny-transactions',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING }, // TXN#<transactionId>
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // GSI for user transactions
    transactionsTable.addGlobalSecondaryIndex({
      indexName: 'GSI1-UserTransactions',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI for ride transactions
    transactionsTable.addGlobalSecondaryIndex({
      indexName: 'GSI2-RideTransactions',
      partitionKey: { name: 'rideId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI for transaction status
    transactionsTable.addGlobalSecondaryIndex({
      indexName: 'GSI3-Status',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // =====================================================
    // NOTIFICATIONS TABLE
    // =====================================================

    const notificationsTable = new dynamodb.Table(this, 'NotificationsTable', {
      tableName: 'jeeny-notifications',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING }, // USER#<userId>
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING }, // NOTIF#<timestamp>#<notifId>
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      timeToLiveAttribute: 'ttl',
    });

    // GSI for unread notifications
    notificationsTable.addGlobalSecondaryIndex({
      indexName: 'GSI1-Unread',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'isReadCreatedAt', type: dynamodb.AttributeType.STRING }, // false#<timestamp>
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // =====================================================
    // CHATS TABLE
    // =====================================================

    const chatsTable = new dynamodb.Table(this, 'ChatsTable', {
      tableName: 'jeeny-chats',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING }, // CONV#<conversationId>
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING }, // MSG#<timestamp>#<msgId>
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      timeToLiveAttribute: 'ttl',
    });

    // GSI for ride conversations
    chatsTable.addGlobalSecondaryIndex({
      indexName: 'GSI1-RideChat',
      partitionKey: { name: 'rideId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI for user conversations
    chatsTable.addGlobalSecondaryIndex({
      indexName: 'GSI2-UserChats',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'lastMessageAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // =====================================================
    // SETTINGS TABLE
    // =====================================================

    const settingsTable = new dynamodb.Table(this, 'SettingsTable', {
      tableName: 'jeeny-settings',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING }, // SETTING, CITY, PRICING, etc.
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // =====================================================
    // LOCATIONS TABLE (Driver real-time locations)
    // =====================================================

    const locationsTable = new dynamodb.Table(this, 'LocationsTable', {
      tableName: 'jeeny-locations',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING }, // DRIVER#<driverId>
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING }, // CURRENT or HISTORY#<timestamp>
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      timeToLiveAttribute: 'ttl',
    });

    // GSI for geohash-based queries (find nearby drivers)
    locationsTable.addGlobalSecondaryIndex({
      indexName: 'GSI1-Geohash',
      partitionKey: { name: 'geohash', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'driverStatus', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI for city online drivers
    locationsTable.addGlobalSecondaryIndex({
      indexName: 'GSI2-CityOnline',
      partitionKey: { name: 'cityId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'isOnlineUpdatedAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // =====================================================
    // VEHICLES TABLE
    // =====================================================

    const vehiclesTable = new dynamodb.Table(this, 'VehiclesTable', {
      tableName: 'jeeny-vehicles',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING }, // VEHICLE#<vehicleId>
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // GSI for driver vehicles
    vehiclesTable.addGlobalSecondaryIndex({
      indexName: 'GSI1-DriverVehicles',
      partitionKey: { name: 'driverId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'isActive', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI for plate number lookup
    vehiclesTable.addGlobalSecondaryIndex({
      indexName: 'GSI2-PlateNumber',
      partitionKey: { name: 'plateNumber', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // =====================================================
    // PROMOTIONS TABLE
    // =====================================================

    const promotionsTable = new dynamodb.Table(this, 'PromotionsTable', {
      tableName: 'jeeny-promotions',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING }, // PROMO#<promoId>
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // GSI for promo code lookup
    promotionsTable.addGlobalSecondaryIndex({
      indexName: 'GSI1-PromoCode',
      partitionKey: { name: 'code', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI for active promotions
    promotionsTable.addGlobalSecondaryIndex({
      indexName: 'GSI2-Active',
      partitionKey: { name: 'isActive', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'validTo', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // =====================================================
    // SUPPORT TICKETS TABLE
    // =====================================================

    const supportTicketsTable = new dynamodb.Table(this, 'SupportTicketsTable', {
      tableName: 'jeeny-support-tickets',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING }, // TICKET#<ticketId>
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // GSI for user tickets
    supportTicketsTable.addGlobalSecondaryIndex({
      indexName: 'GSI1-UserTickets',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI for ticket status
    supportTicketsTable.addGlobalSecondaryIndex({
      indexName: 'GSI2-Status',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'priority', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI for assigned employee
    supportTicketsTable.addGlobalSecondaryIndex({
      indexName: 'GSI3-AssignedTo',
      partitionKey: { name: 'assignedTo', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // =====================================================
    // EXPORT TABLES
    // =====================================================

    this.tables = {
      users: usersTable,
      rides: ridesTable,
      transactions: transactionsTable,
      notifications: notificationsTable,
      chats: chatsTable,
      settings: settingsTable,
      locations: locationsTable,
      vehicles: vehiclesTable,
      promotions: promotionsTable,
      supportTickets: supportTicketsTable,
    };

    // =====================================================
    // STACK OUTPUTS
    // =====================================================

    // Users Table
    new cdk.CfnOutput(this, 'UsersTableName', {
      value: usersTable.tableName,
      description: 'Users DynamoDB table name',
      exportName: 'JeenyUsersTableName',
    });

    new cdk.CfnOutput(this, 'UsersTableArn', {
      value: usersTable.tableArn,
      description: 'Users DynamoDB table ARN',
      exportName: 'JeenyUsersTableArn',
    });

    // Rides Table
    new cdk.CfnOutput(this, 'RidesTableName', {
      value: ridesTable.tableName,
      description: 'Rides DynamoDB table name',
      exportName: 'JeenyRidesTableName',
    });

    new cdk.CfnOutput(this, 'RidesTableArn', {
      value: ridesTable.tableArn,
      description: 'Rides DynamoDB table ARN',
      exportName: 'JeenyRidesTableArn',
    });

    // Transactions Table
    new cdk.CfnOutput(this, 'TransactionsTableName', {
      value: transactionsTable.tableName,
      description: 'Transactions DynamoDB table name',
      exportName: 'JeenyTransactionsTableName',
    });

    // Notifications Table
    new cdk.CfnOutput(this, 'NotificationsTableName', {
      value: notificationsTable.tableName,
      description: 'Notifications DynamoDB table name',
      exportName: 'JeenyNotificationsTableName',
    });

    // Chats Table
    new cdk.CfnOutput(this, 'ChatsTableName', {
      value: chatsTable.tableName,
      description: 'Chats DynamoDB table name',
      exportName: 'JeenyChatsTableName',
    });

    // Settings Table
    new cdk.CfnOutput(this, 'SettingsTableName', {
      value: settingsTable.tableName,
      description: 'Settings DynamoDB table name',
      exportName: 'JeenySettingsTableName',
    });

    // Locations Table
    new cdk.CfnOutput(this, 'LocationsTableName', {
      value: locationsTable.tableName,
      description: 'Locations DynamoDB table name',
      exportName: 'JeenyLocationsTableName',
    });

    // Vehicles Table
    new cdk.CfnOutput(this, 'VehiclesTableName', {
      value: vehiclesTable.tableName,
      description: 'Vehicles DynamoDB table name',
      exportName: 'JeenyVehiclesTableName',
    });

    // Promotions Table
    new cdk.CfnOutput(this, 'PromotionsTableName', {
      value: promotionsTable.tableName,
      description: 'Promotions DynamoDB table name',
      exportName: 'JeenyPromotionsTableName',
    });

    // Support Tickets Table
    new cdk.CfnOutput(this, 'SupportTicketsTableName', {
      value: supportTicketsTable.tableName,
      description: 'Support Tickets DynamoDB table name',
      exportName: 'JeenySupportTicketsTableName',
    });

    // Add tags to all resources
    cdk.Tags.of(this).add('Stack', 'Database');
    cdk.Tags.of(this).add('Service', 'DynamoDB');
  }
}
