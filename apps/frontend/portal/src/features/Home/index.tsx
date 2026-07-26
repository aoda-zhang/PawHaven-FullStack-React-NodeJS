import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { useFetchRescueCases } from '../RescueCases/api/rescueCases.queries';
import { RescueCasesSection } from '../RescueCases/components/RescueCasesSection';

import { Hero } from './components/Hero';

export const Home = () => {
  const navigate = useNavigate();
  const { data: cases = [] } = useFetchRescueCases();

  const handleCaseClick = useCallback(
    (id: string) => {
      navigate(`/rescue/detail/${id}`);
    },
    [navigate],
  );

  const handleSeeAll = useCallback(() => {
    navigate('/rescue-cases');
  }, [navigate]);

  return (
    <div className="flex flex-col">
      <Hero />
      <RescueCasesSection
        cases={cases}
        onCaseClick={handleCaseClick}
        onSeeAll={handleSeeAll}
      />
    </div>
  );
};
