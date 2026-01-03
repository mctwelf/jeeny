/**
 * Google Maps Platform Client
 *
 * Handles location services including geocoding, routing, and places.
 * Replaces AWS Location Service.
 */

import {
  Client,
  DirectionsRequest,
  PlaceAutocompleteRequest,
  ReverseGeocodeRequest,
  PlaceDetailsRequest,
  DistanceMatrixRequest,
  TravelMode,
  UnitSystem,
  Language,
} from '@googlemaps/google-maps-services-js';

let mapsClient: Client;

export const getMapsClient = (): Client => {
  if (!mapsClient) {
    mapsClient = new Client({});
  }
  return mapsClient;
};

const getApiKey = (): string => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_MAPS_API_KEY environment variable is not set');
  }
  return apiKey;
};

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface RouteResult {
  distance: number; // in meters
  duration: number; // in seconds
  route: Coordinate[];
  polyline: string;
}

export interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
  coordinates: Coordinate;
}

/**
 * Calculate route between two points
 */
export const calculateRoute = async (
  origin: Coordinate,
  destination: Coordinate,
  waypoints?: Coordinate[]
): Promise<RouteResult> => {
  const client = getMapsClient();

  const request: DirectionsRequest = {
    params: {
      key: getApiKey(),
      origin: `${origin.latitude},${origin.longitude}`,
      destination: `${destination.latitude},${destination.longitude}`,
      mode: TravelMode.driving,
      units: UnitSystem.metric,
      alternatives: false,
    },
  };

  if (waypoints && waypoints.length > 0) {
    request.params.waypoints = waypoints.map(
      (wp) => `${wp.latitude},${wp.longitude}`
    );
  }

  const response = await client.directions(request);

  if (response.data.status !== 'OK' || !response.data.routes.length) {
    throw new Error(`Directions API error: ${response.data.status}`);
  }

  const route = response.data.routes[0];
  const leg = route.legs[0];

  // Decode polyline to coordinates
  const decodedRoute = decodePolyline(route.overview_polyline.points);

  return {
    distance: leg.distance.value,
    duration: leg.duration.value,
    route: decodedRoute,
    polyline: route.overview_polyline.points,
  };
};

/**
 * Reverse geocode coordinates to address
 */
export const reverseGeocode = async (
  coordinates: Coordinate
): Promise<PlaceResult | null> => {
  const client = getMapsClient();

  const request: ReverseGeocodeRequest = {
    params: {
      key: getApiKey(),
      latlng: `${coordinates.latitude},${coordinates.longitude}`,
      language: Language.ar, // Arabic for Mauritania
    },
  };

  const response = await client.reverseGeocode(request);

  if (response.data.status !== 'OK' || !response.data.results.length) {
    return null;
  }

  const result = response.data.results[0];

  return {
    placeId: result.place_id,
    name: result.formatted_address.split(',')[0],
    address: result.formatted_address,
    coordinates,
  };
};

/**
 * Search for places with autocomplete
 */
export const searchPlaces = async (
  query: string,
  location?: Coordinate,
  radius?: number
): Promise<PlaceResult[]> => {
  const client = getMapsClient();

  const request: PlaceAutocompleteRequest = {
    params: {
      key: getApiKey(),
      input: query,
      language: Language.ar,
      components: ['country:mr'], // Mauritania
    },
  };

  if (location) {
    request.params.location = `${location.latitude},${location.longitude}`;
    request.params.radius = radius || 50000; // 50km default
  }

  const response = await client.placeAutocomplete(request);

  if (response.data.status !== 'OK') {
    return [];
  }

  // Get details for each prediction
  const places: PlaceResult[] = [];
  for (const prediction of response.data.predictions.slice(0, 5)) {
    const details = await getPlaceDetails(prediction.place_id);
    if (details) {
      places.push(details);
    }
  }

  return places;
};

/**
 * Get place details by place ID
 */
export const getPlaceDetails = async (
  placeId: string
): Promise<PlaceResult | null> => {
  const client = getMapsClient();

  const request: PlaceDetailsRequest = {
    params: {
      key: getApiKey(),
      place_id: placeId,
      fields: ['place_id', 'name', 'formatted_address', 'geometry'],
      language: Language.ar,
    },
  };

  const response = await client.placeDetails(request);

  if (response.data.status !== 'OK' || !response.data.result) {
    return null;
  }

  const result = response.data.result;

  return {
    placeId: result.place_id!,
    name: result.name || '',
    address: result.formatted_address || '',
    coordinates: {
      latitude: result.geometry!.location.lat,
      longitude: result.geometry!.location.lng,
    },
  };
};

/**
 * Calculate ETA between multiple origins and destinations
 */
export const calculateETA = async (
  origins: Coordinate[],
  destinations: Coordinate[]
): Promise<{ duration: number; distance: number }[][]> => {
  const client = getMapsClient();

  const request: DistanceMatrixRequest = {
    params: {
      key: getApiKey(),
      origins: origins.map((o) => `${o.latitude},${o.longitude}`),
      destinations: destinations.map((d) => `${d.latitude},${d.longitude}`),
      mode: TravelMode.driving,
      units: UnitSystem.metric,
    },
  };

  const response = await client.distancematrix(request);

  if (response.data.status !== 'OK') {
    throw new Error(`Distance Matrix API error: ${response.data.status}`);
  }

  return response.data.rows.map((row) =>
    row.elements.map((element) => ({
      duration: element.duration?.value || 0,
      distance: element.distance?.value || 0,
    }))
  );
};

/**
 * Decode Google Maps polyline to coordinates
 */
const decodePolyline = (encoded: string): Coordinate[] => {
  const coordinates: Coordinate[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    coordinates.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return coordinates;
};
