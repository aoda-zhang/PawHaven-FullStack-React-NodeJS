import { useMutation, useQueryClient } from '@tanstack/react-query';

import { postLogin, postLogout, postRegister } from './auth.api';

import { bootstrapQueryKeys } from '@/app/init/bootstrap.queryKeys';
import { sharedQueryKeys } from '@/shared/constants/sharedQueryKeys';

export const useLogin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['auth', 'login'],
    mutationFn: postLogin,
    onSuccess: async (session) => {
      queryClient.setQueryData(
        sharedQueryKeys.auth.currentUser(session.user.userId),
        session.user,
      );
      queryClient.invalidateQueries({ queryKey: bootstrapQueryKeys.all() });
      await queryClient.refetchQueries({
        queryKey: bootstrapQueryKeys.all(),
      });
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationKey: ['auth', 'register'],
    mutationFn: postRegister,
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['auth', 'logout'],
    mutationFn: postLogout,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: bootstrapQueryKeys.all() });
      queryClient.removeQueries({
        queryKey: sharedQueryKeys.rescueCases.all(),
      });
      queryClient.removeQueries({ queryKey: sharedQueryKeys.home.all() });
    },
  });
};
