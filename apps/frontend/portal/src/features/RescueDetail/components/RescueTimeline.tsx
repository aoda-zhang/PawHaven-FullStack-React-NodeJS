import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineSeparator,
} from '@pawhaven/ui';
import { Check, Zap } from 'lucide-react';
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
        <Timeline>
          {updates.map((update, index) => {
            const isLatest = index === 0;
            const isLast = index === updates.length - 1;
            return (
              <TimelineItem key={index}>
                <TimelineSeparator>
                  <TimelineDot
                    variant={isLatest ? 'primary' : 'default'}
                    icon={
                      isLatest ? (
                        <Zap className="h-4 w-4" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )
                    }
                  />
                  {!isLast && <TimelineConnector />}
                </TimelineSeparator>

                <TimelineContent>
                  <div className="mb-1 flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
                    <span className="text-text-secondary">{update.status}</span>
                    <span className="text-text-secondary">{update.time}</span>
                  </div>
                  <p className="text-foreground mt-1 text-sm leading-relaxed">
                    {update.description}
                  </p>
                  <p className="text-text-secondary mt-1 text-xs">
                    — {update.author}
                  </p>
                  {update.photo && (
                    <img
                      src={update.photo}
                      alt=""
                      className="bg-muted mt-3 h-28 w-full rounded-xl object-cover"
                    />
                  )}
                </TimelineContent>
              </TimelineItem>
            );
          })}
        </Timeline>
      )}
    </section>
  );
};
