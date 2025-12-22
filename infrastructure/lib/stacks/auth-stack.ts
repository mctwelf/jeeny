/**
 * Jeeny Auth Stack - Cognito Authentication
 *
 * Creates Cognito User Pool with phone number/OTP authentication
 * for the Jeeny taxi booking platform.
 *
 * Features:
 * - Phone number as primary identifier
 * - SMS-based OTP verification
 * - Custom attributes for user roles
 * - Separate app clients for each app
 *
 * Region: eu-north-1
 * Account: 160343708363
 */

import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export interface JeenyAuthStackProps extends cdk.StackProps {
  // Add any custom props here
}

export class JeenyAuthStack extends cdk.Stack {
  public readonly userPool: cognito.IUserPool;
  public readonly userPoolClient: cognito.IUserPoolClient;
  public readonly clientAppClient: cognito.IUserPoolClient;
  public readonly driverAppClient: cognito.IUserPoolClient;
  public readonly adminAppClient: cognito.IUserPoolClient;
  public readonly employeeAppClient: cognito.IUserPoolClient;
  public readonly identityPool: cognito.CfnIdentityPool;

  constructor(scope: Construct, id: string, props?: JeenyAuthStackProps) {
    super(scope, id, props);

    // =====================================================
    // COGNITO USER POOL
    // =====================================================

    // Create the main User Pool
    const userPool = new cognito.UserPool(this, 'JeenyUserPool', {
      userPoolName: 'jeeny-user-pool',

      // Sign-in configuration - phone number only
      signInAliases: {
        phone: true,
        email: false,
        username: false,
      },

      // Self sign-up enabled
      selfSignUpEnabled: true,

      // Auto-verify phone number
      autoVerify: {
        phone: true,
      },

      // Sign-in case sensitivity
      signInCaseSensitive: false,

      // Password policy
      passwordPolicy: {
        minLength: 6,
        requireLowercase: false,
        requireUppercase: false,
        requireDigits: true,
        requireSymbols: false,
        tempPasswordValidity: cdk.Duration.days(7),
      },

      // Account recovery
      accountRecovery: cognito.AccountRecovery.PHONE_ONLY_WITHOUT_MFA,

      // MFA configuration
      mfa: cognito.Mfa.OFF, // Using OTP for login, not MFA

      // Standard attributes
      standardAttributes: {
        phoneNumber: {
          required: true,
          mutable: false,
        },
        email: {
          required: false,
          mutable: true,
        },
        givenName: {
          required: false,
          mutable: true,
        },
        familyName: {
          required: false,
          mutable: true,
        },
        profilePicture: {
          required: false,
          mutable: true,
        },
        gender: {
          required: false,
          mutable: true,
        },
        birthdate: {
          required: false,
          mutable: true,
        },
      },

      // Custom attributes
      customAttributes: {
        'user_role': new cognito.StringAttribute({
          mutable: true,
          minLen: 1,
          maxLen: 20,
        }),
        'user_status': new cognito.StringAttribute({
          mutable: true,
          minLen: 1,
          maxLen: 20,
        }),
        'preferred_language': new cognito.StringAttribute({
          mutable: true,
          minLen: 2,
          maxLen: 5,
        }),
        'city_id': new cognito.StringAttribute({
          mutable: true,
          minLen: 1,
          maxLen: 50,
        }),
        'referral_code': new cognito.StringAttribute({
          mutable: false,
          minLen: 6,
          maxLen: 20,
        }),
        'referred_by': new cognito.StringAttribute({
          mutable: false,
          minLen: 6,
          maxLen: 20,
        }),
        // Driver-specific
        'driver_status': new cognito.StringAttribute({
          mutable: true,
          minLen: 1,
          maxLen: 20,
        }),
        'verification_status': new cognito.StringAttribute({
          mutable: true,
          minLen: 1,
          maxLen: 20,
        }),
        'vehicle_id': new cognito.StringAttribute({
          mutable: true,
          minLen: 1,
          maxLen: 50,
        }),
      },

      // Device tracking
      deviceTracking: {
        challengeRequiredOnNewDevice: false,
        deviceOnlyRememberedOnUserPrompt: true,
      },

      // Email settings (for optional email notifications)
      email: cognito.UserPoolEmail.withCognito('noreply@jeeny.mr'),

      // User verification
      userVerification: {
        smsMessage: 'رمز التحقق الخاص بك في جيني هو: {####}',
      },

      // Removal policy (RETAIN for production, DESTROY for dev)
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    this.userPool = userPool;

    // =====================================================
    // USER POOL GROUPS
    // =====================================================

    // Clients group
    new cognito.CfnUserPoolGroup(this, 'ClientsGroup', {
      userPoolId: userPool.userPoolId,
      groupName: 'clients',
      description: 'Passenger/Client users',
      precedence: 4,
    });

    // Drivers group
    new cognito.CfnUserPoolGroup(this, 'DriversGroup', {
      userPoolId: userPool.userPoolId,
      groupName: 'drivers',
      description: 'Driver users',
      precedence: 3,
    });

    // Employees group
    new cognito.CfnUserPoolGroup(this, 'EmployeesGroup', {
      userPoolId: userPool.userPoolId,
      groupName: 'employees',
      description: 'Employee users',
      precedence: 2,
    });

    // Admins group
    new cognito.CfnUserPoolGroup(this, 'AdminsGroup', {
      userPoolId: userPool.userPoolId,
      groupName: 'admins',
      description: 'Admin users',
      precedence: 1,
    });

    // =====================================================
    // APP CLIENTS
    // =====================================================

    // Default/General app client
    this.userPoolClient = userPool.addClient('JeenyGeneralClient', {
      userPoolClientName: 'jeeny-general-client',
      generateSecret: false,
      authFlows: {
        userPassword: true,
        userSrp: true,
        custom: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [
          cognito.OAuthScope.PHONE,
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PROFILE,
        ],
      },
      preventUserExistenceErrors: true,
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),
    });

    // Client (Passenger) app client
    this.clientAppClient = userPool.addClient('JeenyClientApp', {
      userPoolClientName: 'jeeny-client-app',
      generateSecret: false,
      authFlows: {
        userPassword: true,
        userSrp: true,
        custom: true,
      },
      preventUserExistenceErrors: true,
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),
      readAttributes: new cognito.ClientAttributes()
        .withStandardAttributes({
          phoneNumber: true,
          email: true,
          givenName: true,
          familyName: true,
          profilePicture: true,
          gender: true,
          birthdate: true,
        })
        .withCustomAttributes('user_role', 'user_status', 'preferred_language', 'referral_code'),
      writeAttributes: new cognito.ClientAttributes()
        .withStandardAttributes({
          email: true,
          givenName: true,
          familyName: true,
          profilePicture: true,
          gender: true,
          birthdate: true,
        })
        .withCustomAttributes('preferred_language'),
    });

    // Driver app client
    this.driverAppClient = userPool.addClient('JeenyDriverApp', {
      userPoolClientName: 'jeeny-driver-app',
      generateSecret: false,
      authFlows: {
        userPassword: true,
        userSrp: true,
        custom: true,
      },
      preventUserExistenceErrors: true,
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),
      readAttributes: new cognito.ClientAttributes()
        .withStandardAttributes({
          phoneNumber: true,
          email: true,
          givenName: true,
          familyName: true,
          profilePicture: true,
          gender: true,
          birthdate: true,
        })
        .withCustomAttributes(
          'user_role',
          'user_status',
          'preferred_language',
          'driver_status',
          'verification_status',
          'vehicle_id',
          'city_id'
        ),
      writeAttributes: new cognito.ClientAttributes()
        .withStandardAttributes({
          email: true,
          givenName: true,
          familyName: true,
          profilePicture: true,
          gender: true,
          birthdate: true,
        })
        .withCustomAttributes('preferred_language', 'driver_status'),
    });

