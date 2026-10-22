import { ReverseGeocodeResultSchema } from '@pawhaven/shared/types';

import { apiClient } from '@/shared/utils/apiClient';

/**
 * Resolves coordinates through core-service. The browser no longer talks to
 * Nominatim directly, so the third party never sees the user's IP address.
 */
export const reverseGeocode = async (
  latitude: number,
  longitude: number,
  language = 'en',
): Promise<string> => {
  const data = await apiClient.get<unknown>('/core/geocode/reverse', {
    lat: latitude,
    lon: longitude,
    lang: language,
  });

  return ReverseGeocodeResultSchema.parse(data).address;
};
