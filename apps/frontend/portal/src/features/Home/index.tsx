import { useState } from 'react';

import { CaseDetail } from '../RescueCases/components/CaseDetail';
import { RescueCasesSection } from '../RescueCases/components/RescueCasesSection';
import { mockRescueCases } from '../RescueCases/mockData';

import { Hero } from './components/Hero';

export const Home = () => {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  const selectedCase = selectedCaseId
    ? mockRescueCases.find((c) => c.id === selectedCaseId)
    : undefined;

  if (selectedCaseId && selectedCase) {
    return (
      <div className="flex flex-col">
        <CaseDetail
          caseData={selectedCase}
          isLoading={false}
          isError={false}
          onBack={() => setSelectedCaseId(null)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <Hero />
      <RescueCasesSection
        cases={mockRescueCases}
        onCaseClick={setSelectedCaseId}
      />
    </div>
  );
};
