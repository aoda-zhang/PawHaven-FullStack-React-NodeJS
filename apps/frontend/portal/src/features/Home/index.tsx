import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { RescueCasesSection } from '../RescueCases/components/RescueCasesSection';

import {
  useFetchAdoptablePets,
  useFetchLatestRescues,
} from './api/home.queries';
import { AdoptablePetsSection } from './components/AdoptablePetsSection';
import { Hero } from './components/Hero';
import { StrayCTA } from './components/StrayCTA';

const LATEST_RESCUE_LIMIT = 4;

export const Home = () => {
  const navigate = useNavigate();
  const { data: cases = [] } = useFetchLatestRescues(LATEST_RESCUE_LIMIT);
  const { data: pets = [] } = useFetchAdoptablePets();

  const handleCaseClick = useCallback(
    (id: string) => {
      navigate(`/rescue/detail/${id}`);
    },
    [navigate],
  );

  const handleSeeAll = useCallback(() => {
    navigate('/rescue-cases');
  }, [navigate]);

  const handlePetClick = useCallback(
    (id: string) => {
      navigate(`/adopt/detail/${id}`);
    },
    [navigate],
  );

  const handleSeeAllPets = useCallback(() => {
    navigate('/adopt');
  }, [navigate]);

  return (
    <div className="flex flex-col">
      <Hero />
      <RescueCasesSection
        cases={cases}
        onCaseClick={handleCaseClick}
        onSeeAll={handleSeeAll}
        showStatusSummary={false}
      />
      <AdoptablePetsSection
        pets={pets}
        onPetClick={handlePetClick}
        onSeeAll={handleSeeAllPets}
      />

      <StrayCTA />
    </div>
  );
};
