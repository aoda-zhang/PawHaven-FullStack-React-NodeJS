import type { ReactElement } from 'react';
import type { PdfChecklist } from '@pawhaven/shared/types';

export interface ChecklistProps {
  checklist: PdfChecklist | undefined;
}

export const Checklist = ({ checklist }: ChecklistProps): ReactElement => (
  <>
    {checklist?.items?.length ? (
      <section className="border-orange-3 bg-orange-1 mx-10 mb-5 break-inside-avoid rounded-lg border px-5 py-4">
        <h3 className="text-label tracking-label text-orange-9 mb-2.5 font-bold uppercase">
          {checklist.title}
        </h3>
        <ul className="m-0 list-none p-0">
          {checklist.items.map((item, itemIndex) => (
            <li
              key={`checklist-${itemIndex}`}
              className="text-label text-orange-10 before:border-yellow-6 mb-1.5 flex items-start gap-2 before:mt-1 before:h-2.5 before:w-2.5 before:shrink-0 before:rounded-sm before:border before:content-['']"
            >
              {item}
            </li>
          ))}
        </ul>
      </section>
    ) : null}
  </>
);
