export const FILE_STORAGE = Symbol('FILE_STORAGE');

export interface StoredFile {
  key: string;
  size: number;
  contentType: string;
}

export interface FileStorage {
  put(key: string, body: Buffer, contentType: string): Promise<StoredFile>;
}
