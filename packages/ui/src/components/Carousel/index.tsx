import Autoplay from 'embla-carousel-autoplay';
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from 'embla-carousel-react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import {
  useEffect,
  useState,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
} from 'react';

import { cn } from '../../utils/cn';
import { Button } from '../Button';

type CarouselApi = UseEmblaCarouselType[1];
type CarouselPlugin = Parameters<typeof useEmblaCarousel>[1];

const DEFAULT_AUTOPLAY_DELAY_MS = 4000;

export interface CarouselImage {
  src: string;
  alt?: string;
}

export interface CarouselProps {
  images: Array<string | CarouselImage>;
  autoplay?: boolean;
  autoplayDelay?: number;
  loop?: boolean;
  showControls?: boolean;
  objectFit?: 'cover' | 'contain';
  className?: string;
  imageClassName?: string;
  previousLabel?: string;
  nextLabel?: string;
}

interface NavButtonProps extends ComponentPropsWithoutRef<typeof Button> {
  label: string;
}

const NavButton = ({
  label,
  className,
  children,
  ...props
}: NavButtonProps) => (
  <Button
    variant="outline"
    size="icon"
    className={cn(
      'absolute top-1/2 size-8 -translate-y-1/2 rounded-full',
      className,
    )}
    aria-label={label}
    {...props}
  >
    {children}
    <span className="sr-only">{label}</span>
  </Button>
);

const toCarouselImages = (
  images: Array<string | CarouselImage>,
): CarouselImage[] =>
  images.map((image) => (typeof image === 'string' ? { src: image } : image));

export const Carousel = ({
  images,
  autoplay = false,
  autoplayDelay = DEFAULT_AUTOPLAY_DELAY_MS,
  loop = false,
  showControls = true,
  objectFit = 'cover',
  className,
  imageClassName,
  previousLabel = 'Previous slide',
  nextLabel = 'Next slide',
}: CarouselProps) => {
  const [plugins] = useState<CarouselPlugin>(() =>
    autoplay
      ? [Autoplay({ delay: autoplayDelay, stopOnInteraction: true })]
      : undefined,
  );

  const [carouselRef, api] = useEmblaCarousel({ loop }, plugins);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [trackedApi, setTrackedApi] = useState<CarouselApi>();
  if (trackedApi !== api) {
    setTrackedApi(api);
    setCanScrollPrev(api?.canScrollPrev() ?? false);
    setCanScrollNext(api?.canScrollNext() ?? false);
  }

  useEffect(() => {
    const sync = () => {
      if (!api) return;
      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
    };

    if (api) {
      api.on('reInit', sync);
      api.on('resize', sync);
      api.on('select', sync);
    }

    return () => {
      if (api) {
        api.off('reInit', sync);
        api.off('resize', sync);
        api.off('select', sync);
      }
    };
  }, [api]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      api?.scrollPrev();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      api?.scrollNext();
    }
  };

  const slides = toCarouselImages(images);
  const imageClass = cn(
    'h-full w-full',
    objectFit === 'contain' ? 'object-contain' : 'object-cover',
    imageClassName,
  );

  if (slides.length === 0) return null;

  if (slides.length === 1) {
    return (
      <img
        src={slides[0].src}
        alt={slides[0].alt ?? ''}
        className={imageClass}
      />
    );
  }

  return (
    <div
      onKeyDownCapture={handleKeyDown}
      className={cn('relative h-full', className)}
      role="region"
      aria-roledescription="carousel"
    >
      <div ref={carouselRef} className="h-full overflow-hidden">
        <div className="flex h-full">
          {slides.map((slide) => (
            <div
              key={slide.src}
              role="group"
              aria-roledescription="slide"
              className="h-full min-w-0 shrink-0 grow-0 basis-full"
            >
              <img
                src={slide.src}
                alt={slide.alt ?? ''}
                className={imageClass}
              />
            </div>
          ))}
        </div>
      </div>

      {showControls && (
        <>
          <NavButton
            label={previousLabel}
            disabled={!canScrollPrev}
            onClick={() => api?.scrollPrev()}
            className="left-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </NavButton>
          <NavButton
            label={nextLabel}
            disabled={!canScrollNext}
            onClick={() => api?.scrollNext()}
            className="right-2"
          >
            <ArrowRight className="h-4 w-4" />
          </NavButton>
        </>
      )}
    </div>
  );
};
