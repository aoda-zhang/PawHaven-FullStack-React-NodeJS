import { useMutation, useQueryClient } from '@tanstack/react-query';

import { postLogin, postLogout, postRegister } from './auth.api';

import { sharedQueryKeys } from '@/shared/constants/sharedQueryKeys';

export const useLogin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['auth', 'login'],
    mutationFn: postLogin,
    onSuccess: (session) => {
      queryClient.setQueryData(
        sharedQueryKeys.auth.currentUser(session.user.userId),
        session.user,
      );
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['auth', 'register'],
    mutationFn: postRegister,
    onSuccess: (session) => {
      queryClient.setQueryData(
        sharedQueryKeys.auth.currentUser(session.user.userId),
        session.user,
      );
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['auth', 'logout'],
    mutationFn: postLogout,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['bootstrap'] });
      queryClient.removeQueries({
        queryKey: sharedQueryKeys.rescueCases.all(),
      });
      queryClient.removeQueries({ queryKey: sharedQueryKeys.home.all() });
    },
  });
};
