/**
 * Jeeny Location Lambda Handler
 *
 * Handles all location-related operations including:
 * - Place search and autocomplete
 * - Reverse geocoding
 * - Route calculation
 * - ETA estimation
 */

import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import {
  LocationClient,
  SearchPlaceIndexForTextCommand,
  SearchPlaceIndexForPositionCommand,
  SearchPlaceIndexForSuggestionsCommand,
  GetPlaceCommand,
  CalculateRouteCommand,
  CalculateRouteMatrixCommand,
} from '@aws-sdk/client-location';

// Initialize clients
const locationClient = new LocationClient({
  region: process.env.AWS_REGION_NAME || 'eu-north-1',
});

// Environment variables
const PLACE_INDEX_NAME = process.env.PLACE_INDEX_NAME || 'jeeny-place-index';
const ROUTE_CALCULATOR_NAME = process.env.ROUTE_CALCULATOR_NAME || 'jeeny-route-calculator';
const MAP_NAME = process.env.MAP_NAME || 'jeeny-map';

// Types
interface Coordinate {
  latitude: number;
  longitude: number;
}

interface Place {
  placeId: string;
  name: string;
  address: string;
  coordinates: Coordinate;
  categories?: string[];
  country?: string;
  region?: string;
  municipality?: string;
}

interface RouteInfo {
  distance: number; // in meters
  duration: number; // in seconds
  geometry: Coordinate[];
  steps?: RouteStep[];
}

interface RouteStep {
  distance: number;
  duration: number;
  instruction: string;
  startPosition: Coordinate;
  endPosition: Coordinate;
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

/**
 * Search for places by text query
 */
const searchPlaces = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { query, limit = '10', biasPosition, filterCountries } = event.queryStringParameters || {};

    if (!query) {
      return response(400, { success: false, error: 'Search query is required' });
    }

    const params: any = {
      IndexName: PLACE_INDEX_NAME,
      Text: query,
      MaxResults: Math.min(parseInt(limit), 50),
      Language: 'ar', // Arabic as default, could be parameterized
    };

    // Add bias position if provided (lat,lng format)
    if (biasPosition) {
      const [lat, lng] = biasPosition.split(',').map(Number);
      if (!isNaN(lat) && !isNaN(lng)) {
        params.BiasPosition = [lng, lat]; // AWS uses [lng, lat] format
      }
    }

    // Filter by countries if provided
    if (filterCountries) {
      params.FilterCountries = filterCountries.split(',');
    }

    const result = await locationClient.send(new SearchPlaceIndexForTextCommand(params));

    const places: Place[] = (result.Results || []).map((item) => ({
      placeId: item.PlaceId || '',
      name: item.Place?.Label?.split(',')[0] || '',
      address: item.Place?.Label || '',
      coordinates: {
        latitude: item.Place?.Geometry?.Point?.[1] || 0,
        longitude: item.Place?.Geometry?.Point?.[0] || 0,
      },
      categories: item.Place?.Categories,
      country: item.Place?.Country,
      region: item.Place?.Region,
      municipality: item.Place?.Municipality,
    }));

