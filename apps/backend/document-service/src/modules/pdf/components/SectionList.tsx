import type { ReactElement } from 'react';
import type { PdfSection } from '@pawhaven/shared/types';

export interface SectionListProps {
  sections: PdfSection[];
}

export const SectionList = ({ sections }: SectionListProps): ReactElement => (
  <>
    {sections.map((section, sectionIndex) => (
      <article
        key={`section-${sectionIndex}`}
        className="border-yellow-6 bg-brown-1 mb-5 break-inside-avoid rounded border-l-4 px-4 py-3.5"
      >
        <div className="mb-1.5 flex items-baseline gap-3">
          <span className="text-yellow-6 min-w-7 text-base leading-none font-extrabold">
            {String(sectionIndex + 1).padStart(2, '0')}
          </span>
          <h2 className="text-yellow-9 m-0 text-sm font-bold">
            {section.title}
          </h2>
        </div>
        <p className="text-label text-brown-10 m-0">{section.text}</p>
        {section.bullets?.length ? (
          <ul className="marker:text-brown-9 mt-2 list-disc pl-5">
            {section.bullets.map((bullet, bulletIndex) => (
              <li
                key={`${sectionIndex}-${bulletIndex}`}
                className="text-label text-brown-9 mb-1"
              >
                {bullet}
              </li>
            ))}
          </ul>
        ) : null}
      </article>
    ))}
  </>
);
