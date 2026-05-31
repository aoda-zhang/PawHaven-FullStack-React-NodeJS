import { useTranslation } from 'react-i18next';

export const RecentStory = () => {
  const { t } = useTranslation();
  return (
    <div className="px-4 lg:px-20">
      <p className="my-4 text-base font-bold lg:text-2xl">
        {t('common.love_story')}
      </p>
    </div>
  );
};
