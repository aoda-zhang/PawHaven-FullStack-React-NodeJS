interface NominatimResponse {
  display_name?: string;
  address?: {
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    country?: string;
  };
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';
const USER_AGENT = 'PawHaven/1.0 (contact: pawhaven@example.com)';

/**
 * Builds a human-readable address string from Nominatim address components.
 *
 * @param address - The address object from Nominatim response
 * @returns A comma-separated address string, or empty string if no address
 */
const buildDisplayName = (address: NominatimResponse['address']): string => {
  if (!address) return '';
  const { road, suburb, city, town, village, county, state, country } = address;
  const cityPart = city ?? town ?? village;
  return [road, suburb, cityPart, county, state, country]
    .filter(Boolean)
    .join(', ');
};

/**
 * Converts geographic coordinates to a human-readable address using OpenStreetMap's Nominatim API.
 *
 * @param latitude - The latitude coordinate
 * @param longitude - The longitude coordinate
 * @param language - The language code for the address (defaults to 'en')
 * @returns A promise that resolves to the formatted address string
 * @throws Error if the reverse geocoding API request fails
 */
export const reverseGeocode = async (
  latitude: number,
  longitude: number,
  language = 'en',
): Promise<string> => {
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set('format', 'json');
  url.searchParams.set('lat', String(latitude));
  url.searchParams.set('lon', String(longitude));

  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, 'Accept-Language': language },
  });
  if (!response.ok) {
    throw new Error(`Reverse geocoding failed with status ${response.status}`);
  }

  const data = (await response.json()) as NominatimResponse;
  return data.display_name ?? buildDisplayName(data.address);
};
