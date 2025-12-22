/**
 * Jeeny Storage Stack - S3 Buckets
 *
 * Creates S3 buckets for file storage in the Jeeny taxi booking platform.
 *
 * Buckets:
 * - Assets bucket: App assets, icons, images
 * - User uploads: Profile photos, documents
 * - Driver documents: Licenses, vehicle registration, insurance
 * - Ride media: Trip photos, receipts
 * - Logs bucket: Access logs and analytics
 *
 * Region: eu-north-1
 * Account: 160343708363
 */

import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from 'constructs';

export interface JeenyStorageStackProps extends cdk.StackProps {
  // Add any custom props here
}

export class JeenyStorageStack extends cdk.Stack {
  public readonly assetsBucket: s3.IBucket;
  public readonly userUploadsBucket: s3.IBucket;
  public readonly driverDocumentsBucket: s3.IBucket;
  public readonly rideMediaBucket: s3.IBucket;
  public readonly logsBucket: s3.IBucket;
  public readonly cdnDistribution: cloudfront.IDistribution;

  constructor(scope: Construct, id: string, props?: JeenyStorageStackProps) {
    super(scope, id, props);

    // =====================================================
    // LOGS BUCKET (for access logs)
    // =====================================================

    this.logsBucket = new s3.Bucket(this, 'JeenyLogsBucket', {
      bucketName: `jeeny-logs-160343708363-eu-north-1`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: false,
      lifecycleRules: [
        {
          id: 'delete-old-logs',
          enabled: true,
          expiration: cdk.Duration.days(90),
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
        {
          id: 'transition-to-glacier',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(60),
            },
          ],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // =====================================================
    // ASSETS BUCKET (Public CDN assets)
    // =====================================================

    this.assetsBucket = new s3.Bucket(this, 'JeenyAssetsBucket', {
      bucketName: `jeeny-assets-160343708363-eu-north-1`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: true,
        ignorePublicAcls: true,
        blockPublicPolicy: false, // Allow CloudFront OAI
        restrictPublicBuckets: false,
      }),
      versioned: true,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.HEAD],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
          maxAge: 3600,
        },
      ],
      serverAccessLogsBucket: this.logsBucket,
      serverAccessLogsPrefix: 'assets-logs/',
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // =====================================================
    // USER UPLOADS BUCKET (Profile photos, etc.)
    // =====================================================

    this.userUploadsBucket = new s3.Bucket(this, 'JeenyUserUploadsBucket', {
      bucketName: `jeeny-user-uploads-160343708363-eu-north-1`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.DELETE,
            s3.HttpMethods.HEAD,
          ],
          allowedOrigins: [
            'http://localhost:*',
            'https://*.jeeny.mr',
            'https://jeeny.mr',
          ],
          allowedHeaders: ['*'],
          exposedHeaders: [
            'ETag',
            'x-amz-meta-custom-header',
            'x-amz-server-side-encryption',
          ],
          maxAge: 3600,
        },
      ],
      lifecycleRules: [
        {
          id: 'delete-incomplete-uploads',
          enabled: true,
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
        {
          id: 'delete-old-versions',
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(90),
        },
      ],
      serverAccessLogsBucket: this.logsBucket,
      serverAccessLogsPrefix: 'user-uploads-logs/',
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Create folder structure in user uploads bucket
    // folders: /profiles, /documents, /temp

    // =====================================================
    // DRIVER DOCUMENTS BUCKET (Sensitive documents)
    // =====================================================

    this.driverDocumentsBucket = new s3.Bucket(this, 'JeenyDriverDocumentsBucket', {
      bucketName: `jeeny-driver-documents-160343708363-eu-north-1`,
      encryption: s3.BucketEncryption.KMS_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      enforceSSL: true,
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.HEAD,
          ],
          allowedOrigins: [
            'http://localhost:*',
            'https://*.jeeny.mr',
            'https://jeeny.mr',
          ],
          allowedHeaders: ['*'],
          maxAge: 3600,
        },
      ],
      lifecycleRules: [
        {
          id: 'delete-incomplete-uploads',
          enabled: true,
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
        {
          id: 'transition-old-versions',
          enabled: true,
          noncurrentVersionTransitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
          noncurrentVersionExpiration: cdk.Duration.days(365),
        },
      ],
      serverAccessLogsBucket: this.logsBucket,
      serverAccessLogsPrefix: 'driver-documents-logs/',
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // =====================================================
    // RIDE MEDIA BUCKET (Trip photos, receipts)
    // =====================================================

    this.rideMediaBucket = new s3.Bucket(this, 'JeenyRideMediaBucket', {
      bucketName: `jeeny-ride-media-160343708363-eu-north-1`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: false,
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.HEAD,
          ],
          allowedOrigins: [
            'http://localhost:*',
            'https://*.jeeny.mr',
            'https://jeeny.mr',
          ],
          allowedHeaders: ['*'],
          maxAge: 3600,
        },
      ],
      lifecycleRules: [
        {
          id: 'delete-incomplete-uploads',
          enabled: true,
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(3),
        },
        {
          id: 'transition-to-infrequent-access',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(180),
            },
          ],
        },
        {
          id: 'delete-old-media',
          enabled: true,
          expiration: cdk.Duration.days(365 * 2), // Keep for 2 years
        },
      ],
      serverAccessLogsBucket: this.logsBucket,
      serverAccessLogsPrefix: 'ride-media-logs/',
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // =====================================================
    // CLOUDFRONT DISTRIBUTION (CDN for assets)
    // =====================================================

    // Create Origin Access Identity for CloudFront
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(
      this,
      'JeenyAssetsOAI',
      {
        comment: 'OAI for Jeeny assets bucket',
      }
    );

    // Grant read access to CloudFront
    this.assetsBucket.grantRead(originAccessIdentity);

    // Create CloudFront distribution
    this.cdnDistribution = new cloudfront.Distribution(this, 'JeenyAssetsCDN', {
      comment: 'Jeeny Assets CDN Distribution',
      defaultBehavior: {
        origin: new origins.S3Origin(this.assetsBucket, {
          originAccessIdentity,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
        compress: true,
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      enabled: true,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      // Add custom domain later:
      // domainNames: ['cdn.jeeny.mr'],
      // certificate: certificate,
    });

    // =====================================================
    // IAM POLICIES
    // =====================================================

    // Policy for Lambda functions to access storage
    const lambdaStoragePolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:PutObject',
        's3:DeleteObject',
        's3:ListBucket',
        's3:GetObjectVersion',
        's3:PutObjectAcl',
      ],
      resources: [
        this.userUploadsBucket.bucketArn,
        `${this.userUploadsBucket.bucketArn}/*`,
        this.driverDocumentsBucket.bucketArn,
        `${this.driverDocumentsBucket.bucketArn}/*`,
        this.rideMediaBucket.bucketArn,
        `${this.rideMediaBucket.bucketArn}/*`,
      ],
    });

    // =====================================================
    // STACK OUTPUTS
    // =====================================================

    // Assets Bucket
    new cdk.CfnOutput(this, 'AssetsBucketName', {
      value: this.assetsBucket.bucketName,
      description: 'Assets S3 bucket name',
      exportName: 'JeenyAssetsBucketName',
    });

    new cdk.CfnOutput(this, 'AssetsBucketArn', {
      value: this.assetsBucket.bucketArn,
      description: 'Assets S3 bucket ARN',
      exportName: 'JeenyAssetsBucketArn',
    });

    // User Uploads Bucket
    new cdk.CfnOutput(this, 'UserUploadsBucketName', {
      value: this.userUploadsBucket.bucketName,
      description: 'User uploads S3 bucket name',
      exportName: 'JeenyUserUploadsBucketName',
    });

    new cdk.CfnOutput(this, 'UserUploadsBucketArn', {
      value: this.userUploadsBucket.bucketArn,
      description: 'User uploads S3 bucket ARN',
      exportName: 'JeenyUserUploadsBucketArn',
    });

    // Driver Documents Bucket
    new cdk.CfnOutput(this, 'DriverDocumentsBucketName', {
      value: this.driverDocumentsBucket.bucketName,
      description: 'Driver documents S3 bucket name',
      exportName: 'JeenyDriverDocumentsBucketName',
    });

    new cdk.CfnOutput(this, 'DriverDocumentsBucketArn', {
      value: this.driverDocumentsBucket.bucketArn,
      description: 'Driver documents S3 bucket ARN',
      exportName: 'JeenyDriverDocumentsBucketArn',
    });

    // Ride Media Bucket
    new cdk.CfnOutput(this, 'RideMediaBucketName', {
      value: this.rideMediaBucket.bucketName,
      description: 'Ride media S3 bucket name',
      exportName: 'JeenyRideMediaBucketName',
    });

    new cdk.CfnOutput(this, 'RideMediaBucketArn', {
      value: this.rideMediaBucket.bucketArn,
      description: 'Ride media S3 bucket ARN',
      exportName: 'JeenyRideMediaBucketArn',
    });

    // Logs Bucket
    new cdk.CfnOutput(this, 'LogsBucketName', {
      value: this.logsBucket.bucketName,
      description: 'Logs S3 bucket name',
      exportName: 'JeenyLogsBucketName',
    });

    // CloudFront Distribution
    new cdk.CfnOutput(this, 'CDNDistributionId', {
      value: this.cdnDistribution.distributionId,
      description: 'CloudFront distribution ID',
      exportName: 'JeenyCDNDistributionId',
    });

    new cdk.CfnOutput(this, 'CDNDistributionDomain', {
      value: this.cdnDistribution.distributionDomainName,
      description: 'CloudFront distribution domain name',
      exportName: 'JeenyCDNDistributionDomain',
    });

    new cdk.CfnOutput(this, 'CDNUrl', {
      value: `https://${this.cdnDistribution.distributionDomainName}`,
      description: 'CloudFront CDN URL',
      exportName: 'JeenyCDNUrl',
    });

    // Add tags to all resources
    cdk.Tags.of(this).add('Stack', 'Storage');
    cdk.Tags.of(this).add('Service', 'S3');
  }
}
