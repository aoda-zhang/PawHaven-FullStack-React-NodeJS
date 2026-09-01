import { Bookmark, Share2, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface VolunteerInfoProps {
  volunteer?: {
    name: string;
    completedRescues: number;
    avatar?: string;
  };
}

export const VolunteerInfo = ({ volunteer }: VolunteerInfoProps) => {
  const { t } = useTranslation();

  return (
    <section className="space-y-4">
      <div className="bg-card border-border rounded-2xl border p-5 shadow-sm sm:p-6">
        {volunteer ? (
          <>
            <div className="mb-4 flex items-center gap-3">
              {volunteer.avatar ? (
                <img
                  src={volunteer.avatar}
                  alt={volunteer.name}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-full">
                  <Shield className="text-primary h-6 w-6" aria-hidden="true" />
                </div>
              )}
              <div>
                <p className="text-foreground font-semibold">
                  {volunteer.name}
                </p>
                <p className="text-text-secondary text-xs">
                  {t('rescueDetail.volunteer_rescues', {
                    count: volunteer.completedRescues,
                  })}
                </p>
              </div>
            </div>

            <div className="bg-primary/5 text-primary mb-4 rounded-xl px-4 py-3 text-sm">
              {t('rescueDetail.volunteer_handling')}
            </div>

            <button
              type="button"
              className="border-border hover:bg-background-soft w-full rounded-xl border py-2.5 text-sm font-semibold transition-colors"
            >
              {t('rescueDetail.offer_assistance')}
            </button>
          </>
        ) : (
          <p className="text-text-secondary text-sm">
            {t('rescueDetail.no_volunteer')}
          </p>
        )}
      </div>

      <div className="border-border bg-card hover:bg-background-soft rounded-2xl border p-3 shadow-sm transition-colors">
        <button
          type="button"
          className="text-text-secondary hover:text-foreground flex w-full items-center justify-center gap-2 py-2 text-sm font-medium transition-colors"
        >
          <Bookmark className="h-4 w-4" aria-hidden="true" />
          {t('rescueDetail.follow_case')}
        </button>
      </div>

      <div className="border-border bg-card hover:bg-background-soft rounded-2xl border p-3 shadow-sm transition-colors">
        <button
          type="button"
          className="text-text-secondary hover:text-foreground flex w-full items-center justify-center gap-2 py-2 text-sm font-medium transition-colors"
        >
          <Share2 className="h-4 w-4" aria-hidden="true" />
          {t('rescueDetail.share_case')}
        </button>
      </div>
    </section>
  );
};
