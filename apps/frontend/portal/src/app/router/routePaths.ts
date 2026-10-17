export const routePaths = {
  home: '/',
  login: '/auth/login',
  register: '/auth/register',
  rescueGuides: '/rescue/guides',
  rescueCases: '/rescue-cases',
  rescueCaseDetail: '/rescue/detail/:animalID',
  reportAnimal: '/report-animal',
} as const;

export const routeSearchParams = {
  redirect: 'redirect',
} as const;
