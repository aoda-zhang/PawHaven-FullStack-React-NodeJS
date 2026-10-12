import { Plugin } from '@opencode/plugin';

export default Plugin.define({
  id: 'coding-model-filter',
  async setup(ctx) {
    const requireTools = ctx.options?.requireTools !== false;

    await ctx.model.transform((editor) => {
      for (const m of editor.list()) {
        const isAvailable =
          m?.enabled !== false && (m?.status == null || m.status === 'active');
        const supportsTools = m?.capabilities?.tools === true;

        if (!isAvailable || (requireTools && !supportsTools)) {
          editor.remove(m.providerID, m.id);
        }
      }
    });
  },
});
