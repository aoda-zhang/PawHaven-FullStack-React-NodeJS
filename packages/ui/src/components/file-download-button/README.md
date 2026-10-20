# FileDownloadButton

Fetches a Blob and triggers a browser download, with success/error callbacks.

## Usage guidance

Provide `fileFetchRequest`; `fileName` is optional. Handle failures with `onError` — the component never writes to the consumer's console. The object URL is revoked on the next tick, after the download has been dispatched.

## Tests and examples

Regression tests are colocated in this component directory. Interactive examples live in `[FileDownloadButton.stories.tsx](./FileDownloadButton.stories.tsx)`.
