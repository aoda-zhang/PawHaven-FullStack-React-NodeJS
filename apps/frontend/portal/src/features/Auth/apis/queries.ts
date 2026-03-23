import type { CredentialsDto } from '@pawhaven/shared/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import type { ProfileType } from '../types';

import * as AuthAPI from './requests';

import { landingQueryKeys } from '@/features/queryKeys';
import { useReduxDispatch } from '@/hooks/reduxHooks';
import { routePaths } from '@/router/routePaths';
import { emptyProfile, setProfile } from '@/store/globalReducer';

export const authMutationKeys = {
  login: ['auth', 'login'] as const,
  register: ['auth', 'register'] as const,
  logout: ['auth', 'logout'] as const,
};

export const useLogin = () => {
  const navigate = useNavigate();
  const dispatch = useReduxDispatch();
  const queryClient = useQueryClient();
  return useMutation<ProfileType, Error, CredentialsDto>({
    mutationKey: authMutationKeys.login,
    mutationFn: (userInfo: CredentialsDto) => AuthAPI.login(userInfo),
    onSuccess: async (loginInfo) => {
      dispatch(setProfile(loginInfo));
      queryClient.removeQueries({ queryKey: landingQueryKeys.all });
      await queryClient.invalidateQueries({ queryKey: landingQueryKeys.all });
      navigate('/');
    },
  });
};

export const useRegister = () => {
  const navigate = useNavigate();
  const dispatch = useReduxDispatch();
  const queryClient = useQueryClient();
  return useMutation<ProfileType, Error, CredentialsDto>({
    mutationKey: authMutationKeys.register,
    mutationFn: (userInfo: CredentialsDto) => AuthAPI.register(userInfo),
    onSuccess: async (loginInfo) => {
      dispatch(setProfile(loginInfo));
      queryClient.removeQueries({ queryKey: landingQueryKeys.all });
      await queryClient.invalidateQueries({ queryKey: landingQueryKeys.all });
      navigate('/');
    },
  });
};

export const useLogout = () => {
  const navigate = useNavigate();
  const dispatch = useReduxDispatch();
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, void>({
    mutationKey: authMutationKeys.logout,
    mutationFn: () => AuthAPI.logout(),
    onSettled: () => {
      dispatch(setProfile(emptyProfile));
      queryClient.clear();
      navigate(routePaths.login);
    },
  });
};
