import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { FileDownloadButton } from './FileDownloadButton';

const meta = {
  title: 'Components/FileDownloadButton',
  component: FileDownloadButton,
  tags: ['autodocs'],
  args: {
    fileFetchRequest: async () => new Blob([]),
    fileName: 'pawhaven-demo.txt',
  },
} satisfies Meta<typeof FileDownloadButton>;

export default meta;
type Story = StoryObj<typeof meta>;

const FileDownloadButtonDemo = () => {
  const [status, setStatus] = useState('Not downloaded yet');
  return (
    <div className="space-y-3">
      <FileDownloadButton
        fileName="pawhaven-demo.txt"
        fileFetchRequest={async () =>
          new Blob(['PawHaven UI Storybook sample file'], {
            type: 'text/plain',
          })
        }
        onSuccess={() => setStatus('Sample file downloaded')}
        onError={() => setStatus('Sample file download failed')}
      >
        Download sample file
      </FileDownloadButton>
      <p className="text-text-secondary text-sm" role="status">
        {status}
      </p>
    </div>
  );
};

export const FileDownloadButtonStory: Story = {
  name: 'FileDownloadButton',
  render: () => <FileDownloadButtonDemo />,
};
