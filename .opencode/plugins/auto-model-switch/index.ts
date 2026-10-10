import { Plugin } from '@opencode/plugin';

type ModelRef = { providerID: string; modelID: string };

const normalize = (m: any): ModelRef | undefined => {
  if (!m) return undefined;
  const providerID = m.providerID ?? m.provider;
  const modelID = m.modelID ?? m.id;
  if (!providerID || !modelID) return undefined;
  return { providerID, modelID };
};

const contextOf = (m: any): number =>
  typeof m?.limit?.context === 'number' ? m.limit.context : 0;
const outputOf = (m: any): number =>
  typeof m?.limit?.output === 'number' ? m.limit.output : 0;

// Ranking balances two very different failure costs:
//
//   small context  -> the conversation dies mid-task and you restart (hard failure)
//   generic model  -> slightly worse answers, nothing breaks   (soft cost)
//
// So context leads and coding-specialisation only breaks ties *within* a context
// tier. Both signals are normalised to 0..1 before mixing.
//
// `capabilities.tools` is deliberately NOT a coding signal: the filter plugins
// already guarantee it for every surviving model, so it would be a constant that
// carries no ranking information while diluting the real ones.
const DEFAULT_W_CONTEXT = 0.7;

// Context is scored per *tier* rather than continuously. Continuous log scaling
// silently demotes every real model to a narrow band (a 256K vs a 1M window are
// only ~0.5 apart after scaling), which lets a keyword match overturn a 4x
// difference in window. Tiers make "bigger window first" an actual guarantee.
const CONTEXT_TIERS = [2_000_000, 1_000_000, 524_288, 262_144, 131_072];

// Within a context tier, a coding-specialised name outweighs the reasoning flag:
// naming a model after code is a far stronger signal than raw metadata carries.
const CODE_NAME_SHARE = 0.65;
const REASONING_SHARE = 0.35;

const contextScore = (m: any): number => {
  const c = contextOf(m);
  if (c <= 0) return 0;
  for (let i = 0; i < CONTEXT_TIERS.length; i++) {
    if (c >= CONTEXT_TIERS[i]) return 1 - i / CONTEXT_TIERS.length;
  }
  return 0;
};

const codingScore = (m: any): number => {
  const text = `${m?.id ?? ''} ${m?.name ?? ''}`.toLowerCase();
  let s = 0;
  if (/(code|coder|coding|program)/.test(text)) s += CODE_NAME_SHARE;
  if (m?.capabilities?.reasoning === true) s += REASONING_SHARE;
  return Math.min(1, s);
};

const totalScore = (m: any, wc: number, wk: number): number =>
  wc * contextScore(m) + wk * codingScore(m);

const compareByCapability = (
  a: any,
  b: any,
  wc: number,
  wk: number,
): number => {
  const byScore = totalScore(b, wc, wk) - totalScore(a, wc, wk);
  if (byScore !== 0) return byScore;
  const byOutput = outputOf(b) - outputOf(a);
  if (byOutput !== 0) return byOutput;
  return String(a?.id ?? '').localeCompare(String(b?.id ?? ''));
};

const formatSize = (n: number): string => {
  if (n >= 1_000_000)
    return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return `${n}`;
};

const annotated = /^#\d+ [^·]+· /;

const FAILED_EVENTS = new Set([
  'session.step.failed',
  'session.execution.failed',
]);
const MODEL_SELECTED = 'session.model.selected';

// Same failure is emitted twice (step + execution); count it once.
const DUPLICATE_WINDOW_MS = 5000;

const dataOf = (e: any): any => e?.data ?? e?.properties ?? {};
const sessionOf = (e: any): string | undefined => dataOf(e).sessionID;

