import { Button } from '@pawhaven/ui';
import type { ReactNode } from 'react';
import { useState } from 'react';

export interface FileDownloadButtonProps {
  fileFetchRequest: () => Promise<Blob>;
  fileName?: string;
  fileType: string;
  label?: string | ReactNode;
  disabled?: boolean;
  onSuccess?: (blob: Blob, fileType: string) => void;
  onError?: (error: unknown, fileType: string) => void;
  children?: ReactNode;
  buttonClassName?: string;
  contentClassName?: string;
}

export const FileDownloadButton = ({
  fileFetchRequest,
  fileName,
  fileType,
  label,
  disabled = false,
  onSuccess,
  onError,
  children,
  buttonClassName,
  contentClassName,
}: FileDownloadButtonProps) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!fileFetchRequest) return;

    try {
      setIsDownloading(true);

      const blob = await fileFetchRequest();

      const objectUrl = window.URL.createObjectURL(blob);

      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      if (fileName) {
        anchor.download = fileName;
      }
      anchor.click();
      window.URL.revokeObjectURL(objectUrl);
      onSuccess?.(blob, fileType);
    } catch (error) {
      onError?.(error, fileType);
      console.error('[FileDownloadButton] Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={disabled || isDownloading}
      loading={isDownloading}
      className={buttonClassName}
    >
      <span className={contentClassName}>{children ?? label}</span>
    </Button>
  );
};