    // Admin dashboard app client
    this.adminAppClient = userPool.addClient('JeenyAdminApp', {
      userPoolClientName: 'jeeny-admin-app',
      generateSecret: true, // Web app needs secret
      authFlows: {
        userPassword: true,
        userSrp: true,
        custom: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [
          cognito.OAuthScope.PHONE,
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: [
          'http://localhost:3000/auth/callback',
          'https://admin.jeeny.mr/auth/callback',
        ],
        logoutUrls: [
          'http://localhost:3000/logout',
          'https://admin.jeeny.mr/logout',
        ],
      },
      preventUserExistenceErrors: true,
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(7),
    });

    // Employee app client
    this.employeeAppClient = userPool.addClient('JeenyEmployeeApp', {
      userPoolClientName: 'jeeny-employee-app',
      generateSecret: false,
      authFlows: {
        userPassword: true,
        userSrp: true,
        custom: true,
      },
      preventUserExistenceErrors: true,
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),
    });

    // =====================================================
    // IDENTITY POOL (for AWS credentials)
    // =====================================================

    // Create Identity Pool for federated identities
    this.identityPool = new cognito.CfnIdentityPool(this, 'JeenyIdentityPool', {
      identityPoolName: 'jeeny_identity_pool',
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [
        {
          clientId: this.clientAppClient.userPoolClientId,
          providerName: userPool.userPoolProviderName,
        },
        {
          clientId: this.driverAppClient.userPoolClientId,
          providerName: userPool.userPoolProviderName,
        },
        {
          clientId: this.employeeAppClient.userPoolClientId,
          providerName: userPool.userPoolProviderName,
        },
      ],
    });

