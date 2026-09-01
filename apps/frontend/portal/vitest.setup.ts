import '@testing-library/jest-dom/vitest';

// jsdom ships no canvas implementation, and lottie-web (pulled in transitively
// by @pawhaven/ui) calls getContext() while its module body is evaluated.
// Without a stub, importing anything from @pawhaven/ui crashes the test suite.
const canvasContextStub = new Proxy(
  {},
  {
    get: (target: Record<string | symbol, unknown>, prop) =>
      prop in target ? target[prop] : () => undefined,
    set: (target: Record<string | symbol, unknown>, prop, value) => {
      target[prop] = value;
      return true;
    },
  },
);

HTMLCanvasElement.prototype.getContext = (() =>
  canvasContextStub) as unknown as HTMLCanvasElement['getContext'];
