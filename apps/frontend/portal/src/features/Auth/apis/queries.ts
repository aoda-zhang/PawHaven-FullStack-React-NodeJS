import type { CredentialsDto, RouterHandle } from '@pawhaven/shared/types';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import type { ProfileType } from '../types';

import * as AuthAPI from './requests';

import { useReduxDispatch } from '@/hooks/reduxHooks';
import { setProfile } from '@/store/globalReducer';

export const useLogin = () => {
  const navigate = useNavigate();
  const dispatch = useReduxDispatch();
  return useMutation<ProfileType, Error, CredentialsDto>({
    mutationFn: (userInfo: CredentialsDto) => AuthAPI.login(userInfo),
    onSuccess: (loginInfo) => {
      dispatch(setProfile(loginInfo));
      navigate('/');
    },
  });
};

export const useVerify = (routerMeta: RouterHandle) => {
  return useQuery({
    queryKey: ['auth', 'verify'],
    queryFn: AuthAPI.verify,
    refetchOnMount: 'always',
    enabled: routerMeta?.isRequireUserLogin,
  });
};

export const useRegister = () => {
  const navigate = useNavigate();
  const dispatch = useReduxDispatch();
  return useMutation<ProfileType, Error, CredentialsDto>({
    mutationFn: (userInfo: CredentialsDto) => AuthAPI.register(userInfo),
    onSuccess: (loginInfo) => {
      dispatch(setProfile(loginInfo));
      navigate('/');
    },
  });
};
