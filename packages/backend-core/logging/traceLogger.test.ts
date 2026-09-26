import { afterEach, describe, expect, it, vi } from 'vitest';

import { runWithTrace } from '../trace/traceContext.js';

import { TraceLogger } from './traceLogger.js';

const capture = (stream: 'stdout' | 'stderr') =>
  vi.spyOn(process[stream], 'write').mockImplementation(() => true);

const output = (spy: ReturnType<typeof capture>) =>
  spy.mock.calls.map((call) => String(call[0])).join('');

describe('TraceLogger', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('stamps the ambient trace id onto a log line', () => {
    const stdout = capture('stdout');
    const logger = new TraceLogger('Svc');

    runWithTrace('trace-1', () => logger.log('something happened'));

    expect(output(stdout)).toContain('[trace=trace-1] something happened');
  });

  it('stamps warn and error lines too', () => {
    const stdout = capture('stdout');
    const stderr = capture('stderr');
    const logger = new TraceLogger('Svc');

    runWithTrace('trace-2', () => {
      logger.warn('careful');
      logger.error('broken');
    });

    expect(output(stdout)).toContain('[trace=trace-2] careful');
    expect(output(stderr)).toContain('[trace=trace-2] broken');
  });

  it('falls back to a placeholder outside a request', () => {
    const stdout = capture('stdout');
    new TraceLogger('Svc').log('no trace here');

    expect(output(stdout)).toContain('[trace=-] no trace here');
  });

  it('keeps the context label alongside the trace id', () => {
    const stdout = capture('stdout');
    const logger = new TraceLogger('ReportAnimalService');

    runWithTrace('trace-3', () => logger.log('saved'));

    const line = output(stdout);
    expect(line).toContain('ReportAnimalService');
    expect(line).toContain('[trace=trace-3] saved');
  });

  it('inspects a non-string message instead of flattening it', () => {
    const stdout = capture('stdout');
    const logger = new TraceLogger('Svc');

    runWithTrace('trace-4', () => logger.log({ id: 7 }));

    expect(output(stdout)).toContain('[trace=trace-4]');
    expect(output(stdout)).toContain('id: 7');
  });

  it('keeps an Error message readable rather than "[object Object]"', () => {
    const stdout = capture('stdout');
    const logger = new TraceLogger('Svc');

    runWithTrace('trace-4b', () => logger.log(new Error('boom')));

    const line = output(stdout);
    expect(line).toContain('[trace=trace-4b]');
    expect(line).toContain('boom');
  });

  it('forwards extra params to the underlying logger', () => {
    const stderr = capture('stderr');
    const logger = new TraceLogger('Svc');
    const cause = new Error('root cause');

    runWithTrace('trace-5', () => logger.error('failed to save', cause));

    const line = output(stderr);
    expect(line).toContain('[trace=trace-5] failed to save');
    expect(line).toContain('root cause');
  });

  it('does not attribute a later line to an already-finished request', () => {
    const stdout = capture('stdout');
    const logger = new TraceLogger('Svc');

    runWithTrace('trace-6', () => logger.log('inside'));
    logger.log('after');

    const text = output(stdout);
    expect(text).toContain('[trace=trace-6] inside');
    expect(text).toContain('[trace=-] after');
  });
});
