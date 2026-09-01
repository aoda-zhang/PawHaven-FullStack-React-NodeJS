import '@testing-library/jest-dom/vitest';

import type { AnimalReportDto } from '@pawhaven/shared/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createReportAnimal } from '../reportAnimal.api';

import { apiClient } from '@/utils/apiClient';

vi.mock('@/utils/apiClient', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

const mockedPost = vi.mocked(apiClient.post);

const validPayload: AnimalReportDto = {
  animalType: 'dog',
  age: 'adult',
  size: 'medium',
  animalCount: 1,
  appearance: {
    color: 'brown',
  },
  location: {
    address: 'PawHaven Street 1',
    latitude: 52.52,
    longitude: 13.405,
  },
  status: 'friendly',
  description: 'Found a friendly brown dog near the park',
  reporterPhotos: [
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD',
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg',
  ],
  contactInfo: {
    name: 'Jane Doe',
    phone: '+49 170 1234567',
  },
};

describe('createReportAnimal', () => {
  beforeEach(() => {
    mockedPost.mockReset();
  });

  it('posts the AnimalReportDto payload to /core/report-animal', async () => {
    mockedPost.mockResolvedValue({ id: 'stray-123' });

    await createReportAnimal(validPayload);

    expect(mockedPost).toHaveBeenCalledTimes(1);
    expect(mockedPost).toHaveBeenCalledWith(
      '/core/report-animal',
      validPayload,
    );
  });

  it('resolves with the created report id', async () => {
    mockedPost.mockResolvedValue({ id: 'stray-abc123' });

    const result = await createReportAnimal(validPayload);

    expect(result).toEqual({ id: 'stray-abc123' });
  });
});
