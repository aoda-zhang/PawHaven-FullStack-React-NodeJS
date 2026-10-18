import '@testing-library/jest-dom/vitest';

// Mock environment variable for config loading
import { vi } from 'vitest';
vi.stubGlobal('import.meta', {
  env: {
    PAWHAVEN_USER_APP_ENV: 'test',
    PAWHAVEN_USER_API_BASE_URL: 'http://localhost',
    PAWHAVEN_USER_API_PRIVATE_KEY: 'test-key',
    PAWHAVEN_USER_VERSION: '1.0.0',
    PAWHAVEN_USER_SENTRY_DSN: '',
    PAWHAVEN_USER_GA_ID: '',
    PAWHAVEN_USER_SERVICE_URL: '',
    PAWHAVEN_USER_NOTIFICATION_SERVICE_URL: '',
  },
});

// jsdom ships no canvas implementation, and lottie-web (pulled in transitively
// by @pawhaven/ui) calls getContext() while its module body is evaluated.
// Without a stub, importing anything from @pawhaven/ui crashes the test suite.
type CanvasContextStub = Record<string | symbol, unknown>;

const createCanvasContextStub = (): CanvasContextStub =>
  new Proxy({} as CanvasContextStub, {
    get: (target: Record<string | symbol, unknown>, prop) =>
      prop in target ? target[prop] : () => undefined,
    set: (target: Record<string | symbol, unknown>, prop, value) => {
      // eslint-disable-next-line no-param-reassign
      target[prop] = value;
      return true;
    },
  });

// One stub per canvas: a single shared stub leaks state between elements.
const contextByCanvas = new WeakMap<HTMLCanvasElement, CanvasContextStub>();

function canvasGetContext(this: HTMLCanvasElement) {
  let context = contextByCanvas.get(this);
  if (!context) {
    context = createCanvasContextStub();
    contextByCanvas.set(this, context);
  }
  return context;
}

HTMLCanvasElement.prototype.getContext =
  canvasGetContext as unknown as HTMLCanvasElement['getContext'];
