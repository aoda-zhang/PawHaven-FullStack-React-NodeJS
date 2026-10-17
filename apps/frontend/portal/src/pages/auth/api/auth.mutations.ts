import type { SessionDto } from '@pawhaven/shared/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { postLogin, postLogout, postRegister } from './auth.api';

import { bootstrapQueryKeys } from '@/app/api/bootstrap.queryKeys';
import { emptyProfile, setProfile } from '@/app/store/globalReducer';
import { useReduxDispatch } from '@/app/store/reduxHooks';
import type { ProfileType } from '@/pages/auth/types';
import { sharedQueryKeys } from '@/shared/constants/queryKeys';

const toProfile = (session: SessionDto): ProfileType => ({
  accessToken: '', // JWTs are httpOnly cookies set by the gateway, invisible to JS
  baseUserInfo: {
    email: session.user?.email ?? '',
    userID: session.user?.userId ?? '',
    globalMenuUpdateAt: '',
    globalRouterUpdateAt: '',
  },
});

export const useLogin = () => {
  const queryClient = useQueryClient();
  const dispatch = useReduxDispatch();
  return useMutation({
    mutationFn: postLogin,
    onSuccess: (data) => {
      dispatch(setProfile(toProfile(data)));
      queryClient.invalidateQueries({ queryKey: sharedQueryKeys.auth.all });
      queryClient.invalidateQueries({ queryKey: bootstrapQueryKeys.all });
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
  const dispatch = useReduxDispatch();
  return useMutation({
    mutationFn: postLogout,
    onSuccess: () => {
      dispatch(setProfile(emptyProfile));
      queryClient.invalidateQueries({ queryKey: sharedQueryKeys.auth.all });
      queryClient.invalidateQueries({ queryKey: bootstrapQueryKeys.all });
    },
  });
};
