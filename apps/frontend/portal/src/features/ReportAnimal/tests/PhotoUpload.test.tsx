// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';

import type { ReportAnimalFormValues } from '@pawhaven/shared/types';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { PhotoUpload } from '../components/PhotoUpload';

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual('react-i18next');
  return {
    ...(actual as Record<string, unknown>),
    useTranslation: () => ({ t: (key: string) => key }),
  };
});

vi.mock('lucide-react', () => ({
  ImagePlus: () => null,
  Trash2: () => null,
}));

vi.mock('@pawhaven/ui', () => ({
  Button: ({ children }: { children?: ReactNode }) => (
    <button type="button">{children}</button>
  ),
  Loading: () => null,
  notificationType: {},
  showToast: vi.fn(),
  ToastType: {},
}));

const revokeObjectUrl = vi.fn();
let urlCounter = 0;

const nextObjectUrl = (): string => {
  urlCounter += 1;
  return `blob:mock-${urlCounter}`;
};

beforeAll(() => {
  URL.createObjectURL = vi.fn(nextObjectUrl);
  URL.revokeObjectURL = revokeObjectUrl;
});

const imageFile = (name: string, type = 'image/jpeg') =>
  new File(['fake-image'], name, { type });

const renderPhotoUpload = () => {
  const state: { getPhotos: () => File[] | undefined } = {
    getPhotos: () => [],
  };
  const Harness = () => {
    const form = useForm<ReportAnimalFormValues>({
      defaultValues: { photos: [] },
    });
    state.getPhotos = () => form.getValues('photos');
    return (
      <FormProvider {...form}>
        <PhotoUpload />
      </FormProvider>
    );
  };
  const utils = render(<Harness />);
  const selector = 'input[type="file"]';
  const input = utils.container.querySelector(selector);
  if (!input) {
    throw new Error('file input not found');
  }
  return { ...utils, input, state };
};

describe('PhotoUpload (MultiImageUpload)', () => {
  it('renders an add action and a file input', () => {
    const { input } = renderPhotoUpload();

    const addButton = screen.getByRole('button', {
      name: 'imageUpload.add',
    });
    expect(addButton).toBeDefined();
    expect(input).not.toBeNull();
  });

  it('adds multiple image files to the form value', () => {
    const { input, state } = renderPhotoUpload();

    fireEvent.change(input, {
      target: { files: [imageFile('a.jpg'), imageFile('b.png', 'image/png')] },
    });

    expect(state.getPhotos()).toHaveLength(2);
    const removeButtons = screen.getAllByRole('button', {
      name: 'imageUpload.remove',
    });
    expect(removeButtons).toHaveLength(2);
  });

  it('blocks more than the max count', () => {
    const { input, state } = renderPhotoUpload();

    const six = Array.from({ length: 6 }, (_, i) => imageFile(`p${i}.jpg`));
    fireEvent.change(input, { target: { files: six } });

    expect(state.getPhotos()).toHaveLength(0);
    expect(screen.getByText('imageUpload.too_many')).toBeDefined();
  });

  it('rejects non-image files and keeps valid ones', () => {
    const { input, state } = renderPhotoUpload();

    fireEvent.change(input, {
      target: {
        files: [imageFile('a.jpg'), imageFile('notes.txt', 'text/plain')],
      },
    });

    expect(state.getPhotos()).toHaveLength(1);
    expect(screen.getByText('imageUpload.format')).toBeDefined();
  });

  it('removes a photo', () => {
    const { input, state } = renderPhotoUpload();

    fireEvent.change(input, {
      target: { files: [imageFile('a.jpg'), imageFile('b.png', 'image/png')] },
    });
    const removeButtons = screen.getAllByRole('button', {
      name: 'imageUpload.remove',
    });
    fireEvent.click(removeButtons[0]);

    expect(state.getPhotos()).toHaveLength(1);
  });

  it('revokes the preview url when a photo is removed', () => {
    const { input } = renderPhotoUpload();

    fireEvent.change(input, {
      target: { files: [imageFile('a.jpg'), imageFile('b.png', 'image/png')] },
    });
    revokeObjectUrl.mockClear();

    const removeButtons = screen.getAllByRole('button', {
      name: 'imageUpload.remove',
    });
    fireEvent.click(removeButtons[0]);

    expect(revokeObjectUrl).toHaveBeenCalledTimes(1);
  });
});
