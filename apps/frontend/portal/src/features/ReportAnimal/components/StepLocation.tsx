import { Loader2, MapPin } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { reverseGeocode } from '@/utils/reverseGeocode';

type GeoState = 'idle' | 'loading' | 'error';
type GeocodingState = 'idle' | 'resolving' | 'error';

const COORD_PRECISION = 6;

interface StepLocationProps {
  address: string;
  latitude: number | null;
  longitude: number | null;
  onAddressChange: (address: string) => void;
  onCoordinatesChange: (latitude: number, longitude: number) => void;
}

export const StepLocation = ({
  address,
  latitude,
  longitude,
  onAddressChange,
  onCoordinatesChange,
}: StepLocationProps) => {
  const { t, i18n } = useTranslation();
  const [geoState, setGeoState] = useState<GeoState>('idle');
  const [geoError, setGeoError] = useState('');
  const [geocodingState, setGeocodingState] = useState<GeocodingState>('idle');

  const hasCoordinates = latitude !== null && longitude !== null;

  const resolveAddress = async (lat: number, lng: number) => {
    setGeocodingState('resolving');
    try {
      const placeName = await reverseGeocode(lat, lng, i18n.language);
      if (placeName) {
        onAddressChange(placeName);
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
        onCoordinatesChange(lat, lng);
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

  const renderResolving = () => (
    <div className="flex items-center justify-center gap-2">
      <Loader2 className="text-primary h-4 w-4 animate-spin" />
      <p className="text-muted-foreground text-sm">
        {t('reportAnimal.geocoding_address')}
      </p>
    </div>
  );

  const renderCoordinateContent = (lat: number, lng: number) => {
    if (geocodingState === 'resolving') {
      return renderResolving();
    }
    if (address) {
      return <p className="text-muted-foreground text-sm">{address}</p>;
    }
    return (
      <p className="text-muted-foreground text-sm">
        {t('reportAnimal.map_preview', {
          lat: formatCoord(lat),
          lng: formatCoord(lng),
        })}
      </p>
    );
  };

  const renderMapContent = () => {
    if (geoState === 'loading') {
      return (
        <div className="flex flex-col items-center gap-2 text-center">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
          <p className="text-muted-foreground text-sm">
            {t('reportAnimal.getting_location')}
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
    if (hasCoordinates) {
      return (
        <div className="px-4 text-center">
          <MapPin className="text-primary mx-auto mb-2 h-8 w-8" />
          {renderCoordinateContent(latitude, longitude)}
        </div>
      );
    }
    return (
      <div className="text-center">
        <MapPin className="text-primary mx-auto mb-2 h-8 w-8" />
        <p className="text-muted-foreground text-sm">
          {t('reportAnimal.wizard.step1_map_placeholder')}
        </p>
      </div>
    );
  };

  return (
    <div>
      <h2 className="text-foreground mb-1 text-lg font-semibold">
        {t('reportAnimal.wizard.step1_title')}
      </h2>
      <p className="text-muted-foreground mb-5 text-sm">
        {t('reportAnimal.wizard.step1_subtitle')}
      </p>
      <div className="bg-muted border-border mb-4 flex h-40 items-center justify-center rounded-xl border">
        {renderMapContent()}
      </div>
      <button
        type="button"
        onClick={requestLocation}
        disabled={geoState === 'loading' || geocodingState === 'resolving'}
        className="text-primary hover:bg-primary-light mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-current py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
      >
        {geoState === 'loading' || geocodingState === 'resolving' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MapPin className="h-4 w-4" />
        )}
        {t('reportAnimal.use_current_location')}
      </button>
      {geocodingState === 'error' && (
        <p className="text-muted-foreground mb-3 text-xs">
          {t('reportAnimal.geocoding_failed')}
        </p>
      )}
      <div>
        <label className="text-foreground mb-1.5 block text-sm font-medium">
          {t('reportAnimal.wizard.step1_landmark_label')}
          <span className="text-error ml-0.5" aria-hidden="true">
            *
          </span>
        </label>
        <input
          type="text"
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          placeholder={t('reportAnimal.wizard.step1_landmark_hint')}
          className="border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/30 w-full rounded-xl border px-3 py-2.5 text-sm focus:ring-2 focus:outline-none"
        />
      </div>
    </div>
  );
};
