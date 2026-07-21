import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteLogout, postLogin, postRegister } from './auth.api';
import { authQueryKeys } from './auth.queryKeys';

export const useLogin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postLogin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authQueryKeys.all });
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
    mutationFn: deleteLogout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authQueryKeys.all });
    },
  });
};
