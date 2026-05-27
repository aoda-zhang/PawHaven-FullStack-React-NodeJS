import type {
  ColorPrefix,
  RescueStatusType,
  StatusColorType,
} from '@/features/Home/types';

interface GetStatusColorParams {
  status: RescueStatusType;
  prefix: ColorPrefix;
}

const bgStatusColors: Record<RescueStatusType, StatusColorType> = {
  pending: 'bg-rescue-status-pending',
  inProgress: 'bg-rescue-status-inProgress',
  treated: 'bg-rescue-status-treated',
  recovering: 'bg-rescue-status-recovering',
  awaitingAdoption: 'bg-rescue-status-awaitingAdoption',
  adopted: 'bg-rescue-status-adopted',
  failed: 'bg-rescue-status-failed',
};

const textStatusColors: Record<RescueStatusType, StatusColorType> = {
  pending: 'text-rescue-status-pending',
  inProgress: 'text-rescue-status-inProgress',
  treated: 'text-rescue-status-treated',
  recovering: 'text-rescue-status-recovering',
  awaitingAdoption: 'text-rescue-status-awaitingAdoption',
  adopted: 'text-rescue-status-adopted',
  failed: 'text-rescue-status-failed',
};

const borderStatusColors: Record<RescueStatusType, StatusColorType> = {
  pending: 'border-rescue-status-pending',
  inProgress: 'border-rescue-status-inProgress',
  treated: 'border-rescue-status-treated',
  recovering: 'border-rescue-status-recovering',
  awaitingAdoption: 'border-rescue-status-awaitingAdoption',
  adopted: 'border-rescue-status-adopted',
  failed: 'border-rescue-status-failed',
};

export const getStatusColorByPrefix = ({
  status,
  prefix,
}: GetStatusColorParams): StatusColorType => {
  switch (prefix) {
    case 'bg':
      return bgStatusColors[status];
    case 'text':
      return textStatusColors[status];
    case 'border':
      return borderStatusColors[status];
    default:
      throw new Error(`Unsupported prefix: ${prefix}`);
  }
};
