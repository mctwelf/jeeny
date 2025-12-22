/**
 * Jeeny Notification Stack - SNS, Pinpoint, SES
 *
 * Creates notification infrastructure for the Jeeny taxi booking platform.
 *
 * Features:
 * - Push notifications via SNS (iOS/Android)
 * - SMS notifications via Pinpoint (OTP, ride updates)
 * - Email notifications via SES (receipts, support)
 * - Real-time events via EventBridge
 *
 * Region: eu-north-1
 * Account: 160343708363
 */

import * as cdk from 'aws-cdk-lib';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as pinpoint from 'aws-cdk-lib/aws-pinpoint';
import * as ses from 'aws-cdk-lib/aws-ses';
import * as events from 'aws-cdk-lib/aws-events';
import { Construct } from 'constructs';

export interface JeenyNotificationStackProps extends cdk.StackProps {
  // Add any custom props here
}

export class JeenyNotificationStack extends cdk.Stack {
  public readonly rideRequestTopic: sns.ITopic;
  public readonly rideUpdatesTopic: sns.ITopic;
  public readonly paymentTopic: sns.ITopic;
  public readonly notificationsTopic: sns.ITopic;
  public readonly systemAlertsTopic: sns.ITopic;
  public readonly pinpointApp: pinpoint.CfnApp;
  public readonly eventBus: events.IEventBus;

