/**
 * Converts the selected photo files into base64 data URLs
 * so they can be submitted inside the report DTO.
 */
export const readFilesAsDataUrls = (files: File[]): Promise<string[]> =>
  Promise.all(
    files.map(
      (file) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        }),
    ),
  );
