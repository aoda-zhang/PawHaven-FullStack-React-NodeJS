import {
  CanActivate,
  ExecutionContext,
  Injectable,
  PayloadTooLargeException,
} from '@nestjs/common';
import type { Request } from 'express';

const PDF_RENDER_MAX_BYTES = 5 * 1024 * 1024;

@Injectable()
export class PdfPayloadSizeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const raw = request.headers['content-length'];
    if (raw) {
      const size = Number(raw);
      if (Number.isFinite(size) && size > PDF_RENDER_MAX_BYTES) {
        throw new PayloadTooLargeException('Render payload too large');
      }
    }
    return true;
  }
}
