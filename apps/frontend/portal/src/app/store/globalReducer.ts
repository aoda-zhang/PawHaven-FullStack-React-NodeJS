import { createSlice } from '@reduxjs/toolkit';

import { reducerNames } from './reducerNames';
import { useReduxSelector } from './reduxHooks';
import type { ReduxState } from './reduxStore';

export interface GlobalStateType {
  isSysMaintain: boolean;
}

const initialState: GlobalStateType = {
  isSysMaintain: true,
};

export const globalReducer = createSlice({
  name: reducerNames.global,
  initialState,
  reducers: {},
});

export const useGlobalState = () => {
  return useReduxSelector(
    (state: ReduxState) => state?.[reducerNames.global] ?? {},
  ) as GlobalStateType;
};
