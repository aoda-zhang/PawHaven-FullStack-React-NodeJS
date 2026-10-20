import type { ReactNode } from 'react';
import { useState } from 'react';

import { Button } from '../button/Button';

export interface FileDownloadButtonProps {
  fileFetchRequest: () => Promise<Blob>;
  fileName?: string;
  onSuccess?: (blob: Blob) => void;
  onError?: (error: unknown) => void;
  disabled?: boolean;
  children?: ReactNode;
}

export const FileDownloadButton = ({
  fileFetchRequest,
  fileName,
  onSuccess,
  onError,
  disabled = false,
  children,
}: FileDownloadButtonProps) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!fileFetchRequest || disabled) return;

    try {
      setIsDownloading(true);

      const blob = await fileFetchRequest();

      const objectUrl = window.URL.createObjectURL(blob);

      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      if (fileName) {
        anchor.download = fileName;
      }
      anchor.hidden = true;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      window.setTimeout(() => {
        window.URL.revokeObjectURL(objectUrl);
      }, 0);

      onSuccess?.(blob);
    } catch (error) {
      onError?.(error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={disabled || isDownloading}
      loading={isDownloading}
    >
      <span>{children}</span>
    </Button>
  );
};
