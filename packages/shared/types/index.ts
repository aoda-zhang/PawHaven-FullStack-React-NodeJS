export type { MenuItem, Menu } from './Menu.schema.js';
export type { BootstrapData } from './Bootstrap.schema.js';
export type {
  CredentialsDto,
  SessionDto,
  AuthUser,
  User,
} from './Auth.schema.js';
export type { UserStatus } from './UserStatus.js';
export type { RescueAge, CreateRescueDto } from './Rescue.schema.js';
export type { RescueListItem } from './RescueList.schema.js';
export type {
  RescueDetail,
  RescueDetailAppearance,
  RescueDetailLocation,
  RescueDetailReporter,
  RescueDetailContactInfo,
} from './RescueDetail.schema.js';
export type { HeroStats } from './HeroStats.schema.js';
export type { AdoptablePet } from './AdoptablePet.schema.js';
export type { ApiResponseEnvelope } from './Envelope.schema.js';
export type { HomeData } from './Home.schema.js';
export type {
  AnimalFollowStatus,
  AnimalFollowResult,
} from './AnimalFollow.schema.js';

// schemas

export { MenuItemSchema, MenuSchema } from './Menu.schema.js';
export { BootstrapDataSchema } from './Bootstrap.schema.js';
export {
  CredentialsSchema,
  SessionSchema,
  AuthUserSchema,
  UserSchema,
} from './Auth.schema.js';
export { userStatus, UserStatusSchema } from './UserStatus.js';
export {
  AnimalStatusValues,
  AnimalStatusSchema,
  AnimalStatus,
} from './AnimalStatus.js';
export {
  RescueAgeSchema,
  RescueAgeValues,
  AnimalAppearanceSchema,
  CreateRescueDtoSchema,
} from './Rescue.schema.js';
export { RescueListItemSchema } from './RescueList.schema.js';
export {
  RescueDetailSchema,
  RescueDetailAppearanceSchema,
  RescueDetailLocationSchema,
  RescueDetailReporterSchema,
  RescueDetailContactInfoSchema,
} from './RescueDetail.schema.js';
export { HeroStatsSchema } from './HeroStats.schema.js';
export { AdoptablePetSchema } from './AdoptablePet.schema.js';
export { ApiResponseEnvelopeSchema } from './Envelope.schema.js';
export { HomeDataSchema } from './Home.schema.js';
export {
  AnimalFollowStatusSchema,
  AnimalFollowResultSchema,
} from './AnimalFollow.schema.js';

export {
  guideLocales,
  GuideLocaleSchema,
  guideSlugs,
  GuideSlugSchema,
  guideCategories,
  GuideCategorySchema,
  guideSurfaces,
  GuideSurfaceSchema,
  guideProvenanceSchema,
  guideCatalogItemSchema,
  guideCatalogSchema,
  guideDocumentSchema,
  GuideDocumentsSchema,
  normalizeLocale,
} from './Guide.schema.js';
export type {
  GuideLocale,
  GuideSlug,
  GuideCategory,
  GuideSurface,
  GuideProvenance,
  GuideCatalogItem,
  GuideCatalog,
  GuideDocument,
} from './Guide.schema.js';

export {
  pdfSectionSchema,
  pdfContactItemSchema,
  pdfContactsSchema,
  pdfChecklistSchema,
  pdfProvenanceSchema,
} from './pdf/Data.schema.js';
export type {
  PdfSection,
  PdfContactItem,
  PdfContacts,
  PdfChecklist,
  PdfProvenance,
} from './pdf/Data.schema.js';

export {
  pdfPaperFormats,
  PdfPaperFormatSchema,
  pdfMarginSchema,
  pdfOptionsSchema,
} from './pdf/Options.schema.js';
export type {
  PdfOptions,
  PdfMargin,
  PdfPaperFormat,
} from './pdf/Options.schema.js';

export {
  AnimalReportSchema,
  REPORT_PHOTO_LIMITS,
  reporterPhotosSchema,
  ANIMAL_TYPES,
  SIZES,
  BEHAVIORS,
  createReportAnimalFormSchema,
} from './ReportAnimal.schema.js';
export type {
  AnimalReportDto,
  AnimalType,
  Size,
  Behavior,
  ReportAnimalFormMessages,
  ReportAnimalFormValues,
} from './ReportAnimal.schema.js';

export {
  StoryTypeValues,
  StoryTypeSchema,
  StorySchema,
  CreateStoryDtoSchema,
  UpdateStoryDtoSchema,
} from './Story.schema.js';
export type {
  StoryType,
  Story,
  CreateStoryDto,
  UpdateStoryDto,
} from './Story.schema.js';
