import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineSeparator,
} from './Timeline';

const meta = {
  title: 'Components/Timeline',
  component: Timeline,
  tags: ['autodocs'],
} satisfies Meta<typeof Timeline>;

export default meta;
type Story = StoryObj<typeof meta>;

const LAST_ENTRY_INDEX = 2;

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
            <TimelineDot
              variant={index === LAST_ENTRY_INDEX ? 'primary' : 'default'}
            />
            {index < LAST_ENTRY_INDEX && <TimelineConnector />}
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
