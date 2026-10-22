import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpClientService } from '@pawhaven/backend-core';
import {
  ReverseGeocodeQuerySchema,
  type ReverseGeocodeResult,
} from '@pawhaven/shared/types';

interface NominatimAddress {
  road?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
  county?: string;
  state?: string;
  country?: string;
}

interface NominatimResponse {
  display_name?: string;
  address?: NominatimAddress;
}

interface GeocodeConfig {
  url: string;
  userAgent: string;
  timeoutMs: number;
}

const GEOCODE_CLIENT = 'geocode';

const compact = (parts: Array<string | undefined>): string[] =>
  parts.filter((part): part is string => Boolean(part));

const buildDisplayName = (address: NominatimAddress | undefined): string => {
  if (!address) {
    return '';
  }

  return compact([
    address.road,
    address.suburb,
    address.city ?? address.town ?? address.village,
    address.county,
    address.state,
    address.country,
  ]).join(', ');
};

@Injectable()
export class GeocodeService {
  private readonly logger = new Logger(GeocodeService.name);

  private readonly geocodeClient =
    this.httpClientService.create(GEOCODE_CLIENT);

  constructor(
    private readonly httpClientService: HttpClientService,
    private readonly config: ConfigService,
  ) {}

  async reverse(query: unknown): Promise<ReverseGeocodeResult> {
    const parsed = ReverseGeocodeQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new BadRequestException('Invalid coordinates');
    }

    const { lat, lon, lang = 'en' } = parsed.data;
    const { url, userAgent, timeoutMs } =
      this.config.getOrThrow<GeocodeConfig>('geocode');

    const data = await this.geocodeClient.get<NominatimResponse>(url, {
      config: {
        params: { format: 'json', lat, lon, 'accept-language': lang },
        headers: { 'User-Agent': userAgent, Accept: 'application/json' },
        timeout: timeoutMs,
      },
    });

    return { address: data.display_name ?? buildDisplayName(data.address) };
  }
}
