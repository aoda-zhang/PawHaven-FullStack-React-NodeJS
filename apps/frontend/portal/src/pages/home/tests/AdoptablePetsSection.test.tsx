import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AdoptablePetsSection } from '../components/AdoptablePetsSection';
import type { AdoptablePet } from '../types';

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual('react-i18next');
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
      i18n: { language: 'en-US' },
    }),
  };
});

vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual,
    ChevronRight: () => null,
    Clock: () => null,
    Heart: () => null,
  };
});

const mockPet: AdoptablePet = {
  id: 'PET-0001',
  name: 'Milo',
  animalType: 'cat',
  age: '2 years',
  sex: 'male',
  breed: 'Domestic',
  location: 'Test Location',
  waitingDays: 10,
  tags: ['Friendly'],
  photo: '/pet.jpg',
  rescuedFrom: 'Street',
  rescueDuration: '1 month',
  medicalRecords: ['Vaccinated'],
  temperament: 'Calm',
  adoptionStatus: 'available',
};

describe('AdoptablePetsSection', () => {
  it('renders skeleton while loading', () => {
    render(<AdoptablePetsSection pets={[]} onPetClick={vi.fn()} isLoading />);

    expect(screen.getByTestId('adoptable-pets-skeleton')).toBeDefined();
    expect(screen.queryByText('home.forever_home_no_pets')).toBeNull();
  });

  it('renders pets after loading', () => {
    render(<AdoptablePetsSection pets={[mockPet]} onPetClick={vi.fn()} />);

    expect(screen.queryByTestId('adoptable-pets-skeleton')).toBeNull();
    expect(screen.getByText('Milo')).toBeDefined();
  });

  it('renders the name without an animal type icon', () => {
    render(
      <AdoptablePetsSection
        pets={[{ ...mockPet, animalType: 'cat' }]}
        onPetClick={vi.fn()}
      />,
    );

    expect(screen.getByText('Milo')).toBeDefined();
    expect(screen.queryByText('🐱')).toBeNull();
    expect(screen.queryByText('🐾')).toBeNull();
  });

  it('turns the card into a native button when a click handler is given', async () => {
    const onPetClick = vi.fn();
    render(<AdoptablePetsSection pets={[mockPet]} onPetClick={onPetClick} />);

    const card = screen.getByRole('button', { name: 'Milo' });
    expect(card).toHaveAttribute('type', 'button');

    await userEvent.click(card);
    expect(onPetClick).toHaveBeenCalledWith('PET-0001');
  });

  it('keeps the card read-only when no click handler is given', () => {
    render(<AdoptablePetsSection pets={[mockPet]} />);

    expect(screen.queryByRole('button', { name: 'Milo' })).toBeNull();
    expect(screen.getByText('Milo')).toBeDefined();
  });
});
