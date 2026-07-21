import { useMutation } from '@tanstack/react-query';

import { createReportStray } from './reportStray.api';
import { reportStrayQueryKeys } from './reportStray.queryKeys';

export const useCreateReportStray = () => {
  return useMutation({
    mutationFn: createReportStray,
  });
};
