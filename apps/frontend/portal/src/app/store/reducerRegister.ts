// All reducers should be registered here for centralized management and scalability

import { globalReducer } from './globalReducer';
import { reducerNames } from './reducerNames';

export const combinedReducers = {
  [reducerNames.global]: globalReducer.reducer,
};
