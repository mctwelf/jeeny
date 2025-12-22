#!/usr/bin/env node
/**
 * Jeeny Infrastructure - Main CDK Entry Point
 *
 * This is the main entry point for the Jeeny AWS CDK infrastructure.
 * It creates all the necessary AWS resources for the taxi booking platform.
 *
 * AWS Account: 160343708363
 * Region: eu-north-1
 */

import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { JeenyVpcStack } from './stacks/vpc-stack';
import { JeenyAuthStack } from './stacks/auth-stack';
import { JeenyDatabaseStack } from './stacks/database-stack';
import { JeenyStorageStack } from './stacks/storage-stack';
import { JeenyApiStack } from './stacks/api-stack';
import { JeenyLocationStack } from './stacks/location-stack';
import { JeenyNotificationStack } from './stacks/notification-stack';

// Environment configuration
const env: cdk.Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT || '160343708363',
  region: process.env.CDK_DEFAULT_REGION || 'eu-north-1',
};

// App configuration
const appName = 'jeeny';
const environment = process.env.ENVIRONMENT || 'dev';

// Create the CDK app
const app = new cdk.App();

// Common tags for all resources
const commonTags = {
  Project: 'Jeeny',
  Environment: environment,
  ManagedBy: 'CDK',
  Application: 'TaxiBooking',
};

// Stack naming convention
const stackName = (name: string) => `${appName}-${name}-${environment}`;

/**
 * VPC Stack - Network infrastructure
 * Creates VPC, subnets, NAT gateways, and security groups
 */
const vpcStack = new JeenyVpcStack(app, stackName('vpc'), {
  env,
  description: 'Jeeny VPC and networking infrastructure',
  tags: commonTags,
});

/**
 * Auth Stack - Cognito for user authentication
 * Creates Cognito User Pool with phone/OTP authentication
 */
const authStack = new JeenyAuthStack(app, stackName('auth'), {
  env,
  description: 'Jeeny authentication infrastructure (Cognito)',
  tags: commonTags,
});

/**
 * Database Stack - RDS PostgreSQL and DynamoDB
 * Creates database resources for persistent storage
 */
const databaseStack = new JeenyDatabaseStack(app, stackName('database'), {
  env,
  vpc: vpcStack.vpc,
  description: 'Jeeny database infrastructure',
  tags: commonTags,
});
databaseStack.addDependency(vpcStack);

/**
 * Storage Stack - S3 buckets for files
 * Creates S3 buckets for user uploads, documents, etc.
 */
const storageStack = new JeenyStorageStack(app, stackName('storage'), {
  env,
  description: 'Jeeny storage infrastructure (S3)',
  tags: commonTags,
});

/**
 * Location Stack - AWS Location Service
 * Creates maps, place indexes, route calculators, and trackers
 */
const locationStack = new JeenyLocationStack(app, stackName('location'), {
  env,
  description: 'Jeeny location services infrastructure',
  tags: commonTags,
});

/**
 * Notification Stack - SNS, Pinpoint, SES
 * Creates notification infrastructure for push, SMS, and email
 */
const notificationStack = new JeenyNotificationStack(app, stackName('notification'), {
  env,
  description: 'Jeeny notification infrastructure',
  tags: commonTags,
});

/**
 * API Stack - API Gateway and Lambda functions
 * Creates REST API, WebSocket API, and Lambda functions
 */
const apiStack = new JeenyApiStack(app, stackName('api'), {
  env,
  vpc: vpcStack.vpc,
  userPool: authStack.userPool,
  userPoolClient: authStack.userPoolClient,
  tables: databaseStack.tables,
  assetsBucket: storageStack.assetsBucket,
  locationResources: {
    mapName: locationStack.mapName,
    placeIndexName: locationStack.placeIndexName,
    routeCalculatorName: locationStack.routeCalculatorName,
    trackerName: locationStack.trackerName,
  },
  description: 'Jeeny API infrastructure',
  tags: commonTags,
});
apiStack.addDependency(vpcStack);
apiStack.addDependency(authStack);
apiStack.addDependency(databaseStack);
apiStack.addDependency(storageStack);
apiStack.addDependency(locationStack);
apiStack.addDependency(notificationStack);

// Output important values
new cdk.CfnOutput(app, 'Environment', { value: environment });
new cdk.CfnOutput(app, 'Region', { value: env.region || 'eu-north-1' });
new cdk.CfnOutput(app, 'AccountId', { value: env.account || '160343708363' });

// Synthesize the app
app.synth();
