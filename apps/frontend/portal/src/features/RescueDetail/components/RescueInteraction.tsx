import { Button } from '@mui/material';
import { Heart, Share2, Bookmark, HandHelping } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface RescueInteractionProps {
  animalId: string;
}

export const RescueInteraction: React.FC<RescueInteractionProps> = () => {
  const { t } = useTranslation();
  const [likes, setLikes] = useState(12);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const handleLike = () => {
    setLikes((prev) => (isLiked ? prev - 1 : prev + 1));
    setIsLiked(!isLiked);
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: t('pawHaven.share_title'),
        text: t('pawHaven.share_text', { name: '动物名称' }),
        url: window.location.href,
      });
    } else {
      navigator.clipboard
        .writeText(window.location.href)
        .then(() => alert(t('pawHaven.link_copied')));
    }
  };

  const handleRescue = () => {};

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-6 mt-6">
      {/* 操作按钮区 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <Button variant="outlined" className="min-w-72" onClick={handleRescue}>
          <HandHelping size={18} className="mr-2" />
          {t('pawHaven.i_will_rescue')}
        </Button>

        <div className="flex gap-2">
          <button
            type="button"
            className="flex items-center gap-1 p-2 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
            onClick={handleLike}
            aria-label={t('common.like')}
          >
            <Heart
              size={20}
              className={isLiked ? 'fill-red-500 text-red-500' : ''}
            />
            <span>{likes}</span>
          </button>

          <button
            type="button"
            className="flex items-center gap-1 p-2 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
            onClick={handleShare}
            aria-label={t('common.share')}
          >
            <Share2 size={20} />
          </button>

          <button
            type="button"
            className="flex items-center gap-1 p-2 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
            onClick={handleBookmark}
            aria-label={t('common.bookmark')}
          >
            <Bookmark
              size={20}
              className={isBookmarked ? 'fill-red-500 text-red-500' : ''}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