    return response(200, {
      success: true,
      data: {
        places,
        count: places.length,
      },
    });
  } catch (error) {
    console.error('Search places error:', error);
    return response(500, {
      success: false,
      error: 'Failed to search places',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get autocomplete suggestions
 */
const getAutocomplete = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { query, limit = '5', biasPosition } = event.queryStringParameters || {};

    if (!query) {
      return response(400, { success: false, error: 'Search query is required' });
    }

    const params: any = {
      IndexName: PLACE_INDEX_NAME,
      Text: query,
      MaxResults: Math.min(parseInt(limit), 15),
      Language: 'ar',
    };

    if (biasPosition) {
      const [lat, lng] = biasPosition.split(',').map(Number);
      if (!isNaN(lat) && !isNaN(lng)) {
        params.BiasPosition = [lng, lat];
      }
    }

    const result = await locationClient.send(new SearchPlaceIndexForSuggestionsCommand(params));

    const suggestions = (result.Results || []).map((item) => ({
      text: item.Text || '',
      placeId: item.PlaceId,
      categories: item.Categories,
    }));

    return response(200, {
      success: true,
      data: {
        suggestions,
        count: suggestions.length,
      },
    });
  } catch (error) {
    console.error('Autocomplete error:', error);
    return response(500, {
      success: false,
      error: 'Failed to get suggestions',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Reverse geocode (coordinates to address)
 */
const reverseGeocode = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { latitude, longitude, lat, lng } = event.queryStringParameters || {};

    const latValue = parseFloat(latitude || lat || '');
    const lngValue = parseFloat(longitude || lng || '');

    if (isNaN(latValue) || isNaN(lngValue)) {
      return response(400, { success: false, error: 'Valid latitude and longitude are required' });
    }

    const result = await locationClient.send(
      new SearchPlaceIndexForPositionCommand({
        IndexName: PLACE_INDEX_NAME,
        Position: [lngValue, latValue],
        MaxResults: 1,
        Language: 'ar',
      })
    );

    if (!result.Results || result.Results.length === 0) {
      return response(404, { success: false, error: 'No address found for this location' });
    }

    const place = result.Results[0];

    return response(200, {
      success: true,
      data: {
        placeId: place.PlaceId,
        address: place.Place?.Label || '',
        streetAddress: place.Place?.AddressNumber
          ? `${place.Place.AddressNumber} ${place.Place.Street || ''}`
          : place.Place?.Street || '',
        neighborhood: place.Place?.Neighborhood,
        municipality: place.Place?.Municipality,
        region: place.Place?.Region,
        country: place.Place?.Country,
        postalCode: place.Place?.PostalCode,
        coordinates: {
          latitude: latValue,
          longitude: lngValue,
        },
      },
    });
  } catch (error) {
    console.error('Reverse geocode error:', error);
    return response(500, {
      success: false,
      error: 'Failed to reverse geocode',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get place details by ID
 */
const getPlace = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { placeId } = event.queryStringParameters || {};

    if (!placeId) {
      return response(400, { success: false, error: 'Place ID is required' });
    }

    const result = await locationClient.send(
      new GetPlaceCommand({
        IndexName: PLACE_INDEX_NAME,
        PlaceId: placeId,
        Language: 'ar',
      })
    );

    if (!result.Place) {
      return response(404, { success: false, error: 'Place not found' });
    }

    const place = result.Place;

    return response(200, {
      success: true,
      data: {
        placeId,
        name: place.Label?.split(',')[0] || '',
        address: place.Label || '',
        coordinates: {
          latitude: place.Geometry?.Point?.[1] || 0,
          longitude: place.Geometry?.Point?.[0] || 0,
        },
        categories: place.Categories,
        country: place.Country,
        region: place.Region,
        municipality: place.Municipality,
        neighborhood: place.Neighborhood,
        street: place.Street,
        addressNumber: place.AddressNumber,
        postalCode: place.PostalCode,
      },
    });
  } catch (error) {
    console.error('Get place error:', error);
    return response(500, {
      success: false,
      error: 'Failed to get place details',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Calculate route between points
 */
const calculateRoute = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { origin, destination, waypoints, travelMode = 'Car', departureTime, avoidTolls, avoidFerries } = body;

    if (!origin || !destination) {
      return response(400, { success: false, error: 'Origin and destination are required' });
    }

    const params: any = {
      CalculatorName: ROUTE_CALCULATOR_NAME,
      DeparturePosition: [origin.longitude, origin.latitude],
      DestinationPosition: [destination.longitude, destination.latitude],
      TravelMode: travelMode,
      IncludeLegGeometry: true,
      DistanceUnit: 'Kilometers',
    };

    if (waypoints && waypoints.length > 0) {
      params.WaypointPositions = waypoints.map((wp: Coordinate) => [wp.longitude, wp.latitude]);
    }

    if (departureTime) {
      params.DepartureTime = new Date(departureTime);
    }

    if (avoidTolls || avoidFerries) {
      params.CarModeOptions = {
        AvoidTolls: avoidTolls || false,
        AvoidFerries: avoidFerries || false,
      };
    }

    const result = await locationClient.send(new CalculateRouteCommand(params));

    // Extract route geometry
    const geometry: Coordinate[] = [];
    const steps: RouteStep[] = [];

    result.Legs?.forEach((leg) => {
      leg.Geometry?.LineString?.forEach((point) => {
        geometry.push({
          latitude: point[1],
          longitude: point[0],
        });
      });

      leg.Steps?.forEach((step) => {
        steps.push({
          distance: (step.Distance || 0) * 1000, // Convert to meters
          duration: step.DurationSeconds || 0,
          instruction: step.GeometryOffset?.toString() || '',
          startPosition: {
            latitude: step.StartPosition?.[1] || 0,
            longitude: step.StartPosition?.[0] || 0,
          },
          endPosition: {
            latitude: step.EndPosition?.[1] || 0,
            longitude: step.EndPosition?.[0] || 0,
          },
        });
      });
    });

    const routeInfo: RouteInfo = {
      distance: (result.Summary?.Distance || 0) * 1000, // Convert km to meters
      duration: result.Summary?.DurationSeconds || 0,
      geometry,
      steps,
    };

    return response(200, {
      success: true,
      data: {
        route: routeInfo,
        origin,
        destination,
        waypoints,
        summary: {
          distanceKm: result.Summary?.Distance || 0,
          distanceText: `${(result.Summary?.Distance || 0).toFixed(1)} km`,
          durationSeconds: result.Summary?.DurationSeconds || 0,
          durationText: formatDuration(result.Summary?.DurationSeconds || 0),
        },
      },
    });
  } catch (error) {
    console.error('Calculate route error:', error);
    return response(500, {
      success: false,
      error: 'Failed to calculate route',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Calculate ETA from current position to multiple destinations
 */
const calculateEta = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { origin, destinations } = body;

    if (!origin || !destinations || !Array.isArray(destinations) || destinations.length === 0) {
      return response(400, {
        success: false,
        error: 'Origin and at least one destination are required',
      });
    }

    if (destinations.length > 10) {
      return response(400, {
        success: false,
        error: 'Maximum 10 destinations allowed',
      });
    }

    const result = await locationClient.send(
      new CalculateRouteMatrixCommand({
        CalculatorName: ROUTE_CALCULATOR_NAME,
        DeparturePositions: [[origin.longitude, origin.latitude]],
        DestinationPositions: destinations.map((d: Coordinate) => [d.longitude, d.latitude]),
        TravelMode: 'Car',
        DistanceUnit: 'Kilometers',
      })
    );

    const etas = result.RouteMatrix?.[0]?.map((route, index) => ({
      destination: destinations[index],
      distance: (route.Distance || 0) * 1000, // Convert to meters
      distanceKm: route.Distance || 0,
      duration: route.DurationSeconds || 0,
      durationText: formatDuration(route.DurationSeconds || 0),
      error: route.Error ? route.Error.Message : null,
    })) || [];

    return response(200, {
      success: true,
      data: {
        origin,
        etas,
      },
    });
  } catch (error) {
    console.error('Calculate ETA error:', error);
    return response(500, {
      success: false,
      error: 'Failed to calculate ETA',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Format duration in seconds to human readable string
 */
const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${Math.round(seconds)} sec`;
  } else if (seconds < 3600) {
    const minutes = Math.round(seconds / 60);
    return `${minutes} min`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    return minutes > 0 ? `${hours} hr ${minutes} min` : `${hours} hr`;
  }
};

/**
 * Main handler - routes requests to appropriate functions
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('Location Lambda invoked:', JSON.stringify(event, null, 2));

  const { httpMethod, path, resource } = event;

  try {
    // Route based on path
    const pathParts = path.split('/').filter(Boolean);
    const endpoint = pathParts[pathParts.length - 1];

    switch (endpoint) {
      case 'search':
        if (httpMethod === 'GET') return searchPlaces(event);
        break;

      case 'autocomplete':
        if (httpMethod === 'GET') return getAutocomplete(event);
        break;

      case 'reverse-geocode':
        if (httpMethod === 'GET') return reverseGeocode(event);
        break;

      case 'place':
        if (httpMethod === 'GET') return getPlace(event);
        break;

      case 'route':
        if (httpMethod === 'POST') return calculateRoute(event);
        break;

      case 'eta':
        if (httpMethod === 'POST') return calculateEta(event);
        break;

      case 'location':
        // Base /location endpoint
        if (httpMethod === 'GET') {
          return response(200, {
            success: true,
            data: {
              message: 'Jeeny Location Service',
              endpoints: [
                'GET /location/search - Search places',
                'GET /location/autocomplete - Get autocomplete suggestions',
                'GET /location/reverse-geocode - Convert coordinates to address',
                'GET /location/place - Get place details by ID',
                'POST /location/route - Calculate route',
                'POST /location/eta - Calculate ETA to multiple destinations',
              ],
            },
          });
        }
        break;
    }

    return response(404, {
      success: false,
      error: 'Endpoint not found',
    });
  } catch (error) {
    console.error('Unhandled error:', error);
    return response(500, {
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
