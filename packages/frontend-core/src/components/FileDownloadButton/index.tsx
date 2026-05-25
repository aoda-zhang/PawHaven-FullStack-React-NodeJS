import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
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

/**
 * FileDownloadButton
 *
 * Reusable button for downloading arbitrary files with loading state.
 * Explicit file type is required to make download intent clear to callers.
 */
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
      // In real projects, replace this with centralized error reporting (e.g. Sentry)
      console.error('[FileDownloadButton] Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      variant="contained"
      onClick={handleDownload}
      disabled={disabled || isDownloading}
      startIcon={isDownloading ? <CircularProgress size={16} /> : null}
      className={buttonClassName}
    >
      <span className={contentClassName}>{children ?? label}</span>
    </Button>
  );
};
