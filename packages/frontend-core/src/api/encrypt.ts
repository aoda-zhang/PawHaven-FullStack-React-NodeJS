import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

/**
 * Parameters for request signing.
 */
export type SignParams = {
  config: Record<string, unknown>;
  timestamp: string;
  prefix: string;
  privateKey: string;
};

/**
 * Gets the current UTC timestamp in seconds (Unix epoch time).
 *
 * @returns The current UTC timestamp as a number (seconds since epoch)
 */
export const getUTCTimestamp = () => {
  return Math.floor(dayjs.utc().valueOf() / 1000);
};