  constructor(scope: Construct, id: string, props?: JeenyNotificationStackProps) {
    super(scope, id, props);

    // =====================================================
    // SNS TOPICS
    // =====================================================

    // Dead Letter Queue for failed messages
    const dlq = new sqs.Queue(this, 'NotificationDLQ', {
      queueName: 'jeeny-notification-dlq',
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.SQS_MANAGED,
    });

    // Ride Request Topic - For notifying drivers of new ride requests
    this.rideRequestTopic = new sns.Topic(this, 'RideRequestTopic', {
      topicName: 'jeeny-ride-requests',
      displayName: 'Jeeny Ride Requests',
      fifo: false,
    });

    // Ride Updates Topic - For ride status updates (accepted, arrived, started, completed)
    this.rideUpdatesTopic = new sns.Topic(this, 'RideUpdatesTopic', {
      topicName: 'jeeny-ride-updates',
      displayName: 'Jeeny Ride Updates',
      fifo: false,
    });

    // Payment Topic - For payment notifications (success, failure, refunds)
    this.paymentTopic = new sns.Topic(this, 'PaymentTopic', {
      topicName: 'jeeny-payments',
      displayName: 'Jeeny Payments',
      fifo: false,
    });

    // General Notifications Topic - For push notifications to users
    this.notificationsTopic = new sns.Topic(this, 'NotificationsTopic', {
      topicName: 'jeeny-notifications',
      displayName: 'Jeeny Notifications',
      fifo: false,
    });

    // System Alerts Topic - For system monitoring and alerts
    this.systemAlertsTopic = new sns.Topic(this, 'SystemAlertsTopic', {
      topicName: 'jeeny-system-alerts',
      displayName: 'Jeeny System Alerts',
      fifo: false,
    });

    // =====================================================
    // SQS QUEUES (for processing notifications)
    // =====================================================

    // Push Notification Queue
    const pushNotificationQueue = new sqs.Queue(this, 'PushNotificationQueue', {
      queueName: 'jeeny-push-notifications',
      visibilityTimeout: cdk.Duration.seconds(60),
      retentionPeriod: cdk.Duration.days(7),
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      deadLetterQueue: {
        queue: dlq,
        maxReceiveCount: 3,
      },
    });

    // SMS Notification Queue
    const smsNotificationQueue = new sqs.Queue(this, 'SMSNotificationQueue', {
      queueName: 'jeeny-sms-notifications',
      visibilityTimeout: cdk.Duration.seconds(60),
      retentionPeriod: cdk.Duration.days(7),
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      deadLetterQueue: {
        queue: dlq,
        maxReceiveCount: 3,
      },
    });

    // Email Notification Queue
    const emailNotificationQueue = new sqs.Queue(this, 'EmailNotificationQueue', {
      queueName: 'jeeny-email-notifications',
      visibilityTimeout: cdk.Duration.seconds(60),
      retentionPeriod: cdk.Duration.days(7),
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      deadLetterQueue: {
        queue: dlq,
        maxReceiveCount: 3,
      },
    });

    // Subscribe queues to topics
    this.notificationsTopic.addSubscription(
      new subscriptions.SqsSubscription(pushNotificationQueue, {
        filterPolicy: {
          channel: sns.SubscriptionFilter.stringFilter({
            allowlist: ['push', 'all'],
          }),
        },
      })
    );

    this.notificationsTopic.addSubscription(
      new subscriptions.SqsSubscription(smsNotificationQueue, {
        filterPolicy: {
          channel: sns.SubscriptionFilter.stringFilter({
            allowlist: ['sms', 'all'],
          }),
        },
      })
    );

    this.notificationsTopic.addSubscription(
      new subscriptions.SqsSubscription(emailNotificationQueue, {
        filterPolicy: {
          channel: sns.SubscriptionFilter.stringFilter({
            allowlist: ['email', 'all'],
          }),
        },
      })
    );

    // =====================================================
    // PINPOINT APPLICATION (for SMS and Push)
    // =====================================================

    // Create Pinpoint Application
    this.pinpointApp = new pinpoint.CfnApp(this, 'JeenyPinpointApp', {
      name: 'jeeny-app',
      tags: {
        Project: 'Jeeny',
        Environment: 'production',
        Service: 'Notification',
      },
    });

    // Enable SMS Channel
    const smsChannel = new pinpoint.CfnSMSChannel(this, 'JeenySMSChannel', {
      applicationId: this.pinpointApp.ref,
      enabled: true,
      // SenderId will need to be configured manually or via support request
    });

    // Enable Email Channel (for transactional emails)
    const emailChannel = new pinpoint.CfnEmailChannel(this, 'JeenyEmailChannel', {
      applicationId: this.pinpointApp.ref,
      enabled: true,
      fromAddress: 'noreply@jeeny.mr',
      identity: 'arn:aws:ses:eu-north-1:160343708363:identity/jeeny.mr',
    });

    // =====================================================
    // EVENTBRIDGE (for event-driven architecture)
    // =====================================================

    // Create custom event bus for Jeeny events
    this.eventBus = new events.EventBus(this, 'JeenyEventBus', {
      eventBusName: 'jeeny-events',
    });

    // Archive events for replay capability
    new events.CfnArchive(this, 'JeenyEventsArchive', {
      sourceName: this.eventBus.eventBusName,
      archiveName: 'jeeny-events-archive',
      description: 'Archive for Jeeny events',
      retentionDays: 30,
    });

    // Rule for ride events
    const rideEventsRule = new events.Rule(this, 'RideEventsRule', {
      eventBus: this.eventBus,
      ruleName: 'jeeny-ride-events',
      description: 'Capture all ride-related events',
      eventPattern: {
        source: ['jeeny.rides'],
        detailType: [
          'RideRequested',
          'RideAccepted',
          'RideCancelled',
          'DriverArrived',
          'RideStarted',
          'RideCompleted',
        ],
      },
    });

    // Rule for payment events
    const paymentEventsRule = new events.Rule(this, 'PaymentEventsRule', {
      eventBus: this.eventBus,
      ruleName: 'jeeny-payment-events',
      description: 'Capture all payment-related events',
      eventPattern: {
        source: ['jeeny.payments'],
        detailType: [
          'PaymentInitiated',
          'PaymentCompleted',
          'PaymentFailed',
          'RefundInitiated',
          'RefundCompleted',
        ],
      },
    });

    // Rule for user events
    const userEventsRule = new events.Rule(this, 'UserEventsRule', {
      eventBus: this.eventBus,
      ruleName: 'jeeny-user-events',
      description: 'Capture all user-related events',
      eventPattern: {
        source: ['jeeny.users'],
        detailType: [
          'UserRegistered',
          'UserVerified',
          'DriverApproved',
          'DriverRejected',
          'UserSuspended',
        ],
      },
    });

    // =====================================================
    // IAM POLICIES
    // =====================================================

    // Policy for Lambda to send notifications
    const notificationSenderPolicy = new iam.PolicyDocument({
      statements: [
        // SNS permissions
        new iam.PolicyStatement({
          sid: 'SNSPublish',
          effect: iam.Effect.ALLOW,
          actions: ['sns:Publish'],
          resources: [
            this.rideRequestTopic.topicArn,
            this.rideUpdatesTopic.topicArn,
            this.paymentTopic.topicArn,
            this.notificationsTopic.topicArn,
          ],
        }),
        // Pinpoint permissions
        new iam.PolicyStatement({
          sid: 'PinpointSend',
          effect: iam.Effect.ALLOW,
          actions: [
            'mobiletargeting:SendMessages',
            'mobiletargeting:SendUsersMessages',
            'mobiletargeting:GetEndpoint',
            'mobiletargeting:UpdateEndpoint',
            'mobiletargeting:DeleteEndpoint',
          ],
          resources: [
            `arn:aws:mobiletargeting:eu-north-1:160343708363:apps/${this.pinpointApp.ref}/*`,
          ],
        }),
        // SES permissions
        new iam.PolicyStatement({
          sid: 'SESSend',
          effect: iam.Effect.ALLOW,
          actions: [
            'ses:SendEmail',
            'ses:SendRawEmail',
            'ses:SendTemplatedEmail',
          ],
          resources: ['*'],
          conditions: {
            StringEquals: {
              'ses:FromAddress': 'noreply@jeeny.mr',
            },
          },
        }),
        // EventBridge permissions
        new iam.PolicyStatement({
          sid: 'EventBridgePut',
          effect: iam.Effect.ALLOW,
          actions: ['events:PutEvents'],
          resources: [this.eventBus.eventBusArn],
        }),
      ],
    });

    // =====================================================
    // SNS PLATFORM APPLICATIONS (Mobile Push)
    // =====================================================

    // Note: Platform applications for iOS (APNS) and Android (FCM)
    // need to be created manually or with credentials:
    //
    // iOS: Requires Apple Push Notification service (APNs) credentials
    // Android: Requires Firebase Cloud Messaging (FCM) API key
    //
    // Create them via console or CLI:
    // aws sns create-platform-application \
    //   --name jeeny-ios \
    //   --platform APNS_SANDBOX \
    //   --attributes PlatformCredential=<p12-key>,PlatformPrincipal=<certificate>
    //
    // aws sns create-platform-application \
    //   --name jeeny-android \
    //   --platform GCM \
    //   --attributes PlatformCredential=<fcm-api-key>

    // =====================================================
    // STACK OUTPUTS
    // =====================================================

    // SNS Topics
    new cdk.CfnOutput(this, 'RideRequestTopicArn', {
      value: this.rideRequestTopic.topicArn,
      description: 'Ride Request SNS Topic ARN',
      exportName: 'JeenyRideRequestTopicArn',
    });

    new cdk.CfnOutput(this, 'RideUpdatesTopicArn', {
      value: this.rideUpdatesTopic.topicArn,
      description: 'Ride Updates SNS Topic ARN',
      exportName: 'JeenyRideUpdatesTopicArn',
    });

    new cdk.CfnOutput(this, 'PaymentTopicArn', {
      value: this.paymentTopic.topicArn,
      description: 'Payment SNS Topic ARN',
      exportName: 'JeenyPaymentTopicArn',
    });

    new cdk.CfnOutput(this, 'NotificationsTopicArn', {
      value: this.notificationsTopic.topicArn,
      description: 'Notifications SNS Topic ARN',
      exportName: 'JeenyNotificationsTopicArn',
    });

    new cdk.CfnOutput(this, 'SystemAlertsTopicArn', {
      value: this.systemAlertsTopic.topicArn,
      description: 'System Alerts SNS Topic ARN',
      exportName: 'JeenySystemAlertsTopicArn',
    });

    // SQS Queues
    new cdk.CfnOutput(this, 'PushNotificationQueueUrl', {
      value: pushNotificationQueue.queueUrl,
      description: 'Push Notification SQS Queue URL',
      exportName: 'JeenyPushNotificationQueueUrl',
    });

    new cdk.CfnOutput(this, 'PushNotificationQueueArn', {
      value: pushNotificationQueue.queueArn,
      description: 'Push Notification SQS Queue ARN',
      exportName: 'JeenyPushNotificationQueueArn',
    });

    new cdk.CfnOutput(this, 'SMSNotificationQueueUrl', {
      value: smsNotificationQueue.queueUrl,
      description: 'SMS Notification SQS Queue URL',
      exportName: 'JeenySMSNotificationQueueUrl',
    });

    new cdk.CfnOutput(this, 'EmailNotificationQueueUrl', {
      value: emailNotificationQueue.queueUrl,
      description: 'Email Notification SQS Queue URL',
      exportName: 'JeenyEmailNotificationQueueUrl',
    });

    // Pinpoint
    new cdk.CfnOutput(this, 'PinpointAppId', {
      value: this.pinpointApp.ref,
      description: 'Pinpoint Application ID',
      exportName: 'JeenyPinpointAppId',
    });

    // EventBridge
    new cdk.CfnOutput(this, 'EventBusName', {
      value: this.eventBus.eventBusName,
      description: 'EventBridge Event Bus Name',
      exportName: 'JeenyEventBusName',
    });

    new cdk.CfnOutput(this, 'EventBusArn', {
      value: this.eventBus.eventBusArn,
      description: 'EventBridge Event Bus ARN',
      exportName: 'JeenyEventBusArn',
    });

    // DLQ
    new cdk.CfnOutput(this, 'DLQUrl', {
      value: dlq.queueUrl,
      description: 'Dead Letter Queue URL',
      exportName: 'JeenyNotificationDLQUrl',
    });

    // Add tags to all resources
    cdk.Tags.of(this).add('Stack', 'Notification');
    cdk.Tags.of(this).add('Service', 'SNS-Pinpoint-SES');
  }
}
