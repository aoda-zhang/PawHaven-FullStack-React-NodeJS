import { useMutation, useQueryClient } from '@tanstack/react-query';

import { postLogin, postLogout, postRegister } from './auth.api';
import { authQueryKeys } from './auth.queryKeys';

import { landingQueryKeys } from '@/features/Landing/api/landing.queryKeys';

export const useLogin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postLogin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: landingQueryKeys.all });
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: postRegister,
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postLogout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: landingQueryKeys.all });
    },
  });
};
