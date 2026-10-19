import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Button } from '../../../packages/ui/src/components/button/Button';
import { FileDownloadButton } from '../../../packages/ui/src/components/file-download-button/FileDownloadButton';
import { Loading } from '../../../packages/ui/src/components/loading/Loading';
import { Phase } from '../../../packages/ui/src/components/phase/Phase';
import { PhotoPlaceholder } from '../../../packages/ui/src/components/photo-placeholder/PhotoPlaceholder';
import { PhoneInput } from '../../../packages/ui/src/components/phone-input/PhoneInput';
import { Skeleton } from '../../../packages/ui/src/components/skeleton/Skeleton';
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineSeparator,
} from '../../../packages/ui/src/components/timeline/Timeline';

const buttonMeta = {
  title: 'UI Library/Core Components',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    },
    size: { control: 'select', options: ['default', 'sm', 'lg', 'icon'] },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: { children: 'Button', variant: 'default', size: 'default', loading: false, disabled: false },
} satisfies Meta<typeof Button>;

export default buttonMeta;
type Story = StoryObj<typeof buttonMeta>;

export const ButtonVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      {(['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const).map((variant) => (
        <Button key={variant} variant={variant}>{variant}</Button>
      ))}
    </div>
  ),
};

export const ButtonSizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon" aria-label="Icon button">+</Button>
    </div>
  ),
};

export const ButtonStates: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button>Enabled</Button>
      <Button disabled>Disabled</Button>
      <Button loading>Loading</Button>
      <Button asChild disabled><a href="#disabled-link">Disabled link</a></Button>
    </div>
  ),
};

export const FileDownloadButtonStory: Story = {
  name: 'FileDownloadButton',
  render: () => (
    <FileDownloadButton
      fileName="pawhaven-demo.txt"
      fileType="text/plain"
      label="Download sample file"
      fileFetchRequest={async () => new Blob(['PawHaven UI Storybook sample file'], { type: 'text/plain' })}
      onSuccess={() => window.alert('Sample file downloaded')}
    />
  ),
};

export const LoadingStory: Story = {
  name: 'Loading',
  render: () => <Loading label="Loading rescue data" className="flex min-h-32 items-center justify-center" />,
};

export const SkeletonStory: Story = {
  name: 'Skeleton',
  render: () => (
    <div className="w-full max-w-md space-y-3">
      <Skeleton className="h-5 w-2/5 rounded" />
      <Skeleton className="h-24 w-full rounded-lg" />
      <Skeleton className="h-4 w-4/5 rounded" />
    </div>
  ),
};

export const PhotoPlaceholderStory: Story = {
  name: 'PhotoPlaceholder',
  render: () => <PhotoPlaceholder className="h-48 w-72 rounded-lg" />,
};

export const PhaseStory: Story = {
  name: 'Phase',
  render: () => (
    <div className="w-full max-w-xl">
      <Phase
        title="Rescue case summary"
        sections={[
          { label: 'Animal', value: 'Dog' },
          { label: 'Status', value: 'In progress' },
          { label: 'Assigned volunteer', value: 'Alex Chen' },
        ]}
      />
    </div>
  ),
};

export const TimelineStory: Story = {
  name: 'Timeline compound components',
  render: () => (
    <Timeline className="max-w-lg">
      {[
        ['Case submitted', 'A rescue request was created.', '2026-10-16'],
        ['Volunteer assigned', 'A volunteer accepted the case.', '2026-10-17'],
        ['Animal in care', 'The animal arrived at the shelter.', '2026-10-18'],
      ].map(([title, description, date], index) => (
        <TimelineItem key={title}>
          <TimelineSeparator>
            <TimelineDot variant={index === 2 ? 'primary' : 'default'} />
            {index < 2 && <TimelineConnector />}
          </TimelineSeparator>
          <TimelineContent>
            <p className="font-medium">{title}</p>
            <p className="text-text-secondary text-sm">{description}</p>
            <p className="text-text-secondary mt-1 text-xs">{date}</p>
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  ),
};

export const PhoneInputStory: Story = {
  name: 'PhoneInput',
  render: function PhoneInputDemo() {
    const [phone, setPhone] = useState('+8613800138000');
    return (
      <div className="w-full max-w-sm space-y-2">
        <label htmlFor="storybook-phone" className="text-sm font-medium">Contact phone</label>
        <PhoneInput
          id="storybook-phone"
          phone={phone}
          hasError={false}
          onPhoneChange={setPhone}
        />
        <p className="text-text-secondary text-sm">Current value: {phone || '—'}</p>
      </div>
    );
  },
};
