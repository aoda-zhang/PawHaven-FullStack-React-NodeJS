import '@testing-library/jest-dom/vitest';

import type { AnimalReportDto } from '@pawhaven/shared/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createReportAnimal } from '../api/reportAnimal.api';

import { apiClient } from '@/shared/utils/apiClient';

vi.mock('@/shared/utils/apiClient', () => ({
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
  reporterPhotos: ['report-animal/a.jpg', 'report-animal/b.jpg'],
  contactInfo: {
    email: 'reporter@example.com',
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
