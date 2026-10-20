import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { PhoneInput } from './PhoneInput';

const meta = {
  title: 'Components/PhoneInput',
  component: PhoneInput,
  tags: ['autodocs'],
  args: {
    phone: '+8613800138000',
    onPhoneChange: () => undefined,
  },
} satisfies Meta<typeof PhoneInput>;

export default meta;
type Story = StoryObj<typeof meta>;

const PhoneInputDemo = () => {
  const [phone, setPhone] = useState('+8613800138000');
  return (
    <div className="w-full max-w-sm space-y-2">
      <label htmlFor="storybook-phone" className="text-sm font-medium">
        Contact phone
      </label>
      <PhoneInput id="storybook-phone" phone={phone} onPhoneChange={setPhone} />
      <p className="text-text-secondary text-sm">
        Current value: {phone || '—'}
      </p>
    </div>
  );
};

export const PhoneInputStory: Story = {
  name: 'PhoneInput',
  render: () => <PhoneInputDemo />,
};
