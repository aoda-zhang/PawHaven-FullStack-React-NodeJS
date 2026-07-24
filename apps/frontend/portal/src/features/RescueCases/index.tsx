import { useNavigate, useParams } from 'react-router-dom';

import {
  useFetchRescueCase,
  useFetchRescueCases,
} from './api/rescueCases.queries';
import { CaseDetail } from './components/CaseDetail';
import { RescueCasesSection } from './components/RescueCasesSection';

const RescueCasesPage = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();

  const { data: cases = [] } = useFetchRescueCases();
  const {
    data: caseData,
    isLoading: detailLoading,
    isError: detailError,
  } = useFetchRescueCase(caseId ?? '');

  const handleCaseClick = (id: string) => {
    navigate(`/rescue-cases/${id}`);
  };

  const handleBack = () => {
    navigate('/rescue-cases');
  };

  // Route-param driven: if caseId is in URL, render detail.
  if (caseId) {
    return (
      <CaseDetail
        caseData={caseData}
        isLoading={detailLoading}
        isError={detailError}
        onBack={handleBack}
      />
    );
  }

  return <RescueCasesSection cases={cases} onCaseClick={handleCaseClick} />;
};

export { RescueCasesPage };
