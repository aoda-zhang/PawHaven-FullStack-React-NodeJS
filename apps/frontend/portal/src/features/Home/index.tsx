import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { RescueCasesSection } from '../RescueCases/components/RescueCasesSection';
import { mockRescueCases } from '../RescueCases/mockData';

import { Hero } from './components/Hero';

export const Home = () => {
  const navigate = useNavigate();

  const handleCaseClick = useCallback(
    (id: string) => {
      navigate(`/rescue/detail/${id}`);
    },
    [navigate],
  );

  return (
    <div className="flex flex-col">
      <Hero />
      <RescueCasesSection
        cases={mockRescueCases}
        onCaseClick={handleCaseClick}
      />
    </div>
  );
};