    // Create IAM role for authenticated users
    const authenticatedRole = new iam.Role(this, 'CognitoAuthenticatedRole', {
      roleName: 'jeeny-cognito-authenticated-role',
      assumedBy: new iam.FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          StringEquals: {
            'cognito-identity.amazonaws.com:aud': this.identityPool.ref,
          },
          'ForAnyValue:StringLike': {
            'cognito-identity.amazonaws.com:amr': 'authenticated',
          },
        },
        'sts:AssumeRoleWithWebIdentity'
      ),
    });

    // Add permissions for authenticated users
    authenticatedRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          // S3 permissions for user uploads
          's3:GetObject',
          's3:PutObject',
          's3:DeleteObject',
        ],
        resources: [
          'arn:aws:s3:::jeeny-assets/*',
          'arn:aws:s3:::jeeny-user-uploads/*',
        ],
      })
    );

    // Add Location Service permissions
    authenticatedRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'geo:GetMapTile',
          'geo:GetMapSprites',
          'geo:GetMapGlyphs',
          'geo:GetMapStyleDescriptor',
          'geo:SearchPlaceIndexForText',
          'geo:SearchPlaceIndexForPosition',
          'geo:SearchPlaceIndexForSuggestions',
          'geo:GetPlace',
          'geo:CalculateRoute',
          'geo:CalculateRouteMatrix',
        ],
        resources: [
          `arn:aws:geo:eu-north-1:160343708363:map/jeeny-map`,
          `arn:aws:geo:eu-north-1:160343708363:place-index/jeeny-place-index`,
          `arn:aws:geo:eu-north-1:160343708363:route-calculator/jeeny-route-calculator`,
        ],
      })
    );

    // Attach role to Identity Pool
    new cognito.CfnIdentityPoolRoleAttachment(this, 'IdentityPoolRoleAttachment', {
      identityPoolId: this.identityPool.ref,
      roles: {
        authenticated: authenticatedRole.roleArn,
      },
      roleMappings: {
        cognitoProvider: {
          identityProvider: `${userPool.userPoolProviderName}:${this.clientAppClient.userPoolClientId}`,
          type: 'Token',
          ambiguousRoleResolution: 'AuthenticatedRole',
        },
      },
    });

    // =====================================================
    // STACK OUTPUTS
    // =====================================================

    // User Pool ID
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
      exportName: 'JeenyUserPoolId',
    });

    // User Pool ARN
    new cdk.CfnOutput(this, 'UserPoolArn', {
      value: userPool.userPoolArn,
      description: 'Cognito User Pool ARN',
      exportName: 'JeenyUserPoolArn',
    });

    // User Pool Provider Name
    new cdk.CfnOutput(this, 'UserPoolProviderName', {
      value: userPool.userPoolProviderName,
      description: 'Cognito User Pool Provider Name',
      exportName: 'JeenyUserPoolProviderName',
    });

    // General Client ID
    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID (General)',
      exportName: 'JeenyUserPoolClientId',
    });

    // Client App Client ID
    new cdk.CfnOutput(this, 'ClientAppClientId', {
      value: this.clientAppClient.userPoolClientId,
      description: 'Cognito Client App ID',
      exportName: 'JeenyClientAppClientId',
    });

    // Driver App Client ID
    new cdk.CfnOutput(this, 'DriverAppClientId', {
      value: this.driverAppClient.userPoolClientId,
      description: 'Cognito Driver App ID',
      exportName: 'JeenyDriverAppClientId',
    });

    // Admin App Client ID
    new cdk.CfnOutput(this, 'AdminAppClientId', {
      value: this.adminAppClient.userPoolClientId,
      description: 'Cognito Admin App ID',
      exportName: 'JeenyAdminAppClientId',
    });

    // Employee App Client ID
    new cdk.CfnOutput(this, 'EmployeeAppClientId', {
      value: this.employeeAppClient.userPoolClientId,
      description: 'Cognito Employee App ID',
      exportName: 'JeenyEmployeeAppClientId',
    });

    // Identity Pool ID
    new cdk.CfnOutput(this, 'IdentityPoolId', {
      value: this.identityPool.ref,
      description: 'Cognito Identity Pool ID',
      exportName: 'JeenyIdentityPoolId',
    });

    // Add tags to all resources
    cdk.Tags.of(this).add('Stack', 'Auth');
    cdk.Tags.of(this).add('Service', 'Cognito');
  }
}
