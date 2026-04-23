export type RescueStatus =
  | 'pending'
  | 'inProgress'
  | 'treated'
  | 'recovering'
  | 'awaitingAdoption'
  | 'adopted'
  | 'failed';

export interface CreateRescueDto {
  animalID: string;
  name: string;
  img: string;
  description: string;
  location: string;
  rescueStatus?: RescueStatus;
}
