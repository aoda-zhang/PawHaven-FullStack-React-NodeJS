import { BadRequestException } from '@nestjs/common';
import { HttpClientService } from '@pawhaven/backend-core';
import {
  httpHeaders,
  microServiceNames,
} from '@pawhaven/backend-core/constants';
import { getTraceId, runWithTrace } from '@pawhaven/backend-core/trace';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GuideService } from './guide.service.js';

type PostArgs = [string, unknown, Record<string, unknown>];

const buildService = (postResult?: unknown) => {
  const post = vi.fn<(...args: PostArgs) => Promise<unknown>>(() =>
    Promise.resolve(
      postResult ?? { data: Buffer.from('%PDF-1.4'), status: 200 },
    ),
  );
  const create = vi.fn(() => ({ post }));
  const httpClientService = { create } as unknown as HttpClientService;

  return { service: new GuideService(httpClientService), post, create };
};

describe('GuideService', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  it('renders through document-service, not from the edge', async () => {
    const { service, create } = buildService();

    await service.renderGuidePdf('rescueGuide', 'en-US');

    expect(create).toHaveBeenCalledWith(microServiceNames.DOCUMENT);
  });

  it('calls the internal render route rather than the public one', async () => {
    const { service, post } = buildService();

    await service.renderGuidePdf('rescueGuide', 'en-US');

    // The public route is reachable through the gateway; the internal one is not,
    // which is what keeps the browser from bypassing core-service.
    expect(post.mock.calls[0][0]).toBe('internal/pdf/render');
  });

  it('forwards the locale as a header, since the renderer reads it from there', async () => {
    const { service, post } = buildService();

    await service.renderGuidePdf('firstAid', 'de-DE');

    const options = post.mock.calls[0][2] as {
      headers: Record<string, string>;
    };
    expect(options.headers[httpHeaders.appLocale]).toBe('de-DE');
  });

  it('requests a raw buffer rather than a parsed body', async () => {
    const { service, post } = buildService();

    await service.renderGuidePdf('rescueGuide', 'en-US');

    const options = post.mock.calls[0][2] as {
      config: { responseType: string };
    };
    // A PDF must not be run through the JSON envelope unwrapping.
    expect(options.config.responseType).toBe('arraybuffer');
  });

  it('returns the rendered buffer', async () => {
    const pdf = Buffer.from('%PDF-1.4 fake');
    const { service } = buildService({ data: pdf, status: 200 });

    await expect(service.renderGuidePdf('kittenCare', 'zh-CN')).resolves.toBe(
      pdf,
    );
  });

  it('rejects an unknown template without calling document-service', async () => {
    const { service, post } = buildService();

    await expect(
      service.renderGuidePdf('not-a-real-guide', 'en-US'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(post).not.toHaveBeenCalled();
  });

  it('fails loudly when document-service returns a non-pdf payload', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { service } = buildService({ data: 'not-a-buffer', status: 200 });

    await expect(
      service.renderGuidePdf('rescueGuide', 'en-US'),
    ).rejects.toThrow('Invalid PDF payload');
  });

  it('issues the document-service call inside the request trace', async () => {
    // Read from inside the mock, i.e. at the exact moment the outbound call is
    // made. `HttpClientInstance` turns this ambient id into the `x-trace-id`
    // header of the second hop, so observing it here is what proves the
    // gateway -> core-service -> document-service chain shares one id.
    let ambientDuringCall: string | undefined;
    const { service } = buildService();
    const post = vi.fn(() => {
      ambientDuringCall = getTraceId();
      return Promise.resolve({ data: Buffer.from('%PDF'), status: 200 });
    });
    (
      service as unknown as { documentClient: { post: unknown } }
    ).documentClient = { post };

    await runWithTrace('browser-trace', () =>
      service.renderGuidePdf('rescueGuide', 'en-US'),
    );

    expect(ambientDuringCall).toBe('browser-trace');
  });
});
