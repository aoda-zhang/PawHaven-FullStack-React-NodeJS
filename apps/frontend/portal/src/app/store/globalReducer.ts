import { storageTool } from '@pawhaven/frontend-core';
import { localeCodes } from '@pawhaven/shared';
import { createSlice } from '@reduxjs/toolkit';

import { reducerNames } from './reducerNames';
import { useReduxSelector } from './reduxHooks';
import type { ReduxState } from './reduxStore';

import type { ProfileType } from '@/pages/auth/types';
import { StorageKeys } from '@/shared/constants/storageKeys';

export interface GlobalStateType {
  profile: ProfileType;
  locale: string;
  isSysMaintain: boolean;
}

export const emptyProfile: ProfileType = {
  baseUserInfo: {
    email: '',
    userID: '',
    globalMenuUpdateAt: '',
    globalRouterUpdateAt: '',
  },
  accessToken: '',
};

const initialState: GlobalStateType = {
  profile: emptyProfile,
  locale: storageTool.get(StorageKeys.i18nextLng) || localeCodes['en-US'],
  isSysMaintain: true,
};

export const globalReducer = createSlice({
  name: reducerNames.global,
  initialState,
  reducers: {
    setProfile: (state, action) => {
      state.profile = action.payload;
    },
  },
});

export const { setProfile } = globalReducer.actions;
export const useGlobalState = () => {
  return useReduxSelector(
    (state: ReduxState) => state?.[reducerNames.global] ?? {},
  ) as GlobalStateType;
};
