import { cn } from '@pawhaven/frontend-core';
import type { AnimalReportDto } from '@pawhaven/shared/types';
import { isValidPhoneNumber } from '@pawhaven/ui';
import { ArrowLeft, CheckCircle, ChevronRight } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { useCreateReportAnimal } from '../api/reportAnimal.mutations';
import {
  FALLBACK_ID_SUFFIX_LENGTH,
  Step,
  STEPS,
  TOTAL_STEPS,
} from '../constants';

import { StepAnimal } from './StepAnimal';
import { StepCondition } from './StepCondition';
import { StepConfirm } from './StepConfirm';
import { StepLocation } from './StepLocation';
import { StepUrgency } from './StepUrgency';
import type { ReportDraft } from './types';

const initialDraft: ReportDraft = {
  animalType: 'cat',
  animalCount: 1,
  otherAnimalType: '',
  coatColor: '',
  size: null,
  behavior: null,
  address: '',
  latitude: null,
  longitude: null,
  urgencyChecks: {
    bleeding: false,
    cantMove: false,
    dangerZone: false,
    breathing: false,
  },
  contactPhone: '',
};

export const ReportWizard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mutate: createReport, isPending } = useCreateReportAnimal();

  const [step, setStep] = useState<number>(Step.LOCATION);
  const [submitted, setSubmitted] = useState(false);
  const [caseId, setCaseId] = useState('');
  const [contactError, setContactError] = useState(false);
  const [draft, setDraft] = useState<ReportDraft>(initialDraft);

  const update = (patch: Partial<ReportDraft>) =>
    setDraft((prev) => ({ ...prev, ...patch }));

  const isUrgent = Object.values(draft.urgencyChecks).some(Boolean);

  const getSubmitLabel = () => {
    if (step < TOTAL_STEPS) return t('reportAnimal.wizard.nav_continue');
    if (isPending) return t('reportAnimal.submitting');
    return t('reportAnimal.wizard.nav_submit');
  };

  const renderStep = () => {
    switch (step) {
      case Step.LOCATION:
        return (
          <StepLocation
            address={draft.address}
            latitude={draft.latitude}
            longitude={draft.longitude}
            onAddressChange={(address) => update({ address })}
            onCoordinatesChange={(latitude, longitude) =>
              update({ latitude, longitude })
            }
          />
        );
      case Step.ANIMAL:
        return (
          <StepAnimal
            animalType={draft.animalType}
            animalCount={draft.animalCount}
            otherAnimalType={draft.otherAnimalType}
            onAnimalTypeChange={(animalType) =>
              update({ animalType, otherAnimalType: '' })
            }
            onAnimalCountChange={(animalCount) => update({ animalCount })}
            onOtherAnimalTypeChange={(otherAnimalType) =>
              update({ otherAnimalType })
            }
          />
        );
      case Step.CONDITION:
        return (
          <StepCondition
            coatColor={draft.coatColor}
            size={draft.size}
            behavior={draft.behavior}
            onCoatColorChange={(coatColor) => update({ coatColor })}
            onSizeChange={(size) => update({ size })}
            onBehaviorChange={(behavior) => update({ behavior })}
          />
        );
      case Step.URGENCY:
        return (
          <StepUrgency
            urgencyChecks={draft.urgencyChecks}
            isUrgent={isUrgent}
            onUrgencyChange={(key, checked) =>
              update({
                urgencyChecks: { ...draft.urgencyChecks, [key]: checked },
              })
            }
          />
        );
      case Step.CONFIRM:
        return (
          <StepConfirm
            animalType={draft.animalType}
            animalCount={draft.animalCount}
            behavior={draft.behavior}
            address={draft.address}
            isUrgent={isUrgent}
            contactPhone={draft.contactPhone}
            contactError={contactError}
            onContactPhoneChange={(contactPhone) => {
              setContactError(false);
              update({ contactPhone });
            }}
          />
        );
      default:
        return null;
    }
  };

  const handleSubmit = () => {
    const fullPhone = draft.contactPhone.trim();
    if (!fullPhone || !isValidPhoneNumber(fullPhone)) {
      setContactError(true);
      return;
    }
    const dto: AnimalReportDto = {
      animalType: draft.animalType,
      animalTypeOther:
        draft.animalType === 'other' ? draft.otherAnimalType : undefined,
      age: 'adult',
      appearance: {
        color: draft.coatColor || t('reportAnimal.wizard.unknown'),
        hasInjury: draft.urgencyChecks.bleeding,
        injuryDescription: draft.urgencyChecks.bleeding
          ? t('reportAnimal.wizard.step4_urgency_bleeding')
          : '',
        otherFeatures: [
          draft.size ? t(`reportAnimal.wizard.step3_size_${draft.size}`) : '',
          draft.animalType === 'other' && draft.otherAnimalType
            ? draft.otherAnimalType
            : '',
          draft.animalCount > 1
            ? `${draft.animalCount} ${t(
                'reportAnimal.wizard.step5_animal_count',
                {
                  count: draft.animalCount,
                },
              )}`
            : '',
        ]
          .filter(Boolean)
          .join(', '),
      },
      location: {
        address: draft.address,
        ...(draft.latitude !== null && draft.longitude !== null
          ? { latitude: draft.latitude, longitude: draft.longitude }
          : {}),
      },
      foundTime: new Date().toISOString(),
      status: isUrgent ? 'dangerous' : 'other',
      statusDescription: draft.behavior
        ? t(`reportAnimal.wizard.step3_behavior_${draft.behavior}`)
        : '',
      contactInfo: {
        name: 'Anonymous',
        phone: fullPhone,
        email: '',
      },
    };

    createReport(dto, {
      onSuccess: (data) => {
        setCaseId(
          data?.id ??
            `REP-${Date.now().toString().slice(-FALLBACK_ID_SUFFIX_LENGTH)}`,
        );
        setSubmitted(true);
      },
    });
  };

  if (submitted) {
    return (
      <div className="bg-card border-border rounded-2xl border p-8 text-center shadow-sm">
        <div className="bg-success-light mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
          <CheckCircle className="text-success h-8 w-8" />
        </div>
        <h1 className="text-foreground mb-2 text-2xl font-bold">
          {t('reportAnimal.wizard.success_title')}
        </h1>
        <p className="text-muted-foreground mb-4 text-sm">
          {t('reportAnimal.wizard.case_number_prefix')}
          {caseId}
        </p>
        <p className="text-muted-foreground mb-6 text-sm">
          {t('reportAnimal.wizard.success_volunteers')}
        </p>
        <button
          onClick={() => navigate('/')}
          className="bg-primary text-primary-fg w-full rounded-xl py-3 text-sm font-semibold transition-opacity hover:opacity-90"
        >
          {t('reportAnimal.wizard.success_home')}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-1">
        {STEPS.map((stepConfig, i) => {
          const stepNum = i + 1;
          const isCompleted = stepNum < step;
          const isCurrent = stepNum === step;
          const Icon = stepConfig.icon;

          return (
            <div key={i} className="flex flex-1 items-center gap-1">
              <div className="flex flex-1 flex-col items-center gap-1">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                    isCompleted && 'bg-primary text-primary-fg',
                    isCurrent && 'bg-primary text-primary-fg',
                    !isCompleted &&
                      !isCurrent &&
                      'bg-muted text-muted-foreground',
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                <span
                  className={cn(
                    'text-xs font-medium',
                    isCompleted || isCurrent
                      ? 'text-foreground'
                      : 'text-muted-foreground',
                  )}
                >
                  {t(`reportAnimal.wizard.step${stepNum}_label`)}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <ChevronRight className="text-muted-foreground mb-4 h-4 w-4 flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-card border-border mb-6 rounded-2xl border p-6 shadow-sm">
        {renderStep()}
      </div>

      <div className="flex flex-col gap-2">
        {step > Step.LOCATION && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="border-border text-muted-foreground hover:bg-muted flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('reportAnimal.wizard.nav_back')}
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            if (step < TOTAL_STEPS) setStep((s) => s + 1);
            else handleSubmit();
          }}
          disabled={isPending}
          className="bg-primary text-primary-fg flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {getSubmitLabel()}
        </button>
      </div>
    </div>
  );
};
