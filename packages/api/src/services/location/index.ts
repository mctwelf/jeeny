/**
 * Jeeny Location Service - Cloud Run
 *
 * Handles location operations using Google Maps Platform.
 * Replaces AWS Lambda location handler with AWS Location Service.
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { initializeFirebase } from '../../lib/firebase';
import {
  searchPlaces,
  getPlaceDetails,
  reverseGeocode as reverseGeocodeMap,
  calculateRoute as calculateRouteMap,
  Coordinate,
} from '../../lib/maps';
import { sendSuccess, badRequest, notFound, serverError } from '../../lib/response';
import { authenticate, optionalAuth } from '../../middleware/auth';

// Initialize Firebase
initializeFirebase();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Types
interface Place {
  placeId: string;
  name: string;
  address: string;
  coordinates: Coordinate;
  types?: string[];
}

interface RouteInfo {
  distance: number;
  duration: number;
  route: Coordinate[];
  polyline: string;
}

// Helper function to format duration
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

// Routes

/**
 * GET /search
 * Search for places by text query
 */
app.get('/search', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { query, limit = '10', biasPosition } = req.query;

    if (!query) {
      return badRequest(res, 'Search query is required', 'استعلام البحث مطلوب');
    }

    let biasCoords: Coordinate | undefined;
    if (biasPosition) {
      const [lat, lng] = (biasPosition as string).split(',').map(Number);
      if (!isNaN(lat) && !isNaN(lng)) {
        biasCoords = { latitude: lat, longitude: lng };
      }
    }

    const results = await searchPlaces(query as string, biasCoords);

    // Limit results
    const limitedResults = results.slice(0, parseInt(limit as string));

    return sendSuccess(res, {
      places: limitedResults,
      count: limitedResults.length,
    });
  } catch (error) {
    console.error('Search places error:', error);
    return serverError(res, 'Failed to search places', 'فشل البحث عن الأماكن');
  }
});

/**
 * GET /autocomplete
 * Get autocomplete suggestions
 */
app.get('/autocomplete', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { query, limit = '5', biasPosition } = req.query;

    if (!query) {
      return badRequest(res, 'Search query is required', 'استعلام البحث مطلوب');
    }

    let biasCoords: Coordinate | undefined;
    if (biasPosition) {
      const [lat, lng] = (biasPosition as string).split(',').map(Number);
      if (!isNaN(lat) && !isNaN(lng)) {
        biasCoords = { latitude: lat, longitude: lng };
      }
    }

    const results = await searchPlaces(query as string, biasCoords);

    // Format as suggestions
    const suggestions = results.slice(0, parseInt(limit as string)).map(place => ({
      text: place.address,
      placeId: place.placeId,
      name: place.name,
    }));

    return sendSuccess(res, {
      suggestions,
      count: suggestions.length,
    });
  } catch (error) {
    console.error('Autocomplete error:', error);
    return serverError(res, 'Failed to get suggestions', 'فشل الحصول على الاقتراحات');
  }
});

/**
 * GET /reverse-geocode
 * Convert coordinates to address
 */
app.get('/reverse-geocode', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { latitude, longitude, lat, lng } = req.query;

    const latValue = parseFloat((latitude || lat) as string);
    const lngValue = parseFloat((longitude || lng) as string);

    if (isNaN(latValue) || isNaN(lngValue)) {
      return badRequest(res, 'Valid latitude and longitude are required', 'خط العرض وخط الطول صالحان مطلوبان');
    }

    const result = await reverseGeocodeMap({ latitude: latValue, longitude: lngValue });

    if (!result) {
      return notFound(res, 'No address found for this location', 'لم يتم العثور على عنوان لهذا الموقع');
    }

    return sendSuccess(res, {
      placeId: result.placeId,
      address: result.address,
      name: result.name,
      coordinates: {
        latitude: latValue,
        longitude: lngValue,
      },
    });
  } catch (error) {
    console.error('Reverse geocode error:', error);
    return serverError(res, 'Failed to reverse geocode', 'فشل التحويل العكسي للإحداثيات');
  }
});

/**
 * GET /place
 * Get place details by ID
 */
app.get('/place', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { placeId } = req.query;

    if (!placeId) {
      return badRequest(res, 'Place ID is required', 'معرف المكان مطلوب');
    }

    const place = await getPlaceDetails(placeId as string);

    if (!place) {
      return notFound(res, 'Place not found', 'المكان غير موجود');
    }

    return sendSuccess(res, place);
  } catch (error) {
    console.error('Get place error:', error);
    return serverError(res, 'Failed to get place details', 'فشل الحصول على تفاصيل المكان');
  }
});

/**
 * POST /route
 * Calculate route between points
 */
app.post('/route', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { origin, destination, waypoints } = req.body;

    if (!origin || !destination) {
      return badRequest(res, 'Origin and destination are required', 'نقطة الانطلاق والوجهة مطلوبتان');
    }

    const routeInfo = await calculateRouteMap(
      origin,
      destination,
      waypoints
    );

    return sendSuccess(res, {
      route: routeInfo,
      origin,
      destination,
      waypoints,
      summary: {
        distanceKm: routeInfo.distance / 1000,
        distanceText: `${(routeInfo.distance / 1000).toFixed(1)} km`,
        durationSeconds: routeInfo.duration,
        durationText: formatDuration(routeInfo.duration),
      },
    });
  } catch (error) {
    console.error('Calculate route error:', error);
    return serverError(res, 'Failed to calculate route', 'فشل حساب المسار');
  }
});

