import { Box, Container, Typography } from '@mui/material';
import { FileDownloadButton } from '@pawhaven/frontend-core';
import { showToast } from '@pawhaven/ui';
import { ArrowDownToLine } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { getRescueGuideDocs } from './apis/request';
import { StepCard } from './components/StepCard';

export const RescueGuide = () => {
  const { t } = useTranslation();
  const stepsContent = t('rescueGuide.steps', {
    returnObjects: true,
  }) as Array<{
    icon: string;
    title: string;
    desc: string;
  }>;
  return (
    <div className="bg-[url('/images/hero1.png')] bg-cover bg-center">
      <Container sx={{ py: 6 }}>
        <Typography variant="h3" gutterBottom fontWeight="bold">
          {t('rescueGuide.title')}
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {t('rescueGuide.intro')}
        </Typography>

        <Box
          display="grid"
          gap={3}
          gridTemplateColumns={{
            xs: '1fr',
            md: 'repeat(5,1fr)',
          }}
        >
          {stepsContent.map((step) => (
            <StepCard key={step.title} {...step} />
          ))}
        </Box>

        <p className="flex justify-center m-6">
          <FileDownloadButton
            fileFetchRequest={getRescueGuideDocs}
            onError={() => {
              showToast({
                type: 'error',
                message: t('rescueGuide.download_failed'),
              });
            }}
            fileType="PDF"
            contentClassName="flex items-center text-2xl bold cursor-pointer p-4 rounded-2xl"
          >
            <ArrowDownToLine />
            <span>{t('rescueGuide.download_guide')}</span>
          </FileDownloadButton>
        </p>
      </Container>
    </div>
  );
};
