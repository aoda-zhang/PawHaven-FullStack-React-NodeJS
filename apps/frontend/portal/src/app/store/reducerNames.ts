// `as const` gives each name a literal type, so state can be indexed by it
// without a cast.
export const reducerNames = {
  // key: The root key for persistence, usually 'root'
  root: 'root',
  global: 'global',
  rescue: 'rescue',
  bootstrap: 'bootstrap',
};
