import { Skeleton } from '@mui/material';
import clsx from 'clsx';
import dayjs from 'dayjs';
import { ArrowRight } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { useFetchLatestRescuesByNumber } from '../apis/queries';
import type { RescueItemType } from '../types';

import { getStatusColorByPrefix } from '@/utils/getStatusColorByPrefix';

const RescueItem = ({
  animalID,
  name,
  img,
  description,
  location,
  time,
  status,
}: RescueItemType) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/rescue/detail/${animalID}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className="border-border mb-4 flex cursor-pointer flex-col gap-1 rounded-md border-1 bg-white p-4"
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <img src={img} alt={name} className="mb-3 h-3/4 w-full rounded-md" />
      <p className="text-primary text-xl">{name}</p>
      <p className="text-text-secondary flex justify-between text-sm">
        <span>{location}</span>
        <span>{dayjs(time).format('DD/MM/YYYY')}</span>
      </p>
      <p className="text-text-secondary">{description}</p>
      <div
        className={clsx([
          'rounded-full py-2 text-center text-white',
          getStatusColorByPrefix({ status, prefix: 'bg' }),
        ])}
      >
        {t(`common.rescue_status_${status}`)}
      </div>
    </div>
  );
};

const SKELETON_COUNT = 3;

const RescueItemSkeleton = () => (
  <div className="border-border mb-4 rounded-md border-1 bg-white p-4">
    <Skeleton
      variant="rounded"
      width="100%"
      height="15rem"
      sx={{
        marginBottom: 'var(--spacing-card)',
        borderRadius: 'var(--radius-card)',
      }}
    />
    <Skeleton
      variant="text"
      sx={{ fontSize: 'var(--font-size-xl)' }}
      width="60%"
    />
    <div className="flex justify-between">
      <Skeleton variant="text" width="40%" />
      <Skeleton variant="text" width="25%" />
    </div>
    <Skeleton variant="text" width="100%" />
    <Skeleton
      variant="rounded"
      width="100%"
      height="2rem"
      sx={{
        borderRadius: 'var(--radius-full)',
        marginTop: 'var(--spacing-input)',
      }}
    />
  </div>
);

export const LatestRescue = () => {
  const { t } = useTranslation();
  const { data: rescues, isLoading } = useFetchLatestRescuesByNumber();

  const handleViewAllClick = () => {
    // TODO: Navigate to the appropriate page for viewing all rescues
    // navigate('/rescues');
  };

  const handleViewAllKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleViewAllClick();
    }
  };

  return (
    <div className="px-4 lg:px-20">
      <div className="my-4 flex items-center justify-between">
        <span className="text-base font-bold lg:text-2xl">
          {t('common.recent_rescue')}
        </span>
        <div
          className="flex items-center gap-4"
          role="button"
          tabIndex={0}
          onClick={handleViewAllClick}
          onKeyDown={handleViewAllKeyDown}
        >
          <span>{t('common.view_all')}</span>
          <ArrowRight
            size="1.875rem"
            className="bg-primary rounded-full text-white"
          />
        </div>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(14rem,1fr))] gap-4">
        {isLoading
          ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <RescueItemSkeleton key={`skeleton-${i}`} />
            ))
          : rescues?.map((item) => <RescueItem {...item} key={item.name} />)}
      </div>
    </div>
  );
};
