/**
 * Jeeny Location Stack - AWS Location Service
 *
 * Creates AWS Location Service resources for maps, geocoding,
 * routing, and real-time tracking in the Jeeny taxi booking platform.
 *
 * Resources:
 * - Map: For displaying maps in the apps
 * - Place Index: For geocoding and place search
 * - Route Calculator: For calculating routes and ETAs
 * - Tracker: For real-time driver location tracking
 * - Geofence Collection: For geofencing (airports, zones, etc.)
 *
 * Region: eu-north-1
 * Account: 160343708363
 */

import * as cdk from 'aws-cdk-lib';
import * as location from 'aws-cdk-lib/aws-location';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface JeenyLocationStackProps extends cdk.StackProps {
  // Add any custom props here
}

export class JeenyLocationStack extends cdk.Stack {
  public readonly map: location.CfnMap;
  public readonly placeIndex: location.CfnPlaceIndex;
  public readonly routeCalculator: location.CfnRouteCalculator;
  public readonly tracker: location.CfnTracker;
  public readonly geofenceCollection: location.CfnGeofenceCollection;

  // Expose resource names for other stacks
  public readonly mapName: string;
  public readonly placeIndexName: string;
  public readonly routeCalculatorName: string;
  public readonly trackerName: string;
  public readonly geofenceCollectionName: string;

