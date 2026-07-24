import { useNavigate } from 'react-router-dom';

import { useFetchRescueCases } from './api/rescueCases.queries';
import { RescueCasesSection } from './components/RescueCasesSection';

const RescueCasesPage = () => {
  const navigate = useNavigate();

  const { data: cases = [] } = useFetchRescueCases();

  const handleCaseClick = (id: string) => {
    navigate(`/rescue/detail/${id}`);
  };

  return <RescueCasesSection cases={cases} onCaseClick={handleCaseClick} />;
};

export { RescueCasesPage };
