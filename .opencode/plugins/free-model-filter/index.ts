import { Plugin } from '@opencode/plugin';

export default Plugin.define({
  id: 'free-model-filter',
  async setup(ctx) {
    const freeOnly = ctx.options?.freeOnly !== false;
    const freeMatch =
      typeof ctx.options?.freeMatch === 'string'
        ? ctx.options.freeMatch.toLowerCase()
        : ':free';

    const isFree = (m: any): boolean => {
      const id = String(m?.id ?? m?.modelID ?? '').toLowerCase();
      if (id.includes(freeMatch)) return true;
      const cost = m?.cost;
      if (Array.isArray(cost) && cost.length) {
        return cost.every(
          (c: any) =>
            c.input === 0 &&
            c.output === 0 &&
            (c.cache?.read ?? 0) === 0 &&
            (c.cache?.write ?? 0) === 0,
        );
      }
      return false;
    };

    await ctx.model.transform((editor) => {
      for (const m of editor.list()) {
        if (isFree(m) !== freeOnly) editor.remove(m.providerID, m.id);
      }
    });
  },
});
