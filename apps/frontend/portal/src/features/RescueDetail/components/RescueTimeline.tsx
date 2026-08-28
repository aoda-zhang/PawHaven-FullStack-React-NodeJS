import { useTranslation } from 'react-i18next';

interface RescueTimelineProps {
  updates: Array<{
    status: string;
    time: string;
    description: string;
    author: string;
    photo?: string;
  }>;
}

export const RescueTimeline = ({ updates }: RescueTimelineProps) => {
  const { t } = useTranslation();

  return (
    <section className="bg-card border-border rounded-2xl border p-5 shadow-sm sm:p-6">
      <h2 className="text-foreground mb-5 font-serif text-lg font-semibold">
        {t('reportAnimal.rescue_timeline')}
      </h2>

      {updates.length === 0 ? (
        <p className="text-text-secondary text-sm">
          {t('rescueDetail.no_timeline')}
        </p>
      ) : (
        <ol className="relative space-y-6 pl-6">
          {updates.map((update, index) => {
            const isLatest = index === 0;
            return (
              <li key={index} className="relative">
                <span
                  className={`absolute top-1 -left-6 flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                    isLatest
                      ? 'border-status-high bg-status-high'
                      : 'border-border bg-background'
                  }`}
                  aria-hidden="true"
                >
                  {!isLatest && (
                    <span className="bg-text-muted h-2 w-2 rounded-full" />
                  )}
                </span>

                <div>
                  <div className="mb-1 flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
                    <span className="text-status-high">{update.status}</span>
                    <span className="text-text-muted">{update.time}</span>
                  </div>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    {update.description}
                  </p>
                  <p className="text-text-muted mt-1 text-xs">
                    — {update.author}
                  </p>
                  {update.photo && (
                    <img
                      src={update.photo}
                      alt=""
                      className="mt-3 h-28 w-full rounded-xl object-cover"
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
};
