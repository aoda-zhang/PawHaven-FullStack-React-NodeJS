export type { MenuItem, Menu } from './menu.schema.js';
export type { BootstrapData } from './bootstrap.schema.js';
export type {
  CredentialsDto,
  SessionDto,
  AuthUser,
  User,
} from './auth.schema.js';
export type { RescueAge, CreateRescueDto } from './rescue.schema.js';
export type { RescueListItem } from './rescue-list.schema.js';
export type {
  RescueDetail,
  RescueDetailAppearance,
  RescueDetailLocation,
  RescueDetailReporter,
  RescueDetailContactInfo,
} from './rescue-detail.schema.js';
export type { HeroStats } from './hero-stats.schema.js';
export type { AdoptablePet } from './adoptable-pet.schema.js';
export type { ApiResponseEnvelope } from './envelope.schema.js';
export type { HomeData } from './home.schema.js';

// schemas

export { MenuItemSchema, MenuSchema } from './menu.schema.js';
export { BootstrapDataSchema } from './bootstrap.schema.js';
export {
  CredentialsSchema,
  SessionSchema,
  AuthUserSchema,
  UserSchema,
} from './auth.schema.js';
export {
  AnimalStatusValues,
  AnimalStatusSchema,
  AnimalStatus,
} from './animal-status.js';
export {
  RescueAgeSchema,
  RescueAgeValues,
  AnimalAppearanceSchema,
  CreateRescueDtoSchema,
} from './rescue.schema.js';
export { RescueListItemSchema } from './rescue-list.schema.js';
export {
  RescueDetailSchema,
  RescueDetailAppearanceSchema,
  RescueDetailLocationSchema,
  RescueDetailReporterSchema,
  RescueDetailContactInfoSchema,
} from './rescue-detail.schema.js';
export { HeroStatsSchema } from './hero-stats.schema.js';
export { AdoptablePetSchema } from './adoptable-pet.schema.js';
export { ApiResponseEnvelopeSchema } from './envelope.schema.js';
export { HomeDataSchema } from './home.schema.js';

export {
  AnimalReportSchema,
  REPORT_PHOTO_LIMITS,
  reporterPhotosSchema,
  ANIMAL_TYPES,
  SIZES,
  BEHAVIORS,
  createReportAnimalFormSchema,
} from './report-animal.schema.js';
export type {
  AnimalReportDto,
  AnimalType,
  Size,
  Behavior,
  ReportAnimalFormMessages,
  ReportAnimalFormValues,
} from './report-animal.schema.js';

export {
  StoryTypeValues,
  StoryTypeSchema,
  StorySchema,
  CreateStoryDtoSchema,
  UpdateStoryDtoSchema,
} from './story.schema.js';
export type {
  StoryType,
  Story,
  CreateStoryDto,
  UpdateStoryDto,
} from './story.schema.js';