/**
 * POST /eta
 * Calculate ETA from current position to multiple destinations
 */
app.post('/eta', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { origin, destinations } = req.body;

    if (!origin || !destinations || !Array.isArray(destinations) || destinations.length === 0) {
      return badRequest(res, 'Origin and at least one destination are required', 'نقطة الانطلاق ووجهة واحدة على الأقل مطلوبة');
    }

    if (destinations.length > 10) {
      return badRequest(res, 'Maximum 10 destinations allowed', 'الحد الأقصى 10 وجهات مسموح بها');
    }

    // Calculate routes to each destination
    const etas = await Promise.all(
      destinations.map(async (dest: Coordinate) => {
        try {
          const routeInfo = await calculateRouteMap(origin, dest);
          return {
            destination: dest,
            distance: routeInfo.distance,
            distanceKm: routeInfo.distance / 1000,
            duration: routeInfo.duration,
            durationText: formatDuration(routeInfo.duration),
            error: null,
          };
        } catch (error) {
          return {
            destination: dest,
            distance: 0,
            distanceKm: 0,
            duration: 0,
            durationText: 'N/A',
            error: 'Failed to calculate route',
          };
        }
      })
    );

    return sendSuccess(res, {
      origin,
      etas,
    });
  } catch (error) {
    console.error('Calculate ETA error:', error);
    return serverError(res, 'Failed to calculate ETA', 'فشل حساب وقت الوصول المتوقع');
  }
});

/**
 * POST /distance-matrix
 * Calculate distances between multiple origins and destinations
 */
app.post('/distance-matrix', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { origins, destinations } = req.body;

    if (!origins || !destinations || !Array.isArray(origins) || !Array.isArray(destinations)) {
      return badRequest(res, 'Origins and destinations arrays are required', 'مصفوفات نقاط الانطلاق والوجهات مطلوبة');
    }

    if (origins.length > 10 || destinations.length > 10) {
      return badRequest(res, 'Maximum 10 origins and 10 destinations allowed', 'الحد الأقصى 10 نقاط انطلاق و10 وجهات');
    }

    // Calculate matrix
    const matrix = await Promise.all(
      origins.map(async (origin: Coordinate) => {
        return Promise.all(
          destinations.map(async (dest: Coordinate) => {
            try {
              const routeInfo = await calculateRouteMap(origin, dest);
              return {
                distance: routeInfo.distance,
                duration: routeInfo.duration,
                status: 'OK',
              };
            } catch {
              return {
                distance: 0,
                duration: 0,
                status: 'FAILED',
              };
            }
          })
        );
      })
    );

    return sendSuccess(res, {
      origins,
      destinations,
      matrix,
    });
  } catch (error) {
    console.error('Distance matrix error:', error);
    return serverError(res, 'Failed to calculate distance matrix', 'فشل حساب مصفوفة المسافات');
  }
});

/**
 * GET /nearby
 * Find nearby places
 */
app.get('/nearby', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { latitude, longitude, radius = '1000', type } = req.query;

    const lat = parseFloat(latitude as string);
    const lng = parseFloat(longitude as string);

    if (isNaN(lat) || isNaN(lng)) {
      return badRequest(res, 'Valid latitude and longitude are required', 'خط العرض وخط الطول صالحان مطلوبان');
    }

    // Use search with location bias for nearby places
    const searchQuery = type || 'places';
    const results = await searchPlaces(searchQuery as string, { latitude: lat, longitude: lng });

    // Filter by radius (approximate)
    const radiusKm = parseInt(radius as string) / 1000;
    const filteredResults = results.filter(place => {
      const distance = calculateHaversineDistance(
        { latitude: lat, longitude: lng },
        place.coordinates
      );
      return distance <= radiusKm;
    });

    return sendSuccess(res, {
      places: filteredResults,
      count: filteredResults.length,
    });
  } catch (error) {
    console.error('Nearby places error:', error);
    return serverError(res, 'Failed to find nearby places', 'فشل العثور على الأماكن القريبة');
  }
});

// Helper function to calculate distance between two coordinates
function calculateHaversineDistance(coord1: Coordinate, coord2: Coordinate): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(coord2.latitude - coord1.latitude);
  const dLon = toRad(coord2.longitude - coord1.longitude);
  const lat1 = toRad(coord1.latitude);
  const lat2 = toRad(coord2.latitude);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'location' });
});

// Service info
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      message: 'Jeeny Location Service',
      endpoints: [
        'GET /search - Search places',
        'GET /autocomplete - Get autocomplete suggestions',
        'GET /reverse-geocode - Convert coordinates to address',
        'GET /place - Get place details by ID',
        'POST /route - Calculate route',
        'POST /eta - Calculate ETA to multiple destinations',
        'POST /distance-matrix - Calculate distance matrix',
        'GET /nearby - Find nearby places',
      ],
    },
  });
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Location service listening on port ${PORT}`);
});

export default app;
