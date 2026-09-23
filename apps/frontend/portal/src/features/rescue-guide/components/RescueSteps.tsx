import { useTranslation } from 'react-i18next';

import { rescueStepIcons } from '../constants';
import type { RescueGuideStep } from '../types';

export const RescueSteps = () => {
  const { t } = useTranslation();
  const stepsContent = t('rescueGuide.steps', {
    returnObjects: true,
  }) as Array<{ title: string; desc: string }>;

  const steps: RescueGuideStep[] = stepsContent.map((step, index) => ({
    icon: rescueStepIcons[index] ?? rescueStepIcons[rescueStepIcons.length - 1],
    title: step.title,
    description: step.desc,
  }));

  return (
    <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {steps.map((step) => {
        const StepIcon = step.icon;

        return (
          <li
            key={step.title}
            className="bg-card border-border shadow-card hover:shadow-modal rounded-2xl border p-5 transition-transform duration-200 hover:-translate-y-1"
          >
            <span className="bg-accent text-accent-foreground flex size-10 items-center justify-center rounded-xl">
              <StepIcon className="size-5" aria-hidden="true" />
            </span>
            <h3 className="text-text mt-3 text-base font-semibold">
              {step.title}
            </h3>
            <p className="text-text-secondary mt-1.5 text-sm leading-relaxed">
              {step.description}
            </p>
          </li>
        );
      })}
    </ol>
  );
};