  constructor(scope: Construct, id: string, props?: JeenyLocationStackProps) {
    super(scope, id, props);

    // Resource names
    this.mapName = 'jeeny-map';
    this.placeIndexName = 'jeeny-place-index';
    this.routeCalculatorName = 'jeeny-route-calculator';
    this.trackerName = 'jeeny-tracker';
    this.geofenceCollectionName = 'jeeny-geofences';

    // =====================================================
    // MAP RESOURCE
    // =====================================================

    // Create map for displaying in the apps
    // Using Esri as the data provider (good coverage in Africa)
    this.map = new location.CfnMap(this, 'JeenyMap', {
      mapName: this.mapName,
      description: 'Jeeny taxi booking app map for Mauritania',
      configuration: {
        style: 'VectorEsriNavigation', // Best for navigation/taxi apps
        // Other options:
        // 'VectorEsriStreets' - General purpose
        // 'VectorEsriTopographic' - With terrain
        // 'VectorHereExplore' - HERE maps (alternative)
        // 'RasterEsriImagery' - Satellite imagery
      },
      pricingPlan: 'RequestBasedUsage',
      tags: [
        { key: 'Project', value: 'Jeeny' },
        { key: 'Environment', value: 'production' },
        { key: 'Service', value: 'Location' },
      ],
    });

    // =====================================================
    // PLACE INDEX (Geocoding & Search)
    // =====================================================

    // Create place index for geocoding and place search
    this.placeIndex = new location.CfnPlaceIndex(this, 'JeenyPlaceIndex', {
      indexName: this.placeIndexName,
      description: 'Jeeny place index for geocoding and search in Mauritania',
      dataSource: 'Esri', // Esri has good coverage in Africa
      // Other options: 'Here', 'Grab' (Asia only)
      dataSourceConfiguration: {
        intendedUse: 'Storage', // 'SingleUse' or 'Storage'
        // 'Storage' allows storing results, needed for saved addresses
      },
      pricingPlan: 'RequestBasedUsage',
      tags: [
        { key: 'Project', value: 'Jeeny' },
        { key: 'Environment', value: 'production' },
        { key: 'Service', value: 'Location' },
      ],
    });

    // =====================================================
    // ROUTE CALCULATOR
    // =====================================================

    // Create route calculator for navigation and ETA
    this.routeCalculator = new location.CfnRouteCalculator(this, 'JeenyRouteCalculator', {
      calculatorName: this.routeCalculatorName,
      description: 'Jeeny route calculator for navigation and fare estimation',
      dataSource: 'Esri', // Matches our map provider
      // Other options: 'Here', 'Grab' (Asia only)
      pricingPlan: 'RequestBasedUsage',
      tags: [
        { key: 'Project', value: 'Jeeny' },
        { key: 'Environment', value: 'production' },
        { key: 'Service', value: 'Location' },
      ],
    });

    // =====================================================
    // TRACKER (Real-time Location Tracking)
    // =====================================================

    // Create tracker for real-time driver location
    this.tracker = new location.CfnTracker(this, 'JeenyTracker', {
      trackerName: this.trackerName,
      description: 'Jeeny real-time driver location tracker',
      positionFiltering: 'AccuracyBased', // Filter out inaccurate positions
      // Other options:
      // 'TimeBased' - Filter based on time intervals
      // 'DistanceBased' - Filter based on distance moved
      pricingPlan: 'RequestBasedUsage',
      tags: [
        { key: 'Project', value: 'Jeeny' },
        { key: 'Environment', value: 'production' },
        { key: 'Service', value: 'Location' },
      ],
    });

    // =====================================================
    // GEOFENCE COLLECTION
    // =====================================================

    // Create geofence collection for zones (airports, city centers, etc.)
    this.geofenceCollection = new location.CfnGeofenceCollection(this, 'JeenyGeofences', {
      collectionName: this.geofenceCollectionName,
      description: 'Jeeny geofences for airports, zones, and special areas',
      pricingPlan: 'RequestBasedUsage',
      tags: [
        { key: 'Project', value: 'Jeeny' },
        { key: 'Environment', value: 'production' },
        { key: 'Service', value: 'Location' },
      ],
    });

    // =====================================================
    // TRACKER-GEOFENCE ASSOCIATION
    // =====================================================

    // Link tracker to geofence collection for automatic geofence events
    new location.CfnTrackerConsumer(this, 'TrackerGeofenceLink', {
      trackerName: this.trackerName,
      consumerArn: this.geofenceCollection.attrArn,
    });

    // Ensure proper dependency order
    this.geofenceCollection.addDependency(this.tracker);

    // =====================================================
    // IAM POLICIES
    // =====================================================

    // Create IAM policy for mobile apps (authenticated users)
    const mobileAppLocationPolicy = new iam.PolicyDocument({
      statements: [
        // Map permissions
        new iam.PolicyStatement({
          sid: 'MapsReadOnly',
          effect: iam.Effect.ALLOW,
          actions: [
            'geo:GetMapTile',
            'geo:GetMapSprites',
            'geo:GetMapGlyphs',
            'geo:GetMapStyleDescriptor',
          ],
          resources: [this.map.attrArn],
        }),
        // Place index permissions
        new iam.PolicyStatement({
          sid: 'PlacesSearch',
          effect: iam.Effect.ALLOW,
          actions: [
            'geo:SearchPlaceIndexForText',
            'geo:SearchPlaceIndexForPosition',
            'geo:SearchPlaceIndexForSuggestions',
            'geo:GetPlace',
          ],
          resources: [this.placeIndex.attrArn],
        }),
        // Route calculator permissions
        new iam.PolicyStatement({
          sid: 'RoutesCalculate',
          effect: iam.Effect.ALLOW,
          actions: [
            'geo:CalculateRoute',
            'geo:CalculateRouteMatrix',
          ],
          resources: [this.routeCalculator.attrArn],
        }),
      ],
    });

    // Create IAM policy for driver apps (includes tracking)
    const driverAppLocationPolicy = new iam.PolicyDocument({
      statements: [
        // All mobile app permissions
        ...mobileAppLocationPolicy.statements,
        // Tracker permissions (drivers only)
        new iam.PolicyStatement({
          sid: 'TrackerUpdate',
          effect: iam.Effect.ALLOW,
          actions: [
            'geo:BatchUpdateDevicePosition',
            'geo:GetDevicePosition',
            'geo:GetDevicePositionHistory',
          ],
          resources: [this.tracker.attrArn],
          // Condition to only allow updating own device
          conditions: {
            StringLike: {
              'geo:DeviceIds': ['${cognito-identity.amazonaws.com:sub}'],
            },
          },
        }),
      ],
    });

    // Create IAM policy for backend/Lambda (full access)
    const backendLocationPolicy = new iam.PolicyDocument({
      statements: [
        // Map permissions
        new iam.PolicyStatement({
          sid: 'MapsFullAccess',
          effect: iam.Effect.ALLOW,
          actions: ['geo:GetMap*'],
          resources: [this.map.attrArn],
        }),
        // Place index permissions
        new iam.PolicyStatement({
          sid: 'PlacesFullAccess',
          effect: iam.Effect.ALLOW,
          actions: [
            'geo:SearchPlaceIndex*',
            'geo:GetPlace',
          ],
          resources: [this.placeIndex.attrArn],
        }),
        // Route calculator permissions
        new iam.PolicyStatement({
          sid: 'RoutesFullAccess',
          effect: iam.Effect.ALLOW,
          actions: ['geo:CalculateRoute*'],
          resources: [this.routeCalculator.attrArn],
        }),
        // Tracker permissions
        new iam.PolicyStatement({
          sid: 'TrackerFullAccess',
          effect: iam.Effect.ALLOW,
          actions: [
            'geo:BatchUpdateDevicePosition',
            'geo:BatchDeleteDevicePositionHistory',
            'geo:BatchGetDevicePosition',
            'geo:GetDevicePosition',
            'geo:GetDevicePositionHistory',
            'geo:ListDevicePositions',
          ],
          resources: [this.tracker.attrArn],
        }),
        // Geofence permissions
        new iam.PolicyStatement({
          sid: 'GeofencesFullAccess',
          effect: iam.Effect.ALLOW,
          actions: [
            'geo:BatchPutGeofence',
            'geo:BatchDeleteGeofence',
            'geo:GetGeofence',
            'geo:ListGeofences',
            'geo:BatchEvaluateGeofences',
          ],
          resources: [this.geofenceCollection.attrArn],
        }),
      ],
    });

    // =====================================================
    // EVENTBRIDGE RULE (Geofence Events)
    // =====================================================

    // Create EventBridge rule to capture geofence events
    // This will trigger when drivers enter/exit geofenced areas
    const geofenceEventRule = new events.Rule(this, 'GeofenceEventRule', {
      ruleName: 'jeeny-geofence-events',
      description: 'Capture Jeeny geofence enter/exit events',
      eventPattern: {
        source: ['aws.geo'],
        detailType: ['Location Geofence Event'],
        detail: {
          EventType: ['ENTER', 'EXIT'],
          GeofenceCollection: [this.geofenceCollectionName],
        },
      },
    });

    // Note: Add Lambda target when API stack is created
    // geofenceEventRule.addTarget(new targets.LambdaFunction(geofenceHandler));

    // =====================================================
    // CLOUDWATCH LOG GROUP
    // =====================================================

    // Create log group for location events
    const locationLogGroup = new logs.LogGroup(this, 'LocationLogGroup', {
      logGroupName: '/aws/location/jeeny',
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // =====================================================
    // STACK OUTPUTS
    // =====================================================

    // Map outputs
    new cdk.CfnOutput(this, 'MapName', {
      value: this.mapName,
      description: 'AWS Location Service Map name',
      exportName: 'JeenyMapName',
    });

    new cdk.CfnOutput(this, 'MapArn', {
      value: this.map.attrArn,
      description: 'AWS Location Service Map ARN',
      exportName: 'JeenyMapArn',
    });

    // Place Index outputs
    new cdk.CfnOutput(this, 'PlaceIndexName', {
      value: this.placeIndexName,
      description: 'AWS Location Service Place Index name',
      exportName: 'JeenyPlaceIndexName',
    });

    new cdk.CfnOutput(this, 'PlaceIndexArn', {
      value: this.placeIndex.attrArn,
      description: 'AWS Location Service Place Index ARN',
      exportName: 'JeenyPlaceIndexArn',
    });

    // Route Calculator outputs
    new cdk.CfnOutput(this, 'RouteCalculatorName', {
      value: this.routeCalculatorName,
      description: 'AWS Location Service Route Calculator name',
      exportName: 'JeenyRouteCalculatorName',
    });

    new cdk.CfnOutput(this, 'RouteCalculatorArn', {
      value: this.routeCalculator.attrArn,
      description: 'AWS Location Service Route Calculator ARN',
      exportName: 'JeenyRouteCalculatorArn',
    });

    // Tracker outputs
    new cdk.CfnOutput(this, 'TrackerName', {
      value: this.trackerName,
      description: 'AWS Location Service Tracker name',
      exportName: 'JeenyTrackerName',
    });

    new cdk.CfnOutput(this, 'TrackerArn', {
      value: this.tracker.attrArn,
      description: 'AWS Location Service Tracker ARN',
      exportName: 'JeenyTrackerArn',
    });

    // Geofence Collection outputs
    new cdk.CfnOutput(this, 'GeofenceCollectionName', {
      value: this.geofenceCollectionName,
      description: 'AWS Location Service Geofence Collection name',
      exportName: 'JeenyGeofenceCollectionName',
    });

    new cdk.CfnOutput(this, 'GeofenceCollectionArn', {
      value: this.geofenceCollection.attrArn,
      description: 'AWS Location Service Geofence Collection ARN',
      exportName: 'JeenyGeofenceCollectionArn',
    });

    // Log Group output
    new cdk.CfnOutput(this, 'LocationLogGroupName', {
      value: locationLogGroup.logGroupName,
      description: 'CloudWatch Log Group for Location events',
      exportName: 'JeenyLocationLogGroupName',
    });

    // Add tags to all resources
    cdk.Tags.of(this).add('Stack', 'Location');
    cdk.Tags.of(this).add('Service', 'LocationService');
  }
}
