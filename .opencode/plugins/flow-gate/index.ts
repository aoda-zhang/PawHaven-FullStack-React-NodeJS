import { Plugin } from '@opencode/plugin';
import { createHash } from 'node:crypto';
import {
  DEFAULT_TTLS,
  MAX_TTLS,
  evaluatePermission,
  grantStatus,
  parseCommitCommand,
} from './policy.mjs';

const MINUTE_MS = 60 * 1000;

const INTERNAL_ERROR_MESSAGE =
  'flow-gate: the gate hit an internal error, so this request was denied to stay closed. Ask the human to report this plugin error. Do not retry this request and do not work around this with shell or any other write path.';

const COMMAND_TOKEN = /^\/approve-commit(?=\s|$)/;

const clamp = (value: any, fallback: number, max: number): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(Math.max(value, 1), max);
};

const isGatedAction = (action: any): boolean =>
  action === 'edit' || action === 'shell';

const stripCommandName = (raw: string, name: string): string => {
  let text = raw.trim();
  if (text.startsWith('!')) text = text.slice(1).trim();
  text = text.replace(COMMAND_TOKEN, '').trim();
  if (text.startsWith(`/${name}`)) {
    const rest = text.slice(name.length + 1);
    if (rest === '' || /^\s/.test(rest)) text = rest.trim();
  }
  return text;
};

const expiryText = (value: number): string => new Date(value).toLocaleString();

export default Plugin.define({
  id: 'flow-gate',
  async setup(ctx) {
    const enabled = ctx.options?.enabled !== false;
    const defaults = {
      commitMinutes: clamp(
        ctx.options?.commitTtlMinutes,
        DEFAULT_TTLS.commitMinutes,
        MAX_TTLS.commitMinutes,
      ),
    };

    const projectRoot = ctx.location?.directory ?? '';
    const fingerprint = createHash('sha256').update(projectRoot).digest('hex');

    let stored: any = null;
    try {
      stored = await ctx.storage.get('grants');
    } catch (err) {
      console.error('[flow-gate] failed to load grants:', err);
    }
    const validStored =
      stored?.v === 2 && stored?.fingerprint === fingerprint ? stored : null;

    let grant: any = validStored?.commit ?? null;

    const persist = async () => {
      try {
        await ctx.storage.set('grants', { v: 2, fingerprint, commit: grant });
      } catch (err) {
        console.error('[flow-gate] failed to persist grants:', err);
      }
    };

    const report = async (sessionID: string, text: string) => {
      try {
        // `ctx.session.synthetic` is the only session-visible output a plugin command has; its rendering is unverified and is confirmed during restart verification.
        await ctx.session.synthetic({ sessionID, text });
      } catch (err) {
        console.error('[flow-gate] failed to report command output:', err);
      }
    };

    await ctx.permission.hook('evaluate', (event: any) => {
      if (!enabled) return;
      try {
        const result = evaluatePermission({
          action: event.action,
          resources: event.resources ?? [],
          projectRoot,
          now: Date.now(),
          grants: { commit: grant },
        });
        if (result.effect === 'deny') {
          event.effect = 'deny';
          event.message = result.message;
          return;
        }
        if (result.effect === 'allow') event.effect = 'allow';
      } catch (err) {
        console.error('[flow-gate] permission evaluation failed:', err);
        if (!isGatedAction(event.action)) return;
        event.effect = 'deny';
        event.message = INTERNAL_ERROR_MESSAGE;
      }
    });

    await ctx.command.transform((editor: any) => {
      editor.add({
        name: 'approve-commit',
        description:
          'Human-only commit approval; no model tool can run this command. It opens the commit gate for the configured TTL.',
        execute: async ({ sessionID, prompt }: any) => {
          try {
            if (!enabled) {
              await report(
                sessionID,
                'flow-gate: the gate is disabled by config, so /approve-commit changed nothing.',
              );
              return;
            }

            const args = stripCommandName(
              String(prompt?.text ?? ''),
              'approve-commit',
            );
            const parsed: any = parseCommitCommand({
              text: args,
              now: Date.now(),
              defaults,
            });

            if (!parsed?.ok) {
              await report(
                sessionID,
                `flow-gate: ${parsed?.reason ?? 'could not parse this command'}\nUsage: ${parsed?.usage ?? ''}`,
              );
              return;
            }

            if (parsed.action === 'grant') {
              grant = { ...parsed.grant, grantedIn: sessionID };
              await persist();
              const minutes = Math.round(
                (parsed.grant.expiresAt - parsed.grant.grantedAt) / MINUTE_MS,
              );
              const note = String(parsed.grant.note ?? '').trim() || '(none)';
              await report(
                sessionID,
                [
                  `flow-gate: commit approval granted for ${minutes} min.`,
                  `Expires: ${expiryText(parsed.grant.expiresAt)} (local time)`,
                  `Note: ${note}`,
                  'Revoke early with: /approve-commit revoke',
                ].join('\n'),
              );
              return;
            }

            if (parsed.action === 'revoke') {
              grant = null;
              await persist();
              await report(sessionID, 'flow-gate: commit approval revoked.');
              return;
            }

            const status: any = grantStatus(grant, Date.now());
            if (!grant || typeof status.expiresAt !== 'number') {
              await report(
                sessionID,
                'flow-gate: no commit approval. Run /approve-commit to grant one.',
              );
              return;
            }
            if (status.active) {
              await report(
                sessionID,
                `flow-gate: commit approval is active until ${expiryText(status.expiresAt)} (local time).`,
              );
              return;
            }
            await report(
              sessionID,
              `flow-gate: commit approval expired at ${expiryText(status.expiresAt)} (local time).`,
            );
          } catch (err) {
            console.error('[flow-gate] /approve-commit failed:', err);
            await report(
              sessionID,
              'flow-gate: this command hit an internal error and changed nothing. Ask the human to report this plugin error.',
            );
          }
        },
      });
    });
  },
});
