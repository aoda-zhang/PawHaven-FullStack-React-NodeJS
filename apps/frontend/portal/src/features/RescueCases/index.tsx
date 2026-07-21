import { SuspenseWrapper } from '@pawhaven/ui';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useFetchRescueCases } from './api/rescueCases.queries';
import { CaseDetail } from './components/CaseDetail';
import { RescueCasesSection } from './components/RescueCasesSection';

const RescueCasesPage = () => {
  const { data: cases = [], isLoading, isError } = useFetchRescueCases();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const navigate = useNavigate();

  const selectedCase = selectedId
    ? cases.find((c) => c.id === selectedId)
    : undefined;

  const handleCaseClick = (id: string) => {
    setSelectedId(id);
    navigate(`/rescue-cases/${id}`);
  };

  const handleBack = () => {
    setSelectedId(null);
    navigate('/rescue-cases');
  };

  if (selectedId) {
    return (
      <SuspenseWrapper>
        <CaseDetail
          caseData={selectedCase}
          isLoading={isLoading}
          isError={isError}
          onBack={handleBack}
        />
      </SuspenseWrapper>
    );
  }

  return (
    <SuspenseWrapper>
      <RescueCasesSection cases={cases} onCaseClick={handleCaseClick} />
    </SuspenseWrapper>
  );
};

export { RescueCasesPage };
