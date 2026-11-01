import { useCallback, useRef, useState } from 'react';

import { uploadFiles } from '@/shared/utils/apiClient';

interface UseFileUploadsOptions {
  endpoint: string;
  folder?: string;
  onError: () => void;
}

export const useFileUploads = ({
  endpoint,
  folder,
  onError,
}: UseFileUploadsOptions) => {
  const uploadsRef = useRef(new Map<File, Promise<string>>());
  const [uploadingCount, setUploadingCount] = useState(0);

  const ensureUploaded = useCallback(
    (file: File): Promise<string> => {
      const existing = uploadsRef.current.get(file);
      if (existing) {
        return existing;
      }

      const promise = uploadFiles([file], { endpoint, folder })
        .then((result) => {
          const key = result.files[0]?.key;
          if (!key) {
            throw new Error('Upload returned no key');
          }
          return key;
        })
        .catch((error: unknown) => {
          uploadsRef.current.delete(file);
          throw error;
        });

      uploadsRef.current.set(file, promise);
      return promise;
    },
    [endpoint, folder],
  );

  const startUploads = useCallback(
    (files: File[]) => {
      const pending = files.filter((file) => !uploadsRef.current.has(file));
      if (pending.length === 0) {
        return;
      }

      setUploadingCount((count) => count + pending.length);
      pending.forEach((file) => {
        ensureUploaded(file)
          .catch(onError)
          .finally(() => setUploadingCount((count) => Math.max(0, count - 1)));
      });
    },
    [ensureUploaded, onError],
  );

  return { uploadingCount, startUploads, ensureUploaded };
};
