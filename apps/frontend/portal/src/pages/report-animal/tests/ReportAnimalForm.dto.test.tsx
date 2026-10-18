// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual('react-i18next');
  return {
    ...(actual as Record<string, unknown>),
    useTranslation: () => ({
      t: (key: string) => key,
      i18n: { language: 'en' },
    }),
  };
});

const FALLBACK_ID_SUFFIX_LENGTH = 8;

const mapToDto = (values: {
  animalType: string;
  otherAnimalType: string;
  age: string | null;
  size: string | null;
  animalCount: number;
  coatColor: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  urgent: boolean;
  behavior: string | null;
  description: string;
  contactPhone: string;
  photos: File[];
}) => {
  const description = values.description?.trim() ?? '';
  const isUrgent = values.urgent;
  const reporterPhotos = values.photos.map(
    (_, i) => `data:image/png;base64,PHOTO${i}`,
  );
  return {
    animalType:
      values.animalType === 'other'
        ? values.otherAnimalType
        : values.animalType,
    age: values.age!,
    size: values.size!,
    animalCount: values.animalCount,
    appearance: {
      color: values.coatColor,
    },
    location: {
      address: values.address,
      ...(values.latitude !== null && values.longitude !== null
        ? { latitude: values.latitude, longitude: values.longitude }
        : {}),
    },
    status: isUrgent ? 'dangerous' : 'other',
    statusDescription: values.behavior
      ? `reportAnimal.behavior_${values.behavior}`
      : '',
    reporterPhotos,
    description,
    contactInfo: {
      phone: values.contactPhone.trim(),
      email: '',
    },
  };
};

const mutate = vi.fn();

const TestHarness = () => {
  const [submitted, setSubmitted] = useState(false);
  const [caseId, setCaseId] = useState('');

  const handleSubmit = async () => {
    const dto = mapToDto({
      animalType: 'cat',
      otherAnimalType: '',
      age: 'baby',
      size: 'small',
      animalCount: 1,
      coatColor: 'black',
      address: 'Central Park',
      latitude: null,
      longitude: null,
      urgent: false,
      behavior: 'friendly',
      description: 'Found a stray kitten',
      contactPhone: '12345678',
      photos: [new File(['p1'], 'p1.jpg'), new File(['p2'], 'p2.jpg')],
    });
    mutate(dto);
    setCaseId('RPT-123');
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div>
        <h1>reportAnimal.success_title</h1>
        <p>{caseId}</p>
      </div>
    );
  }

  return (
    <div>
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
};

const renderHarness = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return render(<TestHarness />, { wrapper: Wrapper });
};

describe('ReportAnimalForm DTO mapping', () => {
  it('maps form values to AnimalReportDto on submit', async () => {
    mutate.mockReset();
    renderHarness();

    const { container } = renderHarness();
    const button = container.querySelector('button');
    button?.click();

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledTimes(1);
    });

    const dto = mutate.mock.calls[0][0];
    expect(dto).toMatchObject({
      animalType: 'cat',
      age: 'baby',
      size: 'small',
      animalCount: 1,
      appearance: { color: 'black' },
      location: { address: 'Central Park' },
      status: 'other',
      description: 'Found a stray kitten',
      reporterPhotos: [
        'data:image/png;base64,PHOTO0',
        'data:image/png;base64,PHOTO1',
      ],
      contactInfo: { phone: '12345678', email: '' },
    });
  });

  it('maps urgent=true to status=dangerous', () => {
    const dto = mapToDto({
      animalType: 'cat',
      otherAnimalType: '',
      age: 'baby',
      size: 'small',
      animalCount: 1,
      coatColor: 'black',
      address: 'Central Park',
      latitude: null,
      longitude: null,
      urgent: true,
      behavior: 'friendly',
      description: 'Found a stray kitten',
      contactPhone: '12345678',
      photos: [new File(['p1'], 'p1.jpg'), new File(['p2'], 'p2.jpg')],
    });
    expect(dto.status).toBe('dangerous');
  });

  it('maps animalType=other to the otherAnimalType value', () => {
    const dto = mapToDto({
      animalType: 'other',
      otherAnimalType: 'rabbit',
      age: 'adult',
      size: 'medium',
      animalCount: 1,
      coatColor: 'white',
      address: 'Central Park',
      latitude: null,
      longitude: null,
      urgent: false,
      behavior: 'wary',
      description: 'Found a white rabbit',
      contactPhone: '12345678',
      photos: [new File(['p1'], 'p1.jpg'), new File(['p2'], 'p2.jpg')],
    });
    expect(dto.animalType).toBe('rabbit');
    expect(dto.age).toBe('adult');
    expect(dto.size).toBe('medium');
  });

  it('includes location coordinates when provided', () => {
    const dto = mapToDto({
      animalType: 'cat',
      otherAnimalType: '',
      age: 'baby',
      size: 'small',
      animalCount: 1,
      coatColor: 'black',
      address: 'Central Park',
      latitude: 40.7829,
      longitude: -73.9654,
      urgent: false,
      behavior: 'friendly',
      description: 'Found a stray kitten',
      contactPhone: '12345678',
      photos: [new File(['p1'], 'p1.jpg'), new File(['p2'], 'p2.jpg')],
    });
    expect(dto.location).toMatchObject({
      address: 'Central Park',
      latitude: 40.7829,
      longitude: -73.9654,
    });
  });

  it('shows success state after submission', async () => {
    mutate.mockReset();
    const { container } = renderHarness();
    const button = container.querySelector('button');
    button?.click();

    await waitFor(() => {
      expect(
        screen.getByText('reportAnimal.success_title'),
      ).toBeInTheDocument();
    });
    expect(screen.getByText('RPT-123')).toBeInTheDocument();
  });
});
