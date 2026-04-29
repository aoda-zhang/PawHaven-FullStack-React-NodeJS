import { Button, TextareaAutosize } from '@mui/material';
import {
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
  HandHelping,
} from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface RescueInteractionProps {
  animalId: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  avatar: string;
  content: string;
  timestamp: string;
  likes: number;
}

export const RescueInteraction: React.FC<RescueInteractionProps> = () => {
  const { t } = useTranslation();
  const [commentContent, setCommentContent] = useState('');
  const [likes, setLikes] = useState(12);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [comments] = useState<Comment[]>([
    {
      id: '1',
      userId: 'u1',
      userName: 'Volunteer A',
      avatar: '/assets/avatars/volunteer1.jpg',
      content:
        'I’ve seen this cat, it’s very friendly, already contacted a nearby pet hospital',
      timestamp: '2023-10-21T09:30:00',
      likes: 5,
    },
  ]);

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
            // onClick={handleComment}
            aria-label={t('common.comment')}
          >
            <MessageSquare size={20} />
            <span>{comments.length}</span>
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

      <div className="mt-8">
        <h3 className="text-xl font-bold mb-4 text-gray-800">
          {t('reportStray.comments')}
        </h3>

        <div className="flex flex-col gap-3 mb-6">
          <TextareaAutosize
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            placeholder={t('reportStray.leave_comment_placeholder')}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            minRows={3}
          />
          <Button
            variant="contained"
            disabled={!commentContent.trim()}
            className="self-end"
          >
            {t('reportStray.submit')}
          </Button>
        </div>

        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <img
                src={comment.avatar}
                alt={comment.userName}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-gray-800">
                    {comment.userName}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(comment.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-700 mb-2">{comment.content}</p>
                <button
                  type="button"
                  className="text-sm text-gray-500 flex items-center gap-1"
                >
                  <Heart size={16} />
                  <span>{comment.likes}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
