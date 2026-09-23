import {
  AnimalFollowResultSchema,
  type AnimalFollowResult,
} from '@pawhaven/shared/types';

import { apiClient } from '@/utils/apiClient';

const ANIMAL_FOLLOW_URL = '/core/animal-follow';

export const followAnimal = async (
  animalId: string,
): Promise<AnimalFollowResult> => {
  const data = await apiClient.post<unknown>(
    `${ANIMAL_FOLLOW_URL}/${animalId}`,
  );
  return AnimalFollowResultSchema.parse(data);
};

export const unfollowAnimal = async (
  animalId: string,
): Promise<AnimalFollowResult> => {
  const data = await apiClient.put<unknown>(`${ANIMAL_FOLLOW_URL}/${animalId}`);
  return AnimalFollowResultSchema.parse(data);
};

export const getFollowStatus = async (
  animalId: string,
): Promise<AnimalFollowResult> => {
  const data = await apiClient.get<unknown>(
    `${ANIMAL_FOLLOW_URL}/${animalId}/status`,
  );
  return AnimalFollowResultSchema.parse(data);
};
