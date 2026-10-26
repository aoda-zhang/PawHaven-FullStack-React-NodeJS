import type { ReactElement } from 'react';
import type { PdfContacts } from '@pawhaven/shared/types';

export interface ContactsProps {
  contacts: PdfContacts | undefined;
}

export const Contacts = ({ contacts }: ContactsProps): ReactElement => (
  <>
    {contacts?.items?.length ? (
      <section className="border-border bg-primary-light rounded-panel mx-10 mb-5 break-inside-avoid border px-5 py-4">
        <h3 className="text-label tracking-label text-accent-foreground mb-2.5 font-bold uppercase">
          {contacts.title}
        </h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
          {contacts.items.map((contact, contactIndex) => (
            <div
              key={`contact-${contactIndex}`}
              className="border-border bg-card rounded-input flex flex-col gap-0.5 border px-2.5 py-2"
            >
              <span className="text-fineprint tracking-print text-warning-hover font-semibold uppercase">
                {contact.label}
              </span>
              <span className="text-label text-primary-active font-bold">
                {contact.value}
              </span>
            </div>
          ))}
        </div>
      </section>
    ) : null}
  </>
);
