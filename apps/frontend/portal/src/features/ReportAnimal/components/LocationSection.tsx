import type { ReportAnimalFormValues } from '@pawhaven/shared/types';
import { Button } from '@pawhaven/ui';
import { FormInput } from '@pawhaven/ui/form';
import { Loader2, MapPin } from 'lucide-react';
import { useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { reverseGeocode } from '@/utils/reverseGeocode';

const COORD_PRECISION = 6;
type GeoState = 'idle' | 'loading' | 'error';
type GeocodingState = 'idle' | 'resolving' | 'error';

export const LocationSection = () => {
  const { t, i18n } = useTranslation();
  const { control, setValue } = useFormContext<ReportAnimalFormValues>();
  const [geoState, setGeoState] = useState<GeoState>('idle');
  const [geoError, setGeoError] = useState('');
  const [geocodingState, setGeocodingState] = useState<GeocodingState>('idle');

  const latitude = useWatch({ control, name: 'latitude' });
  const longitude = useWatch({ control, name: 'longitude' });
  const address = useWatch({ control, name: 'address' });
  const hasCoordinates = latitude !== null && longitude !== null;
  const isLocating = geoState === 'loading' || geocodingState === 'resolving';

  const resolveAddress = async (lat: number, lng: number) => {
    setGeocodingState('resolving');
    try {
      const placeName = await reverseGeocode(lat, lng, i18n.language);
      if (placeName) {
        setValue('address', placeName, { shouldValidate: true });
        setGeocodingState('idle');
      } else {
        setGeocodingState('error');
      }
    } catch {
      setGeocodingState('error');
    }
  };

  const requestLocation = () => {
    if (!('geolocation' in navigator)) {
      setGeoState('error');
      setGeoError(t('reportAnimal.geolocation_not_supported'));
      return;
    }
    setGeoState('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setValue('latitude', lat);
        setValue('longitude', lng);
        setGeoState('idle');
        resolveAddress(lat, lng).catch(() => undefined);
      },
      (error) => {
        setGeoState('error');
        setGeoError(error.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const formatCoord = (value: number) => value.toFixed(COORD_PRECISION);

  const renderMapContent = () => {
    if (isLocating) {
      return (
        <div className="flex flex-col items-center gap-2 text-center">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
          <p className="text-text-secondary text-sm">
            {geocodingState === 'resolving'
              ? t('reportAnimal.geocoding_address')
              : t('reportAnimal.getting_location')}
          </p>
        </div>
      );
    }
    if (geoState === 'error') {
      return (
        <div className="px-4 text-center">
          <p className="text-error text-sm">
            {t('reportAnimal.geolocation_error', { message: geoError })}
          </p>
        </div>
      );
    }
    if (hasCoordinates && address) {
      return (
        <p className="text-text-secondary px-4 text-center text-sm">{address}</p>
      );
    }
    if (hasCoordinates) {
      return (
        <p className="text-text-secondary px-4 text-center text-sm">
          {t('reportAnimal.map_preview', {
            lat: formatCoord(latitude),
            lng: formatCoord(longitude),
          })}
        </p>
      );
    }
    return (
      <div className="text-center">
        <MapPin className="text-primary mx-auto mb-2 h-8 w-8" />
        <p className="text-text-secondary text-sm">
          {t('reportAnimal.map_placeholder')}
        </p>
      </div>
    );
  };

  return (
    <div>
      <div className="bg-muted border-border mb-4 flex h-40 items-center justify-center rounded-xl border">
        {renderMapContent()}
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={requestLocation}
        loading={isLocating}
        disabled={isLocating}
        className="mb-4 w-full"
      >
        {!isLocating && <MapPin className="h-4 w-4" />}
        {t('reportAnimal.use_current_location')}
      </Button>
      {geocodingState === 'error' && (
        <p className="text-text-secondary mb-3 text-xs">
          {t('reportAnimal.geocoding_failed')}
        </p>
      )}
      <FormInput
        name="address"
        label={t('reportAnimal.landmark_label')}
        placeholder={t('reportAnimal.landmark_hint')}
        required
      />
    </div>
  );
};
