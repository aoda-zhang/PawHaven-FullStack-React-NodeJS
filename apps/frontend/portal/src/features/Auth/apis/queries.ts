import type { CredentialsDto } from '@pawhaven/shared/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import type { ProfileType } from '../types';

import * as AuthAPI from './requests';

import { landingQueryKeys } from '@/features/queryKeys';
import { useReduxDispatch } from '@/hooks/reduxHooks';
import { routePaths } from '@/router/routePaths';
import { emptyProfile, setProfile } from '@/store/globalReducer';

export const authQueryKeys = {
  all: ['auth'] as const,
  currentUser: () => [...authQueryKeys.all, 'me'] as const,
  login: () => [...authQueryKeys.all, 'login'] as const,
  register: () => [...authQueryKeys.all, 'register'] as const,
  logout: () => [...authQueryKeys.all, 'logout'] as const,
};

export const useCurrentUser = () => {
  return useQuery({
    queryKey: authQueryKeys.currentUser(),
    queryFn: () => AuthAPI.getMe(),
    retry: false,
    staleTime: Infinity,
  });
};

export const useLogin = () => {
  const navigate = useNavigate();
  const dispatch = useReduxDispatch();
  const queryClient = useQueryClient();
  return useMutation<ProfileType, Error, CredentialsDto>({
    mutationKey: authQueryKeys.login(),
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
    mutationKey: authQueryKeys.register(),
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
    mutationKey: authQueryKeys.logout(),
    mutationFn: () => AuthAPI.logout(),
    onSettled: () => {
      dispatch(setProfile(emptyProfile));
      queryClient.clear();
      navigate(routePaths.login);
    },
  });
};
