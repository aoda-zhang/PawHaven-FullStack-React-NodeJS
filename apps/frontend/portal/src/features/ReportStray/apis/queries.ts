import { showToast } from '@pawhaven/ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { createReportStray } from './requests';

export const reportStrayQueryKeys = {
  all: ['reportStray'] as const,
  create: () => [...reportStrayQueryKeys.all, 'create'] as const,
};

export const useCreateReportStray = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationKey: reportStrayQueryKeys.create(),
    mutationFn: (data: Parameters<typeof createReportStray>[0]) =>
      createReportStray(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportStrayQueryKeys.all });
      showToast({
        type: 'success',
        message: t('reportStray.success'),
      });
      navigate('/');
    },
    onError: () => {
      showToast({
        type: 'error',
        message: t('reportStray.error'),
      });
    },
  });
};
