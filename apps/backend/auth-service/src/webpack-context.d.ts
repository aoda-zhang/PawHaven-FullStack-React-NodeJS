interface ImportMeta {
  webpackContext(
    request: string,
    options?: { recursive?: boolean; regExp?: RegExp },
  ): {
    keys(): string[];
    (id: string): unknown;
  };
}
