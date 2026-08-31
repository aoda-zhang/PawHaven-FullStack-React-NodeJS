import type { SessionDto } from '@pawhaven/shared/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { postLogin, postLogout, postRegister } from './auth.api';
import { authQueryKeys } from './auth.queryKeys';

import type { ProfileType } from '@/features/Auth/types';
import { landingQueryKeys } from '@/features/Landing/api/landing.queryKeys';
import { useReduxDispatch } from '@/hooks/reduxHooks';
import { emptyProfile, setProfile } from '@/store/globalReducer';

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
  const dispatch = useReduxDispatch();
  return useMutation({
    mutationFn: postLogout,
    onSuccess: () => {
      dispatch(setProfile(emptyProfile));
      queryClient.invalidateQueries({ queryKey: authQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: landingQueryKeys.all });
    },
  });
};
