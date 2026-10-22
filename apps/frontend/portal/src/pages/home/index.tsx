import { useSuspenseQuery } from '@tanstack/react-query';
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { RescueCasesSection } from '../rescue-cases/components/RescueCasesSection';

import { homeQueryOptions } from './api/home.queries';
import { AdoptablePetsSection } from './components/AdoptablePetsSection';
import { Hero } from './components/Hero';
import { StrayCTA } from './components/StrayCTA';

import { routePaths } from '@/app/router/routePaths';

export const Home = () => {
  const navigate = useNavigate();
  const adoptablePetsRef = useRef<HTMLElement>(null);
  const { data } = useSuspenseQuery(homeQueryOptions());
  const { latestRescues, adoptablePets, heroStats } = data;

  const handleCaseClick = (id: string) => {
    navigate(
      routePaths.rescueCaseDetail.replace(':animalID', encodeURIComponent(id)),
    );
  };

  const handleSeeAll = () => {
    navigate(routePaths.rescueCases);
  };

  const handleAdoptClick = () => {
    adoptablePetsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col">
      <Hero heroStats={heroStats} onAdoptClick={handleAdoptClick} />
      <RescueCasesSection
        cases={latestRescues}
        onCaseClick={handleCaseClick}
        onSeeAll={handleSeeAll}
        showStatusSummary={false}
      />
      <AdoptablePetsSection
        pets={adoptablePets}
        sectionRef={adoptablePetsRef}
      />

      <StrayCTA />
    </div>
  );
};
