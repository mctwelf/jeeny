/**
 * Jeeny VPC Stack - Network Infrastructure
 *
 * Creates the VPC, subnets, NAT gateways, and security groups
 * for the Jeeny taxi booking platform.
 *
 * Region: eu-north-1
 * Account: 160343708363
 */

import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface JeenyVpcStackProps extends cdk.StackProps {
  // Add any custom props here
}

export class JeenyVpcStack extends cdk.Stack {
  public readonly vpc: ec2.IVpc;
  public readonly privateSubnets: ec2.ISubnet[];
  public readonly publicSubnets: ec2.ISubnet[];
  public readonly isolatedSubnets: ec2.ISubnet[];
  public readonly lambdaSecurityGroup: ec2.ISecurityGroup;
  public readonly databaseSecurityGroup: ec2.ISecurityGroup;
  public readonly redisSecurityGroup: ec2.ISecurityGroup;

  constructor(scope: Construct, id: string, props?: JeenyVpcStackProps) {
    super(scope, id, props);

    // Create VPC with 3 AZs for high availability
    this.vpc = new ec2.Vpc(this, 'JeenyVpc', {
      vpcName: 'jeeny-vpc',
      maxAzs: 3,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),

      // Subnet configuration
      subnetConfiguration: [
        {
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
          mapPublicIpOnLaunch: true,
        },
        {
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],

      // NAT Gateway configuration (use 1 for dev, 3 for prod)
      natGateways: 1,

      // Enable DNS support
      enableDnsHostnames: true,
      enableDnsSupport: true,

      // Gateway endpoints for AWS services (free)
      gatewayEndpoints: {
        S3: {
          service: ec2.GatewayVpcEndpointAwsService.S3,
        },
        DynamoDB: {
          service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
        },
      },
    });

    // Store subnet references
    this.privateSubnets = this.vpc.privateSubnets;
    this.publicSubnets = this.vpc.publicSubnets;
    this.isolatedSubnets = this.vpc.isolatedSubnets;

    // Create security group for Lambda functions
    this.lambdaSecurityGroup = new ec2.SecurityGroup(this, 'LambdaSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: 'jeeny-lambda-sg',
      description: 'Security group for Jeeny Lambda functions',
      allowAllOutbound: true,
    });

    // Create security group for RDS Database
    this.databaseSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: 'jeeny-database-sg',
      description: 'Security group for Jeeny RDS database',
      allowAllOutbound: false,
    });

    // Allow Lambda to connect to RDS (PostgreSQL port 5432)
    this.databaseSecurityGroup.addIngressRule(
      this.lambdaSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow Lambda functions to connect to PostgreSQL'
    );

    // Create security group for Redis (ElastiCache)
    this.redisSecurityGroup = new ec2.SecurityGroup(this, 'RedisSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: 'jeeny-redis-sg',
      description: 'Security group for Jeeny ElastiCache Redis',
      allowAllOutbound: false,
    });

    // Allow Lambda to connect to Redis (port 6379)
    this.redisSecurityGroup.addIngressRule(
      this.lambdaSecurityGroup,
      ec2.Port.tcp(6379),
      'Allow Lambda functions to connect to Redis'
    );

    // Add VPC Interface Endpoints for AWS services (reduces NAT costs)
    // Secrets Manager endpoint
    this.vpc.addInterfaceEndpoint('SecretsManagerEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      privateDnsEnabled: true,
    });

    // SSM endpoint (for Parameter Store)
    this.vpc.addInterfaceEndpoint('SsmEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SSM,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      privateDnsEnabled: true,
    });

    // CloudWatch Logs endpoint
    this.vpc.addInterfaceEndpoint('CloudWatchLogsEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      privateDnsEnabled: true,
    });

    // SQS endpoint
    this.vpc.addInterfaceEndpoint('SqsEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SQS,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      privateDnsEnabled: true,
    });

    // SNS endpoint
    this.vpc.addInterfaceEndpoint('SnsEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SNS,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      privateDnsEnabled: true,
    });

    // ===== Stack Outputs =====

    // VPC ID
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'Jeeny VPC ID',
      exportName: 'JeenyVpcId',
    });

    // VPC CIDR
    new cdk.CfnOutput(this, 'VpcCidr', {
      value: this.vpc.vpcCidrBlock,
      description: 'Jeeny VPC CIDR block',
      exportName: 'JeenyVpcCidr',
    });

    // Private Subnet IDs
    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      value: this.privateSubnets.map(s => s.subnetId).join(','),
      description: 'Private subnet IDs',
      exportName: 'JeenyPrivateSubnetIds',
    });

    // Public Subnet IDs
    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      value: this.publicSubnets.map(s => s.subnetId).join(','),
      description: 'Public subnet IDs',
      exportName: 'JeenyPublicSubnetIds',
    });

    // Isolated Subnet IDs
    new cdk.CfnOutput(this, 'IsolatedSubnetIds', {
      value: this.isolatedSubnets.map(s => s.subnetId).join(','),
      description: 'Isolated subnet IDs (for databases)',
      exportName: 'JeenyIsolatedSubnetIds',
    });

    // Lambda Security Group ID
    new cdk.CfnOutput(this, 'LambdaSecurityGroupId', {
      value: this.lambdaSecurityGroup.securityGroupId,
      description: 'Lambda security group ID',
      exportName: 'JeenyLambdaSecurityGroupId',
    });

    // Database Security Group ID
    new cdk.CfnOutput(this, 'DatabaseSecurityGroupId', {
      value: this.databaseSecurityGroup.securityGroupId,
      description: 'Database security group ID',
      exportName: 'JeenyDatabaseSecurityGroupId',
    });

    // Redis Security Group ID
    new cdk.CfnOutput(this, 'RedisSecurityGroupId', {
      value: this.redisSecurityGroup.securityGroupId,
      description: 'Redis security group ID',
      exportName: 'JeenyRedisSecurityGroupId',
    });

    // Add tags to all resources
    cdk.Tags.of(this).add('Stack', 'VPC');
    cdk.Tags.of(this).add('Service', 'Networking');
  }
}
