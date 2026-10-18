import { useSuspenseQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { RescueCasesSection } from '../rescue-cases/components/RescueCasesSection';

import { homeQueryOptions } from './api/home.queries';
import { AdoptablePetsSection } from './components/AdoptablePetsSection';
import { Hero } from './components/Hero';
import { StrayCTA } from './components/StrayCTA';

export const Home = () => {
  const navigate = useNavigate();
  const { data } = useSuspenseQuery(homeQueryOptions());
  const { latestRescues, adoptablePets, heroStats } = data;

  const handleCaseClick = (id: string) => {
    navigate(`/rescue/detail/${id}`);
  };

  const handleSeeAll = () => {
    navigate('/rescue-cases');
  };

  return (
    <div className="flex flex-col">
      <Hero heroStats={heroStats} />
      <RescueCasesSection
        cases={latestRescues}
        onCaseClick={handleCaseClick}
        onSeeAll={handleSeeAll}
        showStatusSummary={false}
      />
      <AdoptablePetsSection pets={adoptablePets} />

      <StrayCTA />
    </div>
  );
};
