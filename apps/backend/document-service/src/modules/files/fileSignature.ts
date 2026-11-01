const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const PDF_SIGNATURE = [0x25, 0x50, 0x44, 0x46, 0x2d];

const startsWith = (body: Buffer, signature: number[]): boolean =>
  body.length >= signature.length &&
  signature.every((byte, index) => body[index] === byte);

const isWebp = (body: Buffer): boolean =>
  body.length >= 12 &&
  body.toString('ascii', 0, 4) === 'RIFF' &&
  body.toString('ascii', 8, 12) === 'WEBP';

export const detectContentType = (body: Buffer): string | undefined => {
  if (startsWith(body, JPEG_SIGNATURE)) {
    return 'image/jpeg';
  }
  if (startsWith(body, PNG_SIGNATURE)) {
    return 'image/png';
  }
  if (isWebp(body)) {
    return 'image/webp';
  }
  if (startsWith(body, PDF_SIGNATURE)) {
    return 'application/pdf';
  }
  return undefined;
};
