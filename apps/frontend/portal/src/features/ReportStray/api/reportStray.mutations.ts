import { useMutation } from '@tanstack/react-query';

import { createReportStray } from './reportStray.api';

export const useCreateReportStray = () => {
  return useMutation({
    mutationFn: createReportStray,
  });
};
