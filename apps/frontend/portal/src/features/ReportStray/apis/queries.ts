import { showToast } from '@pawhaven/ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { createReportStray } from './requests';

export const reportStrayQueryKeys = {
  all: ['reportStray'] as const,
  create: () => [...reportStrayQueryKeys.all, 'create'] as const,
};

export const useCreateReportStray = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: reportStrayQueryKeys.create(),
    mutationFn: (data: Parameters<typeof createReportStray>[0]) =>
      createReportStray(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportStrayQueryKeys.all });
      showToast({
        type: 'success',
        message: 'Report submitted successfully!',
      });
      navigate('/');
    },
    onError: () => {
      showToast({
        type: 'error',
        message: 'Failed to submit report. Please try again.',
      });
    },
  });
};
