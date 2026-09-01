import '@testing-library/jest-dom/vitest';

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
