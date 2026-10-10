import { Plugin } from '@opencode/plugin';

export default Plugin.define({
  id: 'context-window-filter',
  async setup(ctx) {
    const raw = ctx.options?.minContext;
    const minContext =
      typeof raw === 'number' && Number.isFinite(raw) && raw >= 0
        ? raw
        : 131072;

    await ctx.model.transform((editor) => {
      for (const m of editor.list()) {
        const context =
          typeof m?.limit?.context === 'number' ? m.limit.context : 0;
        if (context < minContext) editor.remove(m.providerID, m.id);
      }
    });
  },
});
