export interface HttpResType {
  isSuccess: boolean;
  message: string;
  data: unknown;
  status: number;
}
export enum HttpBusinessCode {
  jwtexpired = 'jwtexpired',
  invalidToken = 'invalidtoken',
  invalidSign = 'invalidsignature',
}