export default Plugin.define({
  id: 'auto-model-switch',
  async setup(ctx) {
    const maxRetries =
      typeof ctx.options?.maxRetries === 'number' ? ctx.options.maxRetries : 1;
    const pinDefault = ctx.options?.pinDefault !== false;
    const annotate = ctx.options?.annotate !== false;

    const wContext =
      typeof ctx.options?.contextWeight === 'number'
        ? ctx.options.contextWeight
        : DEFAULT_W_CONTEXT;
    const wCoding = 1 - wContext;
    const rank = (a: any, b: any) =>
      compareByCapability(a, b, wContext, wCoding);

    // Ranked view of the FILTERED model set (other plugins' removals applied).
    // Filled asynchronously; the transform below only reads it synchronously,
    // because editor mutations after an `await` are not committed.
    let rankedCache: any[] = [];
    let cacheKey = '';

    const refreshCache = async (): Promise<boolean> => {
      try {
        const r: any = await ctx.model.list();
        const arr = Array.isArray(r) ? r : Array.isArray(r?.data) ? r.data : [];
        const ranked = arr.slice().sort(rank);
        const key = ranked.map((m: any) => `${m.providerID}/${m.id}`).join('|');
        if (key === cacheKey) return false;
        cacheKey = key;
        rankedCache = ranked;
        return true;
      } catch {
        return false;
      }
    };

    const refreshAndReload = async () => {
      if (!(await refreshCache())) return;
      try {
        await ctx.model.reload();
      } catch {}
    };

    await ctx.model.transform((editor) => {
      const ranked = rankedCache;
      if (ranked.length === 0) return;

      if (pinDefault) {
        const best = normalize(ranked[0]);
        if (best) {
          const current = editor.default.get();
          if (
            !current ||
            current.providerID !== best.providerID ||
            current.modelID !== best.modelID
          ) {
            editor.default.set(best.providerID, best.modelID);
          }
        }
      }

      if (annotate) {
        ranked.forEach((m: any, i: number) => {
          const prefix = `#${i + 1} ${formatSize(contextOf(m))} · `;
          editor.update(m.providerID, m.id, (model: any) => {
            model.name = `${prefix}${String(model.name ?? '').replace(annotated, '')}`;
          });
        });
      }
    });

    const sessionModel = new Map<string, ModelRef>();
    const failures = new Map<string, number>();
    const lastFailure = new Map<string, { key: string; at: number }>();

    const listModels = async (): Promise<any[]> => {
      try {
        const r: any = await ctx.model.list();
        return Array.isArray(r) ? r : Array.isArray(r?.data) ? r.data : [];
      } catch {
        return [];
      }
    };

    const resolveCurrent = async (
      sessionID: string,
    ): Promise<ModelRef | undefined> => {
      const tracked = sessionModel.get(sessionID);
      if (tracked) return tracked;
      try {
        const s: any = await ctx.session.get({ sessionID });
        return normalize(s?.model) ?? normalize(s?.data?.model);
      } catch {
        return undefined;
      }
    };

    const switchTo = async (
      sessionID: string,
      next: ModelRef,
    ): Promise<boolean> => {
      try {
        await ctx.session.switchModel({
          sessionID,
          model: { providerID: next.providerID, id: next.modelID },
        });
        return true;
      } catch {
        return false;
      }
    };

    // A model that returns a non-2xx status is unusable; move to the next one
    // down the ranking. No error-message parsing is involved.
    const onFailure = async (e: any) => {
      const data = dataOf(e);
      const err = data.error ?? {};

      const status = typeof err.status === 'number' ? err.status : undefined;
      if (status !== undefined && status >= 200 && status < 300) return;
      if (/abort/i.test(String(err.type ?? ''))) return;

      const sid = sessionOf(e);
      if (!sid) return;

      const signature = `${err.type ?? ''}|${status ?? ''}|${String(err.message ?? '').slice(0, 80)}`;
      const previous = lastFailure.get(sid);
      if (
        previous &&
        previous.key === signature &&
        Date.now() - previous.at < DUPLICATE_WINDOW_MS
      )
        return;
      lastFailure.set(sid, { key: signature, at: Date.now() });

      const current = await resolveCurrent(sid);
      if (!current) return;

      const key = `${sid}|${current.providerID}/${current.modelID}`;
      const count = (failures.get(key) ?? 0) + 1;
      failures.set(key, count);
      if (count < maxRetries) return;

      const ranked = rankedCache.length > 0 ? rankedCache : await listModels();
      const idx = ranked.findIndex(
        (p: any) =>
          p.providerID === current.providerID && p.modelID === current.modelID,
      );
      if (idx < 0 || idx + 1 >= ranked.length) return;

      const next = normalize(ranked[idx + 1]);
      if (!next) return;

      if (await switchTo(sid, next)) failures.set(key, 0);
    };

    const controller = new AbortController();
    void (async () => {
      try {
        for await (const event of ctx.event.subscribe({
          signal: controller.signal,
        })) {
          const e = event as any;
          try {
            const type = String(e?.type ?? '');
            const data = dataOf(e);

            if (type === 'model.updated') {
              await refreshAndReload();
              continue;
            }

            if (type === MODEL_SELECTED && data.model) {
              const ref = normalize(data.model);
              if (ref && data.sessionID) sessionModel.set(data.sessionID, ref);
              continue;
            }

            if (!FAILED_EVENTS.has(type)) continue;
            await onFailure(e);
          } catch {
            // One bad event must never kill the subscription.
          }
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError')
          console.error('[auto-model-switch] event stream ended:', err);
      }
    })();

    // Initial fill, plus delayed re-checks in case filters commit after setup.
    await refreshCache();
    for (const delay of [3000, 10000, 30000]) {
      setTimeout(() => void refreshAndReload(), delay);
    }

    return () => controller.abort();
  },
});
