import type { FilterStatus } from './types';

export const FILTER_OPTIONS: Array<{ value: FilterStatus; labelKey: string }> =
  [
    { value: 'all', labelKey: 'rescue_cases.filter_all' },
    { value: 'pending', labelKey: 'common.rescue_status_pending' },
    { value: 'inProgress', labelKey: 'common.rescue_status_inProgress' },
    { value: 'recovering', labelKey: 'common.rescue_status_recovering' },
  ];
