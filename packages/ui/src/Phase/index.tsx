import type { ReactNode } from 'react';

interface SectionType {
  label: string | ReactNode;
  value: string | ReactNode;
}

interface Props {
  title?: string | ReactNode;
  sections: SectionType[];
}

export const Phase = (props: Props) => {
  const { title, sections } = props;
  return (
    <div className="border-border mb-3 border-b pb-5">
      {title && <p className="text-2xl font-bold">{title}</p>}
      {sections?.map((section, idx) => (
        <p
          // eslint-disable-next-line react/no-array-index-key
          key={idx}
          className="mt-4 flex flex-row items-center justify-between text-lg"
        >
          <span className="text-text-secondary">{section.label}</span>
          <span> {section.value}</span>
        </p>
      ))}
    </div>
  );
};
